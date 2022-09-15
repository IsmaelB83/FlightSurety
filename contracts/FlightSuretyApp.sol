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
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    // Account used to deploy contract
    address private contractOwner;

    // Data smart contract
    FlightSuretyData flightSuretyData;

    // Airlines votes
    mapping(address => address[]) airlinesVotes;
 
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

    modifier requireMemberAirline() {
        require(flightSuretyData.isMemberAirline(msg.sender), "Caller should be a member airline");
        _;
    }

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

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
    function registerAirline(address account) external returns(bool success, uint256 votes) {
        // The registration and voting criteria (50%) should be located in the APP smart contract not in the data contract
        // this is because the criteria to accept an airline to join the group could change in the future (business rules) and
        // therefore it's better not to mixed this business rules with the data smart contract.
        if (flightSuretyData.getNumAirlines() < 4) {
            require(msg.sender == flightSuretyData.getFirstAirline(), "First four airlines should be registered by the founder airline");
            require(flightSuretyData.isMemberAirline(msg.sender), "First airlines should provide funding first");
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

    function voteAirline(address account) external requireMemberAirline {
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

   /**
    * @dev Register a future flight for insuring.
    */  
    function registerFlight (bytes32 flight) external requireMemberAirline {
        flightSuretyData.registerFlight(flight, STATUS_CODE_UNKNOWN);
    }
    
   /**
    * @dev Called after oracle has updated flight status
    */  
    function processFlightStatus (address airline, string memory flight, uint256 timestamp, uint8 statusCode) internal pure {
    }

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus (address airline, string memory flight, uint256 timestamp ) external {
        uint8 index = getRandomIndex(msg.sender);
        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        ResponseInfo storage newResponseInfo = oracleResponses[key];
        newResponseInfo.requester = msg.sender;
        newResponseInfo.isOpen = true;
        emit OracleRequest(index, airline, flight, timestamp);
    } 


    // region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle () external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");
        uint8[3] memory indexes = generateIndexes(msg.sender);
        oracles[msg.sender] = Oracle({ isRegistered: true, indexes: indexes });
    }

    function getMyIndexes () view external returns(uint8[3] memory) {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");
        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse (uint8 index, address airline, string memory flight, uint256 timestamp, uint8 statusCode) external {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");
        oracleResponses[key].responses[statusCode].push(msg.sender);
        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);
            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey (address airline, string memory flight, uint256 timestamp ) pure internal returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes (address account) internal returns(uint8[3] memory) {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }
        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }
        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex (address account) internal returns (uint8) {
        uint8 maxValue = 10;
        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);
        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }
        return random;
    }

    // endregion
}   
