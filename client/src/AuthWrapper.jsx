import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthWrapper = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
      navigate('/');
    }
  }, [navigate]);

  return children;
};

export default AuthWrapper;
