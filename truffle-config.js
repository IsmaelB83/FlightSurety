// Import .env file
require('dotenv').config();
// Node imports
const HDWalletProvider = require("truffle-hdwallet-provider");

// Constants
const { INFURA_SECRET, INFURA_KEY, MNEMONIC } = process.env;
const RINKEBY_CONNECTION = `https://:${INFURA_SECRET}@rinkeby.infura.io/v3/${INFURA_KEY}`

module.exports = {
    
    networks: {
        development: {
            host: "127.0.0.1",          
            port: 8545,
            network_id: "*",
        },
        rinkeby: {
            provider: () => new HDWalletProvider(MNEMONIC, RINKEBY_CONNECTION),
            network_id: 4,
            gas: 4500000,
            gasPrice: 10000000000
        },
    },

    mocha: {
        timeout: 100000
    },

    compilers: {
        solc: {
        version: "0.8.16",
        }
    },
};