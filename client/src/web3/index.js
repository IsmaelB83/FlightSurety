// Node modules
import Web3 from "web3";
// Own imports
import { networkIdText } from '../utils/index';
// MDB Components
// Components
// Statics
// Styles

let connection = null;

/**
 * Connects to web3 provider (metamask) and return connection information
 * @returns connection information
 */
export async function connect () {
    // Connection
    const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
    const accounts = await web3.eth.requestAccounts();
    const networkId = await web3.eth.net.getId();
    connection = {
        web3: web3,
        account: accounts[0],
        networkId: networkId,
    }
    // FlightSuretyApp
    const flightSuretyApp = require("../contracts/FlightSuretyApp.json");
    if (flightSuretyApp) {
        try {
            let { abi } = flightSuretyApp;
            connection.addressApp = flightSuretyApp.networks[networkId].address;
            connection.flightSuretyApp = new web3.eth.Contract(abi, connection.addressApp);
        } catch (err) {
            alert(`Contract flightSuretyApp not found on network ${networkIdText(networkId)}`)
        }
    }
    // FlightSuretyData
    const flightSuretyData = require("../contracts/FlightSuretyData.json");
    if (flightSuretyData) {
        try {
            let { abi } = flightSuretyData;
            connection.addressData = flightSuretyData.networks[networkId].address;
            connection.flightSuretyData = new web3.eth.Contract(abi, connection.addressData);
        } catch (err) {
            alert(`Contract flightSuretyData not found on network ${networkIdText(networkId)}`)
        }   
    }
    // Return connection
    return connection;
}

/**
 * 
 * @returns 
 */
 export async function harvest (upc, name, info, latitude, longitude, notes) {
    return await connection.contract.methods.harvestItem(upc, connection.account, name, info, latitude, longitude, notes).send({from: connection.account});
}

/**
 * 
 * @returns 
 */
 export async function process (upc) {
    return await connection.contract.methods.processItem(upc).send({from: connection.account});
}

/**
 * 
 * @returns 
 */
 export async function pack (upc) {
    return await connection.contract.methods.packItem(upc).send({from: connection.account});
}

/**
 * 
 * @returns 
 */
 export async function addItem (upc, units) {
    return await connection.contract.methods.addItem(upc, units).send({from: connection.account});
}

/**
 * 
 * @returns 
 */
export async function putForSale (upc, price) {
    return await connection.contract.methods.putForSale(upc, price).send({from: connection.account});
}

/**
 * 
 * @returns 
 */
 export async function buyItem (upc, value) {
    console.log(value)
    return await connection.contract.methods.buyItem(upc).send({from: connection.account, value: value});
}

/**
 * 
 * @returns 
 */
 export async function shipItem (upc) {
    return await connection.contract.methods.shipItem(upc).send({from: connection.account});
}

/**
 * 
 * @returns 
 */
 export async function receiveItem (upc) {
    return await connection.contract.methods.receiveItem(upc).send({from: connection.account});
}

/**
 * 
 * @returns 
 */
 export async function purchaseItem (upc) {
    return await connection.contract.methods.purchaseItem(upc).send({from: connection.account});
}


/**
 * Fecth product information
 * @param {*} upc Product id
 * @returns Object with the product information
 */
export async function fetchItem (upc) {
    const fetch1 = await connection.contract.methods.fetchItemBufferOne(upc).call();
    const fetch2 = await connection.contract.methods.fetchItemBufferTwo(upc).call();
    return {
        farmId: fetch1[3],
        farmName: fetch1[4],
        farmInfo: fetch1[5],
        farmLatitude: fetch1[6],
        farmLongitude: fetch1[7],
        ownerId: fetch1[2],
        productNotes: fetch2[3],
        productUpc: fetch1[1],
        productSku: fetch1[0],
        productPrice: fetch2[4],
        productState: fetch2[5],
        distributorId: fetch2[6],
        retailerId: fetch2[7],
        consumerId: fetch2[8]
    }
}