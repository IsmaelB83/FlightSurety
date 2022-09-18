// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {

    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       CONSTANTS                                          */
    /********************************************************************************************/
    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;
    // Oracles status
    uint256 public constant REGISTRATION_FEE = 1 ether;
    uint256 private constant MIN_RESPONSES = 3;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/
    // Account used to deploy contract
    address private contractOwner;

    // Data smart contract
    FlightSuretyData flightSuretyData;

    // Airlines votes
    mapping(address => address[]) airlinesVotes;
 
    // Oracle state
    uint8 private nonce = 0;    

    // Oracles providing information about flight status
    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }
    mapping(address => Oracle) private oracles;
    uint8 numOracles = 0;

    // Information provided by oracles
    struct ResponseInfo {
        address requester;                              
        bool isOpen;
        mapping(uint8 => address[]) responses;
    }
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/
    modifier requireIsOperational() {
        require(flightSuretyData.isOperational() == true, "Contract is currently not operational");  
        _;
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       EVENTS                                             */
    /********************************************************************************************/
    event OracleRequest(uint8 index, address airline, bytes32 flight, uint256 timestamp);
    event OracleReport(address airline, bytes32 flight, uint256 timestamp, uint8 status);
    event FlightStatusInfo(address airline, bytes32 flight, uint256 timestamp, uint8 status);

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/
    constructor (address dataContract, address firstAirline) {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContract);
        // If data has 0 airlines register the founder airline at this time
        if (flightSuretyData.getNumAirlines() == 0) {
            flightSuretyData.registerFirstAirline(firstAirline);
        }
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/
    function isOperational() public view returns(bool) {
        return flightSuretyData.isOperational();
    }

    function getNumOracles() public view returns(uint8) {
        return numOracles;
    }

    function getOracleResponses(uint8 index, address airline, bytes32 flight, uint256 timestamp, uint8 status) public view returns(address requester, bool isOpen, address[] memory responses) {
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        ResponseInfo storage responseInfo = oracleResponses[key];
        return(responseInfo.requester, responseInfo.isOpen, responseInfo.responses[status]);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
    function registerAirline(address account) external returns(bool success, uint256 votes) {
        if (flightSuretyData.getNumAirlines() < 4) {
            require(msg.sender == flightSuretyData.getFirstAirline(), "First four airlines should be registered by the founder airline");
            require(flightSuretyData.isFundedAirline(msg.sender), "First airlines should provide funding first");
            flightSuretyData.registerAirline(account);
            flightSuretyData.acceptAirline(account);
            return (true, 1);
        } else {
            require(msg.sender == account, "Only the founder airlines was able to register other airlines in the beggining");
            flightSuretyData.registerAirline(msg.sender);
            airlinesVotes[msg.sender] = new address[](0);
            return (true, 0);
        }
    }

    function voteAirline(address account) external {
        // Voting is only required after the fifth ailines registered
        uint256 numAirlines = flightSuretyData.getNumAirlines();
        require(numAirlines >= 4, "There need to be at least 4 airlines to vote for join");
        // Only waiting airlines to join can be voted in
        require(flightSuretyData.isRegisteredAirline(account), "Airline sould be registered first");
        require(!flightSuretyData.isAcceptedAirline(account), "Airline shouldnt be accepted already");
        // One airline can vote just once for another airline to join
        bool isDuplicate = false;
        for (uint256 i = 0; i < airlinesVotes[account].length; i++) {
            if ( airlinesVotes[account][i] == msg.sender) {
                isDuplicate = true;
                break;
            }
        }
        require(isDuplicate == false, "An airline can vote just once for another airline to join");
        // Vote and check 50%
        airlinesVotes[account].push(msg.sender);
        if (airlinesVotes[account].length >= (numAirlines / 2)) {
            flightSuretyData.acceptAirline(account);
        }
    }

    function registerFlight (string memory flight, uint256 timestamp) external {
        flightSuretyData.registerFlight(msg.sender, flight, timestamp, STATUS_CODE_UNKNOWN);
    }

    function processFlightStatus (address airline, bytes32 flight, uint8 statusCode) internal {
        flightSuretyData.updateFlight(airline, flight, statusCode);
        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            flightSuretyData.creditInsurees(flight);
        }
    }

    function fetchFlightStatus (address airline, bytes32 flight, uint256 timestamp) external {
        uint8 index = getRandomIndex(msg.sender);
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        ResponseInfo storage newResponseInfo = oracleResponses[key];
        newResponseInfo.requester = msg.sender;
        newResponseInfo.isOpen = true;
        emit OracleRequest(index, airline, flight, timestamp);
    }

    /********************************************************************************************/
    /*                                    ORACLES FUNCTIONS                                     */
    /********************************************************************************************/
    function registerOracle () external payable {
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");
        uint8[3] memory indexes = generateIndexes(msg.sender);
        oracles[msg.sender] = Oracle({ isRegistered: true, indexes: indexes });
        numOracles++;
    }

    function getMyIndexes () view external returns(uint8[3] memory) {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");
        return oracles[msg.sender].indexes;
    }

    function submitOracleResponse (uint8 index, address airline, bytes32 flight, uint256 timestamp, uint8 statusCode) external {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");
        oracleResponses[key].responses[statusCode].push(msg.sender);
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
            oracleResponses[key].isOpen = false;
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);
            processFlightStatus(airline, flight, statusCode);
        }
    }

    /********************************************************************************************/
    /*                                 UTILITY INTERNAL FUNCTIONS                               */
    /********************************************************************************************/
    function generateIndexes (address account) internal returns(uint8[3] memory) {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        for (uint256 i = 0; i < 25; i++) {
            indexes[1] = getRandomIndex(account);
            if (indexes[0] != indexes[1])
                break;
        }
        for (uint256 i = 0; i < 25; i++) {
            indexes[2] = getRandomIndex(account);
            if (indexes[0] != indexes[2] && indexes[1] != indexes[2])
                break;
        }
        return indexes;
    }

    function getRandomIndex(address account) internal returns(uint8){
        uint8 maxValue = 10;
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);
        if (nonce > 250) {
            nonce = 0;
        }
        return random;
    }
    
    /********************************************************************************************/
    /*                  AUXILIARY METHODS INTERNAL TO SMART CONTRACT                            */
    /********************************************************************************************/
    function getFlightKey (address airline, string memory flight, uint256 timestamp) pure internal returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }
}