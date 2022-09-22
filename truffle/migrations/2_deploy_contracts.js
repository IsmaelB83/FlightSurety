const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function(deployer) {

    let firstAirline = '0x5dD7a0e663A6C7d0508416854e44E9acF6937Eee';
    deployer.deploy(FlightSuretyData)
    .then(result => deployer.deploy(FlightSuretyApp, result.address, firstAirline, "Iberia"));
}