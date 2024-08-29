import { useState, useEffect } from "react";
import { useLogin } from "../hooks/useLogin";
import { Link } from "react-router-dom";
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'; // Import Heroicons
import '../components/style.css'; // Ensure your CSS file is imported

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [errors, setErrors] = useState({}); // State to track frontend errors

  const { login, error, loading } = useLogin();

  useEffect(() => {
    if (error) {
      toast.error(error); // Show backend errors using toast
    }
  }, [error]);

  const handleLogin = async (e) => {
    e.preventDefault();

    let valid = true;
    const newErrors = {};

    if (email.trim() === "") {
      newErrors.email = "Email is required.";
      valid = false;
    }

    if (password.trim() === "") {
      newErrors.password = "Password is required.";
      valid = false;
    } else if (password.length < 6 || password.length > 20) {
      newErrors.password = "Password must be between 6 and 20 characters long.";
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) return;

    // login user
    await login(email, password);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    // Real-time length validation
    if (newPassword.length < 6 || newPassword.length > 20) {
      setErrors(prevErrors => ({ ...prevErrors, password: "Password must be between 6 and 20 characters long." }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, password: null }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <>
      <div>
        <img src="./image/myte_bg_3.png" alt="" style={{ height: "100vh", width: "100%" }} />
        <img src="./image/myte_bg_name.png" alt="" style={{ position: "absolute", top: "30%" }} />
      </div>
      <div className="center-login">
        <h1><b>Login</b></h1>
        <form onSubmit={handleLogin} method="post">
          <div className={`txt_field ${errors.email ? 'error' : ''}`}>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(prevErrors => ({ ...prevErrors, email: null })); // Clear error
              }}
              placeholder="name@innobles.com"
            />
            <span></span>
            <label>Email Address <span className="required">*</span></label>
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <div style={{position:"relative"}}>
          {password && (
            <span className="password-icon" onClick={togglePasswordVisibility} style={{ transform: 'translateY(-50%)', cursor: 'pointer', position:"absolute", right:"5%", top:"43%", zIndex:"1" }}>
              {showPassword ? (
                <EyeIcon className="h-6 w-6 text-gray-500" />
              ) : (
                <EyeSlashIcon className="h-6 w-6 text-gray-500" />
              )}
            </span>
          )}

          <div className={`txt_field ${errors.password ? 'error' : ''}`} style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Password"
            />
            {/* Conditionally render the password visibility icon */}

            <span></span>
            <label>Password <span className="required">*</span></label>
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>
          </div>

          <input type="submit" value="Login" disabled={loading} />
          <div className="signup_link_login">Not a member? <Link to="/signup">Signup</Link></div>
        </form>
      </div>
    </>
  );
};

export default Login;
