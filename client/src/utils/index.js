// Types
const NETWORKS = {
    "1": "Mainnet",
    "3": "Ropsten",
    "4": "Rinkeby",
    "5": "Goerli",
    "42": "Kovan",
    "1337": "Ganache"
}
    
export function networkIdText(id) {
    return NETWORKS[id];
}