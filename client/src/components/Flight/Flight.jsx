// Node modules
import { useState, useEffect } from 'react';
// Own imports
// Components
// MDB Components
import { MDBTypography, MDBInput, MDBCheckbox, MDBRow, MDBCol, MDBBtnGroup, MDBBtn } from 'mdb-react-ui-kit';
// Statics
// Styles
import './Flight.css';


/**
 * Farmer information either from an existing flight or to register a new one
 * @returns Render the component
 */
function Flight(props) {
    
    // Farm information form
    const [readOnly={readOnly}, setReadOnly] = useState(false);
    const [flight, setFlight] = useState({
        key: '',
        name: '',
        statusCode: 0,
        airline: ''
    });
    const onChangeFlightForm = e => setFlight({ ...flight, [e.target.name]: e.target.value });

    // Reload props
    useEffect(() => {
        if (props.address) {
            setReadOnly(true);
            setFlight({
                key: props.key,
                name: props.name,
                statusCode: props.statusCode,
                airline: props.airline
            }); 
        }
    }, [props])

    // Methods
    const { onRegister } = props;

    return (
        <div className='flight mt-3'>
            <MDBTypography tag='div' className='display-6 mb-2'>
                Flight Information
            </MDBTypography>
            <MDBRow className='mt-3'>
                <MDBCol>
                    <form>
                        <MDBInput className='mb-4' id='key' type='text' name='key' label='Flight Key' value={flight.key} onChange={onChangeFlightForm} readonly/>
                        <MDBInput className='mb-4' id='flight' type='text' name='flight' label='Flight Name' value={flight.name} onChange={onChangeFlightForm} readOnly={readOnly}/>
                        <MDBInput className='mb-4' id='status' type='number'name='status' label='Flight Status' value={flight.balance} onChange={onChangeFlightForm} readonly/>
                        <MDBInput className='mb-4' id='airline' type='text' name='airline' label='Airline Address' value={flight.address} onChange={onChangeFlightForm} readOnly/>
                    </form>
                </MDBCol>
            </MDBRow>
            <MDBRow>
                <MDBBtnGroup shadow='0' aria-label='Flight Actions'>
                    <MDBBtn rounded onClick={onRegister}>Register Flight</MDBBtn>
                </MDBBtnGroup>
            </MDBRow>
        </div>
    );
}

export default Flight;