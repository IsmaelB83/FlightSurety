// Node modules
// Own imports
import { networkIdText } from '../../utils/index';
// Components
// MDB Components
import { MDBContainer, MDBNavbar, MDBNavbarBrand, MDBInputGroup, MDBBtn, MDBNavbarLink } from 'mdb-react-ui-kit';
// Statics
import logo from "../../static/logo.jpg";
// Styles
import "./NavBar.css";


/**
 * Application navbar component
 * @returns Render the component
 */
function NavBar(props) {

    // Props destructuring
    const { network, account } = props;
    const { onConnect } = props;

    // Auxiliary
    const auxNetwork = network?networkIdText(network):'not connected';
    const auxAccount = account?account:`0x${"0".repeat(64)}`;
    
    return (
        <MDBNavbar light bgColor='light' fixed='top'>
            <MDBContainer>
                <MDBNavbarBrand href='#'>
                    <img src={logo} height='30' alt='' loading='lazy' /> Flight Surety Insurances 
                </MDBNavbarBrand>
                <MDBInputGroup className='d-flex w-auto'>
                    <MDBNavbarLink disabled href='#' tabIndex={-1} aria-disabled='true'>
                        {auxNetwork}
                    </MDBNavbarLink>
                    <MDBBtn className='mx-2' color='danger' onClick={onConnect}>
                        Connect Metamask
                    </MDBBtn>
                    <MDBNavbarLink disabled href='#' tabIndex={-1} aria-disabled='true'>
                        {`${auxAccount.substring(0,5)}...${auxAccount.substring(auxAccount.length-4)}`}
                    </MDBNavbarLink>
                </MDBInputGroup>
            </MDBContainer>
        </MDBNavbar>
    );
}

export default NavBar;