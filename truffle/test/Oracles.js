// Node Imports
const truffleAssert = require("truffle-assertions");

// Contracts
const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');

// Oracles constants
const TEST_ORACLES_COUNT = 20;
const ORACLES_START_INDEX = 10;

// Status codes 
const STATUS = {
    STATUS_CODE_UNKNOWN: 0,
    STATUS_CODE_ON_TIME: 10,
    STATUS_CODE_LATE_AIRLINE: 20,
    STATUS_CODE_LATE_WEATHER: 30,
    STATUS_CODE_LATE_TECHNICAL: 40,
    STATUS_CODE_LATE_OTHER: 50,
}
// Status to text
const STATUS_TEXT = {
	0: "STATUS_CODE_UNKNOWN",
	10: "STATUS_CODE_ON_TIME",
	20: "STATUS_CODE_LATE_AIRLINE",
	30: "STATUS_CODE_LATE_WEATHER",
    40: "STATUS_CODE_LATE_TECHNICAL",
    50: "STATUS_CODE_LATE_OTHER",
}
const statusToText = status => STATUS_TEXT[status];


contract('Oracles Tests', async (accounts) => {

    let flightSuretyApp;
    let flightSuretyData;
    let airline_1 = accounts[1];
    let passenger_1 = accounts[7];
    let insurance = 1;
    let timestamp = Math.floor(Date.now() / 1000);
    let flightOnTime;
    let flightDelayed;

    before('Prepare tests', async () => {
        flightSuretyApp = await FlightSuretyApp.deployed();
        flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyData.setAuthorizedContract(flightSuretyApp.address, true);
        await flightSuretyData.fund({from: airline_1, value: web3.utils.toWei('10', 'ether')});
        await flightSuretyApp.registerFlight("IB3410", timestamp, {from: airline_1});
        flightOnTime = await flightSuretyData.getFlightInfo(airline_1, "IB3410", timestamp);
        await flightSuretyApp.registerFlight("IB5410", timestamp, {from: airline_1});
        flightDelayed = await flightSuretyData.getFlightInfo(airline_1, "IB5410", timestamp);
        await flightSuretyData.buy(flightDelayed.flightKey, {from: passenger_1, value: web3.utils.toWei(insurance.toString(), 'ether')})
    });

    it('can register oracles', async () => {    
        let fee = await flightSuretyApp.REGISTRATION_FEE.call();
        for(let i = ORACLES_START_INDEX; i < ORACLES_START_INDEX + TEST_ORACLES_COUNT; i++) {      
            await flightSuretyApp.registerOracle({from: accounts[i], value: fee});
            let result = await flightSuretyApp.getMyIndexes({from: accounts[i]});
            console.log(`Oracle Registered (${accounts[i]}): ${result[0]}, ${result[1]}, ${result[2]}`);                    
        }
        assert.equal(await flightSuretyApp.getNumOracles(), TEST_ORACLES_COUNT, 'Not all oracles registered');
    });

    it('can request flight status', async () => {
        let timestampReq = Math.floor(Date.now() / 1000);
        // Submit a request for oracles to get status information for a flight
        let tx = await flightSuretyApp.fetchFlightStatus(airline_1, flightOnTime.flightKey, timestampReq);
        truffleAssert.eventEmitted(tx, 'OracleRequest', ev => {
            console.log(`EVENT - Oracle Requested: ${ev.index.toNumber()} - ${ev.flight} `);
            return ev.flight == flightOnTime.flightKey && ev.timestamp.toNumber() == timestampReq;
        })
        // Test oracle requests by brute force
        for(let i = ORACLES_START_INDEX; i < ORACLES_START_INDEX + TEST_ORACLES_COUNT; i++) {
            let oracleIndexes = await flightSuretyApp.getMyIndexes.call({ from: accounts[i]});
            for(let j = 0; j < oracleIndexes.length; j++) {
                try {
                    let tx = await flightSuretyApp.submitOracleResponse(oracleIndexes[j], airline_1, flightOnTime.flightKey, timestampReq, STATUS.STATUS_CODE_ON_TIME, { from: accounts[i] });
                    truffleAssert.eventEmitted(tx, 'OracleReport', ev => {
                        console.log(`EVENT - Oracle Reports (${accounts[i]}): ${ev.flight} - ${statusToText(ev.status)}`);
                        return true;
                    });
                    // Flight status info event will raise only when minimum accepted answers are provided by oracles
                    let flightStatusChanged = false;
                    try {
                        truffleAssert.eventEmitted(tx, 'FlightStatusInfo', ev => {
                            flightStatusChanged = true;
                            console.log(`EVENT - Flight Status (${accounts[i]}): ${ev.flight} - ${statusToText(ev.status)}`);
                            return true;
                        });                           
                    } catch (error) {
                    }
                    if (flightStatusChanged) {
                        let aux = await flightSuretyData.getFlightInfoByKey(flightOnTime.flightKey)
                        assert.equal(aux.statusCode.toNumber(), STATUS.STATUS_CODE_ON_TIME, 'Flight status not updated');
                    }
                } catch (error) {
                    if (error.reason !== 'Flight or timestamp do not match oracle request') {
                        console.log(error);
                        throw error;
                    }
                }                    
            }
        }
    });

    it('can paid passengers if delayed by airline', async () => {
        let timestampReq = Math.floor(Date.now() / 1000);
        let balancePre = await flightSuretyData.getPassengerBalance({from: passenger_1});
        // Submit a request for oracles to get status information for a flight
        let tx = await flightSuretyApp.fetchFlightStatus(airline_1, flightDelayed.flightKey, timestampReq);
        truffleAssert.eventEmitted(tx, 'OracleRequest', ev => {
            console.log(`EVENT - Oracle Requested: ${ev.index.toNumber()} - ${ev.flight} `);
            return ev.flight == flightDelayed.flightKey && ev.timestamp.toNumber() == timestampReq;
        })
        // Force update to Delayed by airline
        for(let i = ORACLES_START_INDEX; i < ORACLES_START_INDEX + TEST_ORACLES_COUNT; i++) {
            let oracleIndexes = await flightSuretyApp.getMyIndexes.call({ from: accounts[i]});
            for(let j = 0; j < oracleIndexes.length; j++) {
                try {
                    let tx = await flightSuretyApp.submitOracleResponse(oracleIndexes[j], airline_1, flightDelayed.flightKey, timestampReq, STATUS.STATUS_CODE_LATE_AIRLINE, { from: accounts[i] });
                    truffleAssert.eventEmitted(tx, 'OracleReport', ev => {
                        console.log(`EVENT - Oracle Reports (${accounts[i]}): ${ev.flight} - ${statusToText(ev.status)}`);
                        return true;
                    });
                    let flightStatusChanged = false;
                    try {
                        truffleAssert.eventEmitted(tx, 'FlightStatusInfo', ev => {
                            console.log(`EVENT - Flight Status (${accounts[i]}): ${ev.flight} - ${statusToText(ev.status)}`);
                            flightStatusChanged = true;
                            return true;
                        });                           
                    } catch (error) {
                    }
                    if (flightStatusChanged) {
                        let aux = await flightSuretyData.getFlightInfoByKey(flightDelayed.flightKey)
                        assert.equal(aux.statusCode.toNumber(), STATUS.STATUS_CODE_LATE_AIRLINE, 'Flight status not updated');
                        let balancePost = await flightSuretyData.getPassengerBalance({from: passenger_1});
                        assert.equal(parseFloat(web3.utils.fromWei(balancePre, 'ether')) + (insurance * 1.5), parseFloat(web3.utils.fromWei(balancePost, 'ether')), "Passenger balances updated");
                    }
                } catch (error) {
                    if (error.reason !== 'Flight or timestamp do not match oracle request') {
                        console.log(error);
                        throw error;
                    }                    
                }
            }
        }
    });

    it('can withdraw passengers', async () => {
        // Balances before withdraw
        const balancePassenger = parseFloat(web3.utils.fromWei(await flightSuretyData.getPassengerBalance({from: passenger_1}), 'ether')).toFixed(2);
        const balanceContract = parseFloat(web3.utils.fromWei(await web3.eth.getBalance(FlightSuretyData.address), 'ether')).toFixed(2);
        const passengerBalance = parseFloat(web3.utils.fromWei(await web3.eth.getBalance(passenger_1), 'ether')).toFixed(2);
        // Passenger withdraw balance (1.5 the amount he put in the insurance)
        await flightSuretyData.pay({from: passenger_1})
        // Balances post withdraw
        const balancePostPassenger = parseFloat(web3.utils.fromWei(await flightSuretyData.getPassengerBalance({from: passenger_1}), 'ether')).toFixed(2);
        const balancePostContract = parseFloat(web3.utils.fromWei(await web3.eth.getBalance(FlightSuretyData.address), 'ether')).toFixed(2);
        const passengerPostBalance = parseFloat(web3.utils.fromWei(await web3.eth.getBalance(passenger_1), 'ether')).toFixed(2);
        // Checks
        assert.equal(balancePassenger, insurance * 1.5, "Passenger original balance in contract incorrect");
        assert.equal(balancePostPassenger, 0, "Passenger final balance in contract incorrect");
        assert.equal(balanceContract - balancePostContract, insurance * 1.5, "Smart contract balance is not credit properly");
        assert.equal(passengerPostBalance - passengerBalance, insurance * 1.5, "Passenger is not withdrawn 1.5x insurance");
    });
});
