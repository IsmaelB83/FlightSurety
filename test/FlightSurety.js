
// Importing the StartNotary Smart Contract ABI (JSON representation of the Smart Contract)
const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');

contract('FlightSuretyApp', async (accounts) => { 

    let contractOwner = accounts[0];
    let airline_1 = accounts[1];
    let airline_2 = accounts[2];
    let airline_3 = accounts[3];
    let airline_4 = accounts[4];
    let airline_5 = accounts[5];
    let passenger_1 = accounts[7];
    let passenger_2 = accounts[8];

    it('Set authorized contract', async function () {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyData.setAuthorizedContract(flightSuretyApp.address, true);
        let status = await flightSuretyData.isAuthorizedContract(flightSuretyApp.address);
        assert.equal(status, true, 'Contract App is properly authorized');
    });

    it('Has correct initial isOperational value', async function () {
        let flightSuretyData = await FlightSuretyData.deployed();
        let status = await flightSuretyData.isOperational();
        assert.equal(status, true, 'Incorrect initial operating status value');
    });

    it('Non-contract owner cannot access to setOperatingStatus', async function () {
        let flightSuretyData = await FlightSuretyData.deployed();
        let accessDenied = false;
        try  {
            await flightSuretyData.setOperatingStatus(false, { from: airline_1 });
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, 'Access not restricted to non contract owner');
        await flightSuretyData.setOperatingStatus(false, { from: contractOwner });
        let status = await flightSuretyData.isOperational();
        assert.equal(status, false, 'Change status to false not working');
        await flightSuretyData.setOperatingStatus(true, { from: contractOwner });
        status = await flightSuretyData.isOperational();
        assert.equal(status, true, 'Revert back status to true not working');
    });

    it('Contract owner can access to setOperatingStatus', async function () {
        let flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyData.setOperatingStatus(false, { from: contractOwner });
        let status = await flightSuretyData.isOperational();
        assert.equal(status, false, 'Change status to false not working');
    });

    it('Can block access to functions using requireIsOperational when operating status is false', async function () {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        let error = false;
        try  {
            await flightSuretyApp.registerAirline(airline_2, {from: airline_1});
        }
        catch(e) {
            error = true;
        }
        assert.equal(error, true, 'Access not blocked for requireIsOperational');
        // Set it back for other tests to work
        await flightSuretyData.setOperatingStatus(true);
    });

    it('Founder airline cannot register additional airlines if it has not provided funding', async () => {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        try {
            await flightSuretyApp.registerAirline(airline_2, { from: airline_1 });
        } catch (e) {
        }
        let result = await flightSuretyData.isMemberAirline(airline_2);
        assert.equal(result, false, 'Airline should not be able to register another airline without first funding');
    });

    it('First airline can register additional airlines after funding', async () => {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyData.fund({from: airline_1, value: web3.utils.toWei('10', 'ether')})
        try {
            await flightSuretyApp.registerAirline(airline_2, { from: airline_1 });
        } catch (e) {
        }
        let result = await flightSuretyData.isRegisteredAirline(airline_2);
        assert.equal(result, true, 'Airline should be able to register another airline if it has provided fundind already');
    });

    it('First airline can register only 3 additional airlines.', async () => {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        await flightSuretyApp.registerAirline(airline_3, { from: airline_1 });
        await flightSuretyApp.registerAirline(airline_4, { from: airline_1 });
        let exception = false;
        try {
            await flightSuretyApp.registerAirline(airline_5, { from: airline_1 });
        } catch (e) {
            exception = true;
        }
        assert.equal(exception, true, 'First airline cannot register more than three airlines');
    });

    it('Fifth airline requires voting to be accepted', async () => {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyApp.registerAirline(airline_5, { from: airline_5 });
        assert.equal(await flightSuretyData.isRegisteredAirline(airline_5), true, 'Fifth airline is not registered');
        assert.equal(await flightSuretyData.isAcceptedAirline(airline_5), false, 'Fifth airline requires voting to be accepted');
    });

    it('Test voting process', async () => {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        // Provide funds for other members to vote
        await flightSuretyData.fund({from: airline_2, value: web3.utils.toWei('10', 'ether')})
        await flightSuretyData.fund({from: airline_3, value: web3.utils.toWei('10', 'ether')})
        await flightSuretyData.fund({from: airline_4, value: web3.utils.toWei('10', 'ether')})
        // Vote to accept fifth airline
        await flightSuretyApp.voteAirline(airline_5, { from: airline_1 });
        assert.equal(await flightSuretyData.isAcceptedAirline(airline_5), false, 'Fifth airline requires 50% member votes');
        await flightSuretyApp.voteAirline(airline_5, { from: airline_2 });
        assert.equal(await flightSuretyData.isAcceptedAirline(airline_5), true, 'Fifth airline requires 50% member votes');
    });

    it('An accepted airline can register flights', async () => {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyApp.registerFlight("IB3410", {from: airline_1})
        await flightSuretyApp.registerFlight("BA5410", {from: airline_1})
        assert.equal((await flightSuretyData.getFlightInfo("IB3410")).airline, airline_1, "Flight not registered properly");
        assert.equal((await flightSuretyData.getFlightInfo("BA5410")).airline, airline_1, "Flight not registered properly");
    });

    it('Passenger can purchase insurance', async () => {
        let flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyData.buy("IB3410", {from: passenger_1, value: web3.utils.toWei('1', 'ether')})           
        await flightSuretyData.buy("IB3410", {from: passenger_2, value: web3.utils.toWei('1', 'ether')})           
        let aux = await flightSuretyData.getInsurances("IB3410");
        assert.equal(aux.length, 2, "Returned insurances are two")
        assert.equal(aux[0].passenger, passenger_1, "First insurance has wrong pasenger information");
        assert.equal(web3.utils.fromWei(aux[0].amount, 'ether'), 1, "First insurance has wrong amount information");
        assert.equal(aux[1].passenger, passenger_2, "Second insurance has wrong pasenger information");
        assert.equal(web3.utils.fromWei(aux[1].amount, 'ether'), 1, "Second insurance has wrong amount information");
    });
});