import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  return token && username ? children : <Navigate to="/" />;
};

export default PrivateRoute;
