// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {

    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Account used to deploy contract
    address private contractOwner;                                      

    // Blocks all state changes throughout the contract if false
    bool private operational = true;                                    

    // Only authorized contracts can perform write transactions
    mapping(address => bool) private authorized;
     
    // Airlines information
    struct Airline {
        bool isRegistered;
        bool isAccepted;
        bool isMember;
        uint256 balance;
    }
    mapping(address => Airline) private airlines;
    uint8 numAirlines;
    
    // Flights information
    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights;
    
    // Insurances information
    struct Insurance {
        address passenger;
        uint256 amount;
    }
    mapping(bytes32 => Insurance[]) private insurances;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    constructor () {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _;
    }

    modifier requireContractOwner() {
        require(tx.origin == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthorizedContract() {
        require(authorized[msg.sender] == true, "Not an authorized contract call");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/
    function isOperational() public view returns(bool)  {
        return operational;
    }

    function setOperatingStatus (bool mode) external requireContractOwner {
        operational = mode;
    }

    function isAuthorizedContract(address contractAddress) external view returns(bool) {
        return authorized[contractAddress];
    }

    function setAuthorizedContract(address contractAddress, bool status) external requireContractOwner {
        authorized[contractAddress] = status;
    }

    function getNumAirlines () external view returns (uint8) {
        return numAirlines;
    }

    function isMemberAirline() external view returns(bool){
        return airlines[msg.sender].isMember;
    }

    function getAirlineInfo(address account) external view returns (bool, bool, bool, uint256) {
        require(airlines[account].isRegistered, "Airlines is not registered");
        Airline memory aux = airlines[account];
        return (aux.isRegistered, aux.isAccepted, aux.isMember, aux.balance);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
    function registerFirstAirline (address account) external requireIsOperational requireContractOwner {
        require(numAirlines == 0, "Only first airline can be registered here");
        airlines[account] = Airline(true, true, false, 0);
        numAirlines = 1;
    }

    function registerAirline (address account) external requireIsOperational requireAuthorizedContract {
        require(airlines[account].isRegistered == false, "Airline already registered");
        airlines[account] = Airline(true, false, false, 0);
        numAirlines++;
    }

    function acceptAirline (address account) external requireIsOperational requireAuthorizedContract {
        require(airlines[account].isRegistered, "Airline should be registered first");
        airlines[account].isAccepted = true;
    }

    function registerFlight (bytes32 flight, uint8 status) external requireIsOperational requireAuthorizedContract {
        require(flights[flight].isRegistered == false, "Flight already registered");
        flights[flight] = Flight(true, status, block.timestamp, msg.sender);
    }

   /**
    * @dev Buy insurance for a flight
    */   
    function buy () external payable requireIsOperational requireAuthorizedContract {
    }

   /**
    *  @dev Credits payouts to insurees
    */
    function creditInsurees () external requireIsOperational requireAuthorizedContract {
    }  

   /**
    *  @dev Transfers eligible payout funds to insuree
    */
    function pay () external requireIsOperational requireAuthorizedContract {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights resulting in insurance payouts, the contract should be self-sustaining
    */   
    function fund () public payable requireIsOperational requireAuthorizedContract {
    }

    function getFlightKey (address airline, string memory flight, uint256 timestamp) pure internal returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }
}