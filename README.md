# FlightSurety
FlightSurety is a sample application project for Udacity's Blockchain course.

## Install
This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.
To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Tests to check functionality
 isma@ismalinux  ~/Desktop/code/blockchain/FlightSurety   master ±  truffle test
Using network 'development'.


Compiling your contracts...
===========================
```
Using network 'development'.


Compiling your contracts...
===========================
> Compiling ./contracts/FlightSuretyApp.sol
> Compiling ./contracts/FlightSuretyData.sol
> Artifacts written to /tmp/test--95426-EnVSUbxgF06R
> Compiled successfully using:
   - solc: 0.8.16+commit.07a7930e.Emscripten.clang


  Contract: FlightSuretyApp and FlightSuretyData Tests
    ✔ Set authorized contract
    ✔ Has correct initial isOperational value
    ✔ Non-contract owner cannot access to setOperatingStatus (253ms)
    ✔ Contract owner can access to setOperatingStatus
    ✔ Can block access to functions using requireIsOperational when operating status is false (69ms)
    ✔ Founder airline cannot register additional airlines if it has not provided funding
    ✔ First airline can register additional airlines after funding (106ms)
    ✔ First airline can register only 3 additional airlines. (153ms)
    ✔ Fifth airline requires voting to be accepted (205ms)
    ✔ Test voting process (183ms)
    ✔ An accepted airline can register flights (144ms)
    ✔ Passenger can purchase insurance (89ms)

  Contract: Oracles Tests
Oracle Registered (0xF1FE089069dF35C2cE9aF63cA04d9a479ab88C98): 1, 0, 8
Oracle Registered (0x5Fed1ee0BaeFbB1D76719f21632aEE7360DCcf94): 3, 5, 4
Oracle Registered (0x71F0b0b5C13DB51099678C0608269663748B0c5f): 0, 4, 7
Oracle Registered (0xbAa4064d839D0863b29272290c76F61b6E69FF16): 5, 3, 6
Oracle Registered (0x4b718e5344A3A0E87762d213aA05eF702Fe4DFb7): 5, 9, 3
Oracle Registered (0x9eCBEf3dd634541951Ab994f43CC5B408d4927B2): 7, 2, 6
Oracle Registered (0x33b26166da780c8E3B10ce80CABaf03344f30019): 7, 1, 0
Oracle Registered (0xc34D6aEe0c27293bFc393316927ABa82a04A06db): 0, 5, 6
Oracle Registered (0x8f55f94AC607394B972BF77F09B9FEf4bAa54e3b): 4, 7, 0
Oracle Registered (0xCb558ABbfaA80Ab7E4408a2b9e7E9fd29345476f): 3, 8, 5
Oracle Registered (0x26e23d9F1FdD56797b6C15b440745328D19A2fAf): 3, 6, 2
Oracle Registered (0xcedDFF4C7C05C2Bf5A95e50cA1120da7Eda9a052): 5, 8, 6
Oracle Registered (0xD656538DDdd25B2248A041603519F562626cCA38): 6, 8, 0
Oracle Registered (0xAAA02B423432e7bfBF6Dd63444b84e6d59d5bb29): 1, 3, 7
Oracle Registered (0x313800345aA227B08412DcD4154e33D16bBDDd25): 9, 0, 5
Oracle Registered (0xC04452B638505698560D040e70EE666347E54EC6): 9, 1, 8
Oracle Registered (0x2B515d3c54Fc42426586094872B54C20e4b1f4f9): 8, 5, 4
Oracle Registered (0x3497C06292b1720940892537A941F654C892b60D): 6, 9, 3
Oracle Registered (0x1991ec91fe4e9E0b995904D548762f9E75Fc830c): 7, 1, 5
Oracle Registered (0x8c202D2495ecf7305DCa39355e0823D92F108aE7): 3, 1, 5
    ✔ can register oracles (3090ms)
EVENT - Oracle Requested: 0 - 0xde25930acb591b5a344edfa94c2694d33a1eadd7f24d2ae19ca56412314fb0af 
EVENT - Oracle Reports (0xF1FE089069dF35C2cE9aF63cA04d9a479ab88C98): 0xde25930acb591b5a344edfa94c2694d33a1eadd7f24d2ae19ca56412314fb0af - STATUS_CODE_ON_TIME
EVENT - Oracle Reports (0x71F0b0b5C13DB51099678C0608269663748B0c5f): 0xde25930acb591b5a344edfa94c2694d33a1eadd7f24d2ae19ca56412314fb0af - STATUS_CODE_ON_TIME
EVENT - Oracle Reports (0x33b26166da780c8E3B10ce80CABaf03344f30019): 0xde25930acb591b5a344edfa94c2694d33a1eadd7f24d2ae19ca56412314fb0af - STATUS_CODE_ON_TIME
EVENT - Flight Status (0x33b26166da780c8E3B10ce80CABaf03344f30019): 0xde25930acb591b5a344edfa94c2694d33a1eadd7f24d2ae19ca56412314fb0af - STATUS_CODE_ON_TIME
    ✔ can request flight status (768ms)
EVENT - Oracle Requested: 4 - 0xa465dc4643ff411fbec75f9dd93305b322bd8456b3c6bb38a7128b5db9d38aae 
EVENT - Oracle Reports (0x5Fed1ee0BaeFbB1D76719f21632aEE7360DCcf94): 0xa465dc4643ff411fbec75f9dd93305b322bd8456b3c6bb38a7128b5db9d38aae - STATUS_CODE_LATE_AIRLINE
EVENT - Oracle Reports (0x71F0b0b5C13DB51099678C0608269663748B0c5f): 0xa465dc4643ff411fbec75f9dd93305b322bd8456b3c6bb38a7128b5db9d38aae - STATUS_CODE_LATE_AIRLINE
EVENT - Oracle Reports (0x8f55f94AC607394B972BF77F09B9FEf4bAa54e3b): 0xa465dc4643ff411fbec75f9dd93305b322bd8456b3c6bb38a7128b5db9d38aae - STATUS_CODE_LATE_AIRLINE
EVENT - Flight Status (0x8f55f94AC607394B972BF77F09B9FEf4bAa54e3b): 0xa465dc4643ff411fbec75f9dd93305b322bd8456b3c6bb38a7128b5db9d38aae - STATUS_CODE_LATE_AIRLINE
    ✔ can paid passengers if delayed by airline (760ms)
    ✔ can withdraw passengers (42ms)
```