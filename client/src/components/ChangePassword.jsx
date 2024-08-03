import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext'; // Import useAuthContext
import Dashboard from '../Admin/Dashboard';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext(); // Get user role from auth context

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("All fields are required");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords don't match");
      }

      // Make API call to change password
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/user/change-password`, {
        email: localStorage.getItem('email'), // Example: Fetch email from local storage or state
        currentPassword, // Include current password for verification (if needed)
        newPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard"); // Redirect to /dashboard after success
      }, 2000);
      
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    }
  };

  return (
    <>
      {user?.role === "Admin" && <Dashboard showAdminHome={true} />} 
      <div className="center">
        <h1 className='fw-bold'>Change Password</h1>
        <form onSubmit={handleChangePassword}>
          {error && (
            <p className="error-message">
              {error}
            </p>
          )}
          {success && (
            <p className="success-message">
              Password changed successfully!
            </p>
          )}
          <div className="txt_field">
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <span></span>
            <label>Current Password</label>
          </div>
          <div className="txt_field">
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <span></span>
            <label>New Password</label>
          </div>
          <div className="txt_field">
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <span></span>
            <label>Confirm New Password</label>
          </div>
          <div className='d-flex gap-1 justify-content-between'>
            <input className='mb-3 btn btn-danger cancel' onClick={() => navigate(-1)} type="submit" value="Cancel" />
            <input className='mb-3' type="submit" value="Save Now" />
          </div>
        </form>
      </div>
    </>
  );
};

export default ChangePassword;
