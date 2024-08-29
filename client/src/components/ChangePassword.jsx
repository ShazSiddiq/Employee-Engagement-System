import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { toast } from 'react-hot-toast';
import Dashboard from '../Admin/Dashboard';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error("All fields are required");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Passwords don't match");
        return;
      }
      // Make API call to change password
      await axios.post(`${process.env.REACT_APP_BASE_URL}/api/user/change-password`, {
        email: localStorage.getItem('email'), // Example: Fetch email from local storage or state
        currentPassword,
        newPassword,
      });

      setSuccess(true);
      toast.success("Password changed successfully!");
      setTimeout(() => {
        navigate("/dashboard"); // Redirect to /dashboard after success
      }, 2000);

    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    }
  };
  return (
    <>
      {user?.role === "Admin" && <Dashboard showAdminHome={true} />}
      <div className="center-changePassword">
        <h1 className='fw-bold text-dark'>Change Password</h1>
        <form onSubmit={handleChangePassword}>
          {success && (
            <p className="success-message">
              Password changed successfully!
            </p>
          )}
          <div className="txt_field">
            <input
              style={{ color: "#000" }}
              type="password"
              // required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <span></span>
            <label style={{ color: "#000" }}>Current Password</label>
          </div>
          <div className="txt_field">
            <input
              style={{ color: "#000" }}
              type="password"
              // required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <span></span>
            <label style={{ color: "#000" }}>New Password</label>
          </div>
          <div className="txt_field">
            <input
              style={{ color: "#000" }}
              type="password"
              // required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <span></span>
            <label style={{ color: "#000" }}>Confirm New Password</label>
          </div>
          <div className='d-flex gap-1 justify-content-between'>
            <input style={{ color: "#000" }} className='mb-3 btn btn-danger cancel' onClick={() => navigate(-1)} value="Cancel" />
            <input className='mb-3' type="submit" value="Save Now" />
          </div>
        </form>
      </div>
    </>
  );
};

export default ChangePassword;