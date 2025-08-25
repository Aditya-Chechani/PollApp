import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ErrorPage from './component/ErrorPage';
import Home from './component/Home'; 
import MakePolls from './component/MakePolls';
import ViewResults from './component/ViewResults';
import VoteOnPolls from './component/VoteOnPolls';
import AccountSettings from './component/AccountSettings'; 
import Login from './component/Login'; 
import PieChart from './component/PieChart'; // Assuming PieChart is a component in your project

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />, // Assuming ErrorPage is imported from './component/ErrorPage'
    children: [
      // Define your child routes here
      {index: true, element: <Home />}, // Assuming Home is a component in your project
      {path: '/MakePolls/0', element: <MakePolls />},
      {path: '/ViewResults', element: <ViewResults />},
      {path: '/VoteOnPolls/0', element: <VoteOnPolls />},
      {path: '/AccountSettings/0', element: <AccountSettings />},
      {path: '/Login', element: <Login />},
      {path: '/poll/:id', element: <PieChart />},
      // Assuming ViewResults is a component in your project
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

