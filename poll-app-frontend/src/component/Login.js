// import PollImage from './../images/Home_poll.png'
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Input from './form/Input'; // Assuming Input is a custom component for input fields
import { useNavigate } from 'react-router-dom';

const Login = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { setUser } = useOutletContext();
    const {setAdmin} = useOutletContext();
    const { setAlertClassName, setAlertMessage } = useOutletContext();
      const navigate = useNavigate();


    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Prepare login data
        const loginData = {
            email: email,
            password: password
        };

        try {
            // Call our backend login API
            const response = await fetch("http://localhost:8080/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (response.ok && !result.error) {
                // Login successful
                if(result.data.email === "admin@example.com"){
                    setAdmin(true);
                }
                setAlertClassName("alert-success-login");
                setAlertMessage("Login successful!");
                setUser(result.data); // Store the full user object
                
                // Auto-clear success message after 3 seconds (before navigation)
                setTimeout(() => {
                    setAlertClassName("d-none");
                    setAlertMessage("");
                }, 3000);
                
                // Navigate all users to Vote on Polls page after login
                if(result.data.email === "admin@example.com"){
                    navigate("/MakePolls/0");
                }else{
                    navigate("/VoteOnPolls/0");
                }
            } else {
                // Login failed
                setAlertClassName("alert-danger");
                setAlertMessage(result.message || "Login failed. Please try again.");
                
                // Auto-clear error message after 5 seconds
                setTimeout(() => {
                    setAlertClassName("d-none");
                    setAlertMessage("");
                }, 5000);
            }
        } catch (error) {
            // Network or other error
            console.error("Login error:", error);
            setAlertClassName("alert-danger");
            setAlertMessage("Unable to connect to server. Please try again.");
            
            // Auto-clear network error message after 5 seconds
            setTimeout(() => {
                setAlertClassName("d-none");
                setAlertMessage("");
            }, 5000);
        }
    }

  return (
    <div className="col-md-6 offset-md-3">
      <h2>Login</h2>
      <hr />
      <form onSubmit={handleSubmit}>
            <Input
            title="Email"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            className="form-control"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email-new"
            />
            <Input
            title="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            className="form-control"
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="password-new"
            />

        <hr />
        <button type="submit" className='btn btn-primary'>Login</button>
      </form>

    </div>
  );
};

export default Login;