import React from 'react';
// import Home from './component/Home'; // Assuming Home is a component in your project
import { Link, Outlet } from 'react-router-dom';
import { useState } from 'react';
import Alert from './component/Alert'
import { useNavigate } from 'react-router-dom';
function App() {
  const [admin, setAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [alertClassName, setAlertClassName] = useState("d-none");
  const [alertMessage, setAlertMessage] = useState("");
  const navigate = useNavigate();
  const logOut = () => {
    setUser(null);
    setAdmin(false);
    navigate("/");
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col">
          <h1 className="mb-3">Welcome to the Poll App</h1>
        </div>
        <div className="col text-end">
          {!user
           ? <Link to="/Login"> <span className="badge bg-success">Login</span></Link>
           : <a href='#!' onClick={logOut}> <span className="badge bg-danger">Logout ({user.email})</span></a>
          }
        </div>
        <hr className="mb-3"/>
      </div>
      <div className="row">
        <div className="col-md-2">
          <nav>
            <div className="list-group">
              <Link to="/" className="list-group-item list-group-item-action">Home</Link>
              {user && admin && (
                <>
                  <Link to="/admin/MakePolls/0" className="list-group-item list-group-item-action">Make Polls</Link>
                </> 
              )}
              {user && (
                <>
                  <Link to="/admin/VoteOnPolls/0" className="list-group-item list-group-item-action">Vote on Polls</Link>
                </>
              )}
              <Link to="/ViewResults" className="list-group-item list-group-item-action">View Results</Link>
              <Link to="/admin/AccountSettings/0" className="list-group-item list-group-item-action">Account Settings</Link>
            </div>
          </nav>
         
        </div>
        <div className="col-md-10">
          <Alert className={alertClassName} message={alertMessage} />
          {/* The Outlet component will render the matched child route */}
          <Outlet context={{admin,setAdmin, user, setUser,setAlertClassName,setAlertMessage, }} />
        </div>
      </div>
    </div>
  );
}

export default App;
