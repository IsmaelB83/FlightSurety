// Node modules
import React, { useEffect, useState } from "react";
// Own imports
import { connect, harvest } from './web3/index';
// MDB Components
import { MDBContainer, MDBRow, MDBCol} from 'mdb-react-ui-kit';
// Components
import NavBar from "./components/NavBar/NavBar"
import Instructions from "./components/Instructions/Instructions"
import Airline from "./components/Airline/Airline"
import Flight from "./components/Flight/Flight"
// Statics
// Styles
import 'mdb-react-ui-kit/dist/css/mdb.min.css'
import './App.css'

function App() {

    const [connection, setConnection] = useState({
        web3: null,
        account: '0x0000000000000000000000000000000000000000',
        networkId: 0,
        addressApp: '0x0000000000000000000000000000000000000000',
        flightSuretyApp: null,
        addressApp: '0x0000000000000000000000000000000000000000',
        flightSuretyApp: null,
    });

    const [data, setData] = useState({
        airlines: [],
        flights: []
    })

    // Connect provider
    useEffect(() => {
        // Connect to provider
        connect().then(result => {
            document.web3 = result;
            setConnection(result)
        });
    },[])
   
    // Handler of chain changed event in metamask
    const chainChangedHandler = networkId => setConnection({...connection, networkId: parseInt(networkId, 'hex')})
    // Handler of chain changed event in metamask
    const accountChangedHandler = accounts => setConnection({...connection, account: accounts[0]})
    // Handler of connect click button
    const connectHandler = () => connect().then(result => setConnection(result));
        
    // Bind events from metamask (change account and)
    window.ethereum.on("chainChanged", chainChangedHandler)
    window.ethereum.on("accountsChanged", accountChangedHandler)

    // Click on harvest
    const onHarvestHandler = (upc, name, info, latitude, longitude, notes) => {
        harvest(upc, name, info, latitude, longitude, notes)
        .then( result => {
            console.log(result)
        })
    }

    // Render
    return (
        <React.Fragment>
            <NavBar account={connection.account} network={connection.networkId} onConnect={connectHandler}/>
            <MDBContainer className="mt-4 mb-4 mainContainer" id="App" >
                <Instructions/>
                <MDBRow>
                    <MDBCol size='4'>
                    </MDBCol>
                    <MDBCol size='8'>
                        <Airline/>
                        <Flight/>
                    </MDBCol>
                </MDBRow>
            </MDBContainer>
        </React.Fragment>
    );
}

export default App;