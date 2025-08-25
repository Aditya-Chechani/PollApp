import React, { Fragment, useEffect, useRef, useState } from "react";
import Input from "./Input";

function Hello(props) {

    const [isTrue, setIsTrue] = useState(true);
    const [crowd, setCrowd] = useState([]);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");   
    const [dob, setDob] = useState("");

    //ref
    const firstNamRef=useRef();
    const lastNameRef=useRef(null);
    const dobRef=useRef(null);


    // const toggleTrue = () => {
    //     setIsTrue(!isTrue);
    // }
    function toggleTrue() {
        setIsTrue(!isTrue);
    }

    useEffect(() => {
        // This effect runs when isTrue changes
        console.log("UseEffect fired");

        let people=[
            {
                id:1,
                firstName:"John",
                lastName:"Doe",
                dob:"22-02-1990"

            },
            {
                id:2,
                firstName:"Jane",
                lastName:"Doe",
                dob:"22-02-1992"
            }

        ]
        setCrowd(people);
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Form submitted");
        console.log("First Name:", firstName);
        console.log("Last Name:", lastName);
        console.log("DOB:", dob);
        if (firstName && lastName && dob) {
            const newPerson = {
                id: crowd.length + 1,
                firstName,
                lastName,
                dob
            };
            const newList =crowd.concat(newPerson) ;

            const sorted=newList.sort((a, b) => {
                if(a.lastName<b.lastName){
                    return -1;
                }
                else if (a.lastName > b.lastName) {
                    return 1;
                }
                else {
                    return 0;
                }
            });

            setCrowd(sorted);
        }
        firstNamRef.current.value="";
        lastNameRef.current.value="";
        dobRef.current.value="";
    }

    return (
        <Fragment>
            <hr />
            <h1 className="h1-red">{props.msg}  </h1>
            <hr />
            {isTrue &&
                <Fragment>
                    <p>This is a conditional message!</p>
                </Fragment>
            }
            <hr />
            {isTrue
                ? <p>This is a conditional message!-true</p>
                : <p>This is an alternate message!</p>
            }
            <hr />
            <button onClick={toggleTrue}>
                Toggle Message
            </button>
            <hr />
            <form autoComplete="off" onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label" htmlFor="firstName">First Name</label>
                    <input type="text" className="form-control" id="firstName" name="firstname" ref={firstNamRef} autoComplete="first-name-new" onChange={(event) => setFirstName(event.target.value)} />
                </div>

                <Input
                    title="Last Name"
                    type="text"
                    className="form-control"
                    ref={lastNameRef}
                    name="lastname"
                    autoComplete="last-name-new"
                    onChange={(event) => setLastName(event.target.value)}
                />

                <Input
                    title="Date of Birth"
                    type="date"
                    className="form-control"
                    ref={dobRef}
                    name="dob"
                    autoComplete="bday"
                    onChange={(event) => setDob(event.target.value)}
                />  

                <input type="submit" value="Submit" className="btn btn-primary"></input> 
            </form>

            <div>
                First Name: {firstName} <br />  
                Last Name:{lastName} <br />
                DOB: {dob} <br />   
            </div>
            <hr />
            <ul className="list-group"> People
                {crowd.map(person => (
                    <li key={person.id} className="list-group-item">
                        {person.firstName} {person.lastName}
                    </li>
                ))}
            </ul>
        </Fragment>
    )

}

export default Hello;