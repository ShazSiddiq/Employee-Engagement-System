import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    navigate(location.state?.from?.pathname || '/', { replace: true });
  };

  return (
    <div className="unauthorized-message">
      <h1>You are not authorized to access this page.</h1>
      <button onClick={handleGoBack}>Go Back</button>
    </div>
  );
};

export default Unauthorized;
