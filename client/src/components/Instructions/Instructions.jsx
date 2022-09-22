// Node modules
// Own imports
// Components
// MDB Components
import { MDBTypography } from 'mdb-react-ui-kit';
// Statics
// Styles
import "./Instructions.css";


/**
 * Instructions component
 * @returns Render the component
 */
export default function Instructions() {
    return (
        <MDBTypography note noteColor='primary'>
            <strong>Instructions:</strong> This application allows airlines and passengers to provide an easy way to buy insurances for their flights. Passengers can pay up to 1 ether to buy an insurance, and will receive 1.5x the original payment in case a flight is delay by an airline fault.
            On the other hand airlines can register their flights in the platform to provide this service to its passengers. First airline is registered upon contract deployment and it's responsible to register next three airlines. For an airline to be able to register flights in the platform, they need to provide the initial 10 ether funding, which is suposse to be enough to sustain the platform in case flights are delayed. From fifth airline and on, the process to join by a new airline requires 50% of existing members to vote OK for the new airline to join (multi-parity consensous).
        </MDBTypography>    
    );
}