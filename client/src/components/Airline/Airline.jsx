// Node modules
import { useState, useEffect } from 'react';
// Own imports
// Components
// MDB Components
import { MDBTypography, MDBInput, MDBCheckbox, MDBRow, MDBCol, MDBBtnGroup, MDBBtn } from 'mdb-react-ui-kit';
// Statics
// Styles
import './Airline.css';


/**
 * Farmer information either from an existing airline or to register a new one
 * @returns Render the component
 */
function Airline(props) {
    
    // Farm information form
    const [ readOnly={readOnly}, setReadOnly] = useState(false);
    const [airline, setAirline] = useState({
        address: '',
        name: '',
        isRegistered: false,
        isAccepted: false,
        isFunded: false,
        balance: 0
    });
    const onChangeAirlineForm = e => setAirline({ ...airline, [e.target.name]: e.target.value });

    // Reload props
    useEffect(() => {
        if (props.address) {
            setReadOnly(true);
            setAirline({
                address: props.address,
                name: props.name,
                isRegistered: props.isRegistered,
                isAccepted: props.isAccepted,
                isFunded: props.isFunded,
                balance: props.balance,
            }); 
        }
    }, [props])

    // Methods
    const { onRegister } = props;

    return (
        <div className='airline mt-3'>
            <MDBTypography tag='div' className='display-6 mb-2'>
                Airline Information
            </MDBTypography>
            <MDBRow className='mt-3'>
                <MDBCol>
                    <form>
                        <MDBInput className='mb-4' id='address' type='text' name='address' label='Airline Address' value={airline.address} onChange={onChangeAirlineForm} readOnly/>
                        <MDBInput className='mb-4' id='name' type='text' name='name' label='Airline Name' value={airline.name} onChange={onChangeAirlineForm} readOnly={readOnly}/>
                        <MDBInput className='mb-4' id='balance' type='number'name='balance' label='Airline Balance' value={airline.balance} onChange={onChangeAirlineForm} readonly/>
                        <MDBCheckbox className='mb-4' id='isRegistered' name='isRegistered' value={airline.isRegistered} label='Registered' onChange={onChangeAirlineForm} disabled/>
                        <MDBCheckbox className='mb-4' id='isAccepted' name='isAccepted' value={airline.isAccepted} label='Accepted' onChange={onChangeAirlineForm} disabled/>
                        <MDBCheckbox className='mb-4' id='isFunded' name='isFunded' value={airline.isFunded} label='Funded' onChange={onChangeAirlineForm} disabled/>
                    </form>
                </MDBCol>
            </MDBRow>
            <MDBRow>
                <MDBBtnGroup shadow='0' aria-label='Airline Actions'>
                    <MDBBtn rounded onClick={onRegister}>Register</MDBBtn>
                </MDBBtnGroup>
            </MDBRow>
        </div>
    );
}

export default Airline;