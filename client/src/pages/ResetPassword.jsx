import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'; // Import Heroicons

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const { token } = useParams(); // Capture token from URL
  const navigate = useNavigate();

  useEffect(() => {
    if (errors.general) {
      toast.error(errors.general);
    }
  }, [errors]);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    if (value.length < 6) {
      setErrors(prevErrors => ({
        ...prevErrors,
        password: "Password must be at least 6 characters long."
      }));
    } else if (value.length > 20) {
      setErrors(prevErrors => ({
        ...prevErrors,
        password: "Password cannot exceed 20 characters."
      }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, password: null }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (value !== password) {
      setErrors(prevErrors => ({
        ...prevErrors,
        confirmPassword: "Passwords do not match."
      }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, confirmPassword: null }));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    if (password.length < 6 || password.length > 20) {
      setErrors({ password: "Password must be between 6 and 20 characters long." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/reset-password/${token}`, { password });
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (error) {
      setErrors({ general: error.response?.data?.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <>
      <div>
        <img src="../image/myte_bg_3.png" alt="" style={{ height: "100vh", width: "100%" }} />
        <img src="../image/myte_bg_name.png" alt="" style={{ position: "absolute", top: "30%" }} />
      </div>
      <div className="center">
        <h1><b>Reset Password</b></h1>
        <form onSubmit={handleResetPassword} method="post">

          <div style={{ position: "relative" }}>
            <div className={`txt_field mb-5 mt-5 ${errors.password ? 'error' : ''}`}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="New Password"
              />
              <span></span>
              <label>New Password <span className="required">*</span></label>
              {errors.password && <p className="error-message">{errors.password}</p>}
            </div>

            {/* Password visibility toggle icon */}
            {password && (
              <span
                className="password-icon"
                onClick={togglePasswordVisibility}
                style={{
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  position: "absolute",
                  right: "5%",
                  top: "50%",
                  zIndex: "1"
                }}
              >
                {showPassword ? (
                  <EyeIcon className="h-6 w-6 text-gray-500" />
                ) : (
                  <EyeSlashIcon className="h-6 w-6 text-gray-500" />
                )}
              </span>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <div className={`txt_field mb-5 ${errors.confirmPassword ? 'error' : ''}`}>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm Password"
              />
              <span></span>
              <label>Confirm Password <span className="required">*</span></label>
              {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
            </div>

            {/* Password visibility toggle icon */}
            {confirmPassword && (
              <span
                className="password-icon"
                onClick={togglePasswordVisibility}
                style={{
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  position: "absolute",
                  right: "5%",
                  top: "47%",
                  zIndex: "1"
                }}
              >
                {showPassword ? (
                  <EyeIcon className="h-6 w-6 text-gray-500" />
                ) : (
                  <EyeSlashIcon className="h-6 w-6 text-gray-500" />
                )}
              </span>
            )}
          </div>

          <input type="submit" value="Reset Password" disabled={loading} required />
          <div className="signup_link"><Link to="/login">Return to Login</Link></div>
        </form>
      </div>
    </>
  );
};

export default ResetPassword;
