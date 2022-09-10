
const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const BigNumber = require('bignumber.js');

const Config = async function(accounts) {
    
    const testAddresses = [
        "0x99fb0Ab83f638Af30B3433f1F785a4E34903832D",
        "0x5dD7a0e663A6C7d0508416854e44E9acF6937Eee",
        "0xE46666E8D2c9EE0F6170938298bBF349613f454C",
        "0x667643664B481fB801e351D6ffBA3D88CA6ea77d",
        "0xacb1A249f046143A7DF900408eaeACe296CF84C1",
        "0xAe76E4EA4Ca4A609cf39bcA850792714C032C762",
        "0x4abc37C1CeDf3d5Ca3f15122a30585c824fb55a9",
        "0xB3da9b85551D41d1adCBb718F3b6c8b6DC6fe980",
        "0x6656a2Ca68Ef6a7F53EEFE45d92916132F4f44db",
        "0xC9b569a4246F8Ea8662B0a795A0562a2a9F8e5dd"
    ];

    const owner = accounts[0];
    const firstAirline = accounts[1];
    const flightSuretyData = await FlightSuretyData.new();
    const flightSuretyApp = await FlightSuretyApp.new();
    
    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};