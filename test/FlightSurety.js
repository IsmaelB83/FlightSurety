
// Importing the StartNotary Smart Contract ABI (JSON representation of the Smart Contract)
const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');

contract('Flight Surety Tests', async (accounts) => { 

    let contractOwner = accounts[0];
    let firstAirline = accounts[1];
    let secondAirline = accounts[2];
    let thirdAirline = accounts[3];
    let fourthAirline = accounts[4];
    let fifthAirline = accounts[5];
    let sixthAirline = accounts[6];
    let seventhAirline = accounts[7];
    let passenger = accounts[8];

    it('set authorized contract', async function () {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyData.setAuthorizedContract(flightSuretyApp.address, true);
        let status = await flightSuretyData.isAuthorizedContract(flightSuretyApp.address);
        assert.equal(status, true, 'Contract App is properly authorized');
    });

    it('has correct initial isOperational() value', async function () {
        let flightSuretyData = await FlightSuretyData.deployed();
        let status = await flightSuretyData.isOperational();
        assert.equal(status, true, 'Incorrect initial operating status value');
    });

    it('Non-contract owner cannot access to setOperatingStatus', async function () {
        let flightSuretyData = await FlightSuretyData.deployed();
        let accessDenied = false;
        try  {
            await flightSuretyData.setOperatingStatus(false, { from: firstAirline });
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

    it('can block access to functions using requireIsOperational when operating status is false', async function () {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        let error = false;
        try  {
            await flightSuretyApp.registerAirline(secondAirline, {from: firstAirline});
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
            await flightSuretyApp.registerAirline(secondAirline, { from: firstAirline });
        } catch (e) {
        }
        let result = await flightSuretyData.isMemberAirline(secondAirline);
        assert.equal(result, false, 'Airline should not be able to register another airline without first funding');
    });

    it('First airline can register additional airlines after funding', async () => {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyData.fund({from: firstAirline, value: web3.utils.toWei('10', 'ether')})
        try {
            await flightSuretyApp.registerAirline(secondAirline, { from: firstAirline });
        } catch (e) {
        }
        let result = await flightSuretyData.isRegisteredAirline(secondAirline);
        assert.equal(result, true, 'Airline should be able to register another airline if it has provided fundind already');
    });

    it('First airline can register only 3 additional airlines.', async () => {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();

        await flightSuretyApp.registerAirline(thirdAirline, { from: firstAirline });
        await flightSuretyApp.registerAirline(fourthAirline, { from: firstAirline });
        let exception = false;
        try {
            await flightSuretyApp.registerAirline(fifthAirline, { from: firstAirline });
        } catch (e) {
            exception = true;
        }
        assert.equal(exception, true, 'First airline cannot register more than three airlines');
    });

    it('Fifth airline requires voting to be accepted', async () => {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyApp.registerAirline(fifthAirline, { from: fifthAirline });
        assert.equal(await flightSuretyData.isRegisteredAirline(fifthAirline), true, 'Fifth airline is not registered');
        assert.equal(await flightSuretyData.isAcceptedAirline(fifthAirline), false, 'Fifth airline requires voting to be accepted');
    });

    it('Test voting process', async () => {
        let flightSuretyApp = await FlightSuretyApp.deployed();
        let flightSuretyData = await FlightSuretyData.deployed();
        // Provide funds for other members to vote
        await flightSuretyData.fund({from: secondAirline, value: web3.utils.toWei('10', 'ether')})
        await flightSuretyData.fund({from: thirdAirline, value: web3.utils.toWei('10', 'ether')})
        await flightSuretyData.fund({from: fourthAirline, value: web3.utils.toWei('10', 'ether')})
        // Vote to accept fifth airline
        await flightSuretyApp.voteAirline(fifthAirline, { from: firstAirline });
        assert.equal(await flightSuretyData.isAcceptedAirline(fifthAirline), false, 'Fifth airline requires 50% member votes');
        await flightSuretyApp.voteAirline(fifthAirline, { from: secondAirline });
        assert.equal(await flightSuretyData.isAcceptedAirline(fifthAirline), true, 'Fifth airline requires 50% member votes');
    });
});
