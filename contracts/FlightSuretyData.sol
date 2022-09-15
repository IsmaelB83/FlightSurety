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
    address[] private airlinesArray = new address[](0);
    
    // Flights information
    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights;
    bytes32[] private flightsArray = new bytes32[](0);
    
    // Insurances information
    struct Insurance {
        address passenger;
        uint256 amount;
    }
    mapping(bytes32 => Insurance[]) private insurances;
    bytes32[] private insurancesArray = new bytes32[](0);

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

    modifier requireAcceptedAirline(){
        require(airlines[msg.sender].isAccepted, "Airline not yet accepted");
        _;
    }

    modifier requireMemberAirline(){
        require(airlines[msg.sender].isMember, "Airline not yet provided funding");
        _;
    }


    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/
    function isOperational() public view returns(bool)  {
        return operational;
    }

    function setOperatingStatus (bool status) external requireContractOwner {
        operational = status;
    }

    function isAuthorizedContract(address contractAddress) external view returns(bool) {
        return authorized[contractAddress];
    }

    function setAuthorizedContract(address contractAddress, bool status) external requireContractOwner {
        authorized[contractAddress] = status;
    }

    function getFirstAirline() external view returns(address) {
        return airlinesArray[0];
    }

    function getNumAirlines () external view returns (uint256) {
        return airlinesArray.length;
    }

    function isRegisteredAirline(address account) external view returns(bool){
        return airlines[account].isRegistered;
    }

    function isAcceptedAirline(address account) external view returns(bool){
        return airlines[account].isAccepted;
    }


    function isMemberAirline(address account) external view returns(bool){
        return airlines[account].isMember;
    }

    function getAirlineBalance(address account) external view returns (uint256) {
        require(airlines[account].isRegistered, "Airlines is not registered");
        return (airlines[account].balance);
    }

    function getAirlineInfo(address account) external view returns (bool, bool, bool, uint256) {
        require(airlines[account].isRegistered, "Airlines is not registered");
        Airline memory aux = airlines[account];
        return (aux.isRegistered, aux.isAccepted, aux.isMember, aux.balance);
    }

    function getAirlines() external view returns (address[] memory) {
        return airlinesArray;
    }

    /********************************************************************************************/
    /*          SMART CONTRACT FUNCTIONS CAN BE CALLED ONLY FROM APP CONTRACT                   */
    /********************************************************************************************/
    function registerFirstAirline (address account) external requireIsOperational requireContractOwner {
        require(airlinesArray.length == 0, "Only first airline can be registered here");
        airlines[account] = Airline(true, true, false, 0);
        airlinesArray.push(account);
    }

    function registerAirline (address account) external requireIsOperational requireAuthorizedContract {
        require(!airlines[account].isRegistered, "Airline already registered");
        airlines[account] = Airline(true, false, false, 0);
    }

    function acceptAirline (address account) external requireIsOperational requireAuthorizedContract {
        require(airlines[account].isRegistered, "Airline should be registered first");
        airlines[account].isAccepted = true;
        airlinesArray.push(account);
    }

    /********************************************************************************************/
    /*               SMART CONTRACT FUNCTIONS THAT CAN BE CALLED DIRECTLY FROM EOA              */
    /********************************************************************************************/
    function registerFlight (bytes32 flight, uint8 status) external requireIsOperational requireMemberAirline {
        require(flights[flight].isRegistered == false, "Flight already registered");
        flights[flight] = Flight(true, status, block.timestamp, msg.sender);
        flightsArray.push(flight);
    }

   /**
    * @dev Buy insurance for a flight
    */   
    function buy (bytes32 flight) external payable requireIsOperational {
        require(flights[flight].isRegistered == true, "Flight not already registered");
        require(msg.value < 1 ether, "Insurance should be up to 1 ether");
        insurances[flight].push(Insurance(msg.sender, msg.value));
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
    function fund () public payable requireIsOperational requireAcceptedAirline {
        require(airlines[msg.sender].balance == 0, "Airline already provided funding");
        airlines[msg.sender].balance = msg.value;
        airlines[msg.sender].isMember = true;
    }

    function getFlightKey (address airline, string memory flight, uint256 timestamp) pure internal returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }
}