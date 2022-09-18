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
        bool isFunded;
        uint256 balance;
    }
    mapping(address => Airline) private airlines;
    address[] private airlinesArray = new address[](0);
    
    // Flights information
    struct Flight {
        bool isRegistered;
        string flight;
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

    // Passengers balances
    mapping(address => uint256) private balances;

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

    modifier requireFundedAirline(address account){
        require(airlines[account].isFunded, "Airline not yet funded");
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


    function isFundedAirline(address account) external view returns(bool){
        return airlines[account].isFunded;
    }

    function getAirlineBalance(address account) external view returns (uint256) {
        require(airlines[account].isRegistered, "Airlines is not registered");
        return (airlines[account].balance);
    }

    function getAirlineInfo(address account) external view returns (bool, bool, bool, uint256) {
        require(airlines[account].isRegistered, "Airlines is not registered");
        Airline memory aux = airlines[account];
        return (aux.isRegistered, aux.isAccepted, aux.isFunded, aux.balance);
    }

    function getAirlines() external view returns (address[] memory) {
        return airlinesArray;
    }

    function getFlightInfoByKey(bytes32 key) external view returns (bytes32 flightKey, string memory flightName, uint8 statusCode, uint256 updatedTimestamp, address flightAirline) {
        require(flights[key].isRegistered == true, "Flight not registered");
        Flight memory aux = flights[key];
        return (key, aux.flight, aux.statusCode, aux.updatedTimestamp, aux.airline);
    }

    function getFlightInfo(address airline, string memory flight, uint256 timestamp) external view returns (bytes32 flightKey, string memory flightName, uint8 statusCode, uint256 updatedTimestamp, address flightAirline) {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        require(flights[key].isRegistered == true, "Flight not registered");
        Flight memory aux = flights[key];
        return (key, aux.flight, aux.statusCode, aux.updatedTimestamp, aux.airline);
    }

    function getFlightStatus(address airline, string memory flight, uint256 timestamp) external view returns (uint8 statusCode) {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        require(flights[key].isRegistered == true, "Flight not registered");
        return (flights[key].statusCode);
    }

    function getFlights() external view returns (bytes32[] memory) {
        return flightsArray;
    }

    function getInsuranceInfo(bytes32 flight, address passenger) external view returns (uint256 amount) {
        Insurance[] memory aux = insurances[flight];
        for (uint256 i = 0; i < aux.length; i++) {
            if ( aux[i].passenger == passenger) {
                return aux[i].amount;
            }
        }
    }

    function getInsurances(bytes32 flight) external view returns (Insurance[] memory) {
        return insurances[flight];
    }

    function getPassengerBalance() external view returns(uint256) {
        return balances[msg.sender];
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

    function registerFlight (address airline, string memory flight, uint256 timestamp, uint8 status) external requireIsOperational requireAuthorizedContract requireFundedAirline(airline) {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        flights[key] = Flight(true, flight, status, timestamp, airline);
        flightsArray.push(key);
    }

    function updateFlight (address airline, bytes32 flight, uint8 status) external requireIsOperational requireAuthorizedContract requireFundedAirline(airline) {
        require(flights[flight].isRegistered == true, "Flight is not registered");
        require(flights[flight].airline == airline, "Only airline owner can update flight");
        flights[flight].statusCode = status;
        flights[flight].updatedTimestamp = block.timestamp;

    }
    
    function creditInsurees (bytes32 flight) external requireIsOperational requireAuthorizedContract {
        Insurance[] memory aux = insurances[flight];
        for (uint256 i = 0; i < aux.length; i++) {
            address passenger = aux[i].passenger;
            uint256 amount = aux[i].amount;
            uint256 balance = balances[passenger];
            uint256 payment = SafeMath.div(SafeMath.mul(amount, 150), 100);
            aux[i].amount = 0;
            balances[passenger] = SafeMath.add(balance, payment);
        }
    }
    /********************************************************************************************/
    /*               SMART CONTRACT FUNCTIONS THAT CAN BE CALLED DIRECTLY FROM EOA              */
    /********************************************************************************************/
    function fund () public payable requireIsOperational requireAcceptedAirline {
        require(msg.value == 10 ether, "10 ether required for funding");
        require(airlines[msg.sender].isFunded == false, "Airline already funded");
        airlines[msg.sender].balance = msg.value;
        airlines[msg.sender].isFunded = true;
    }

    function buy (bytes32 flight) external payable requireIsOperational {
        require(msg.value > 0 && msg.value <= 1 ether, "Min insurance is 1 wei and max insurance is 1 ether");
        require(flights[flight].isRegistered == true, "Flight not registered");
        insurances[flight].push(Insurance(msg.sender, msg.value));
    }

    function pay () external requireIsOperational {
        require(msg.sender == tx.origin, "Contracts not allowed");
        require(balances[msg.sender] > 0, "Passenger does not have balance");
        uint256 withdraw = balances[msg.sender];
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(withdraw);
    }

    /********************************************************************************************/
    /*                  AUXILIARY METHODS INTERNAL TO SMART CONTRACT                            */
    /********************************************************************************************/
    function getFlightKey (address airline, string memory flight, uint256 timestamp) pure internal returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }
}