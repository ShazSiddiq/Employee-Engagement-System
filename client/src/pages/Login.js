import { useState, useEffect } from "react";
import { useLogin } from "../hooks/useLogin";
import { Link } from "react-router-dom";
import { toast } from 'react-hot-toast';
import '../components/style.css'; // Ensure your CSS file is imported

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({}); // State to track frontend errors

  const { login, error, loading } = useLogin();

  useEffect(() => {
    if (error) {
      toast.error(error); // Show backend errors using toast
    }
  }, [error]);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Basic email validation
    if (value.trim() === "") {
      setErrors(prevErrors => ({ ...prevErrors, email: "Email is required." }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, email: null }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    // Password validation
    if (value.trim() === "") {
      setErrors(prevErrors => ({ ...prevErrors, password: "Password is required." }));
    } else if (value.length < 8) {
      setErrors(prevErrors => ({ ...prevErrors, password: "Password must be at least 8 characters long." }));
    } else if (value.length > 20) {
      setErrors(prevErrors => ({ ...prevErrors, password: "Password cannot exceed 20 characters." }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, password: null }));
    }
  };

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
    }

    setErrors(newErrors);

    if (!valid) return;

    // login user
    await login(email, password);
  };

  return (
    <>
      <div>
        <img src="./image/myte_bg_3.png" alt="" style={{ height: "90vh", width: "100%" }} />
        <img src="./image/myte_bg_name.png" alt="" style={{ position: "absolute", top: "30%" }} />
      </div>
      <div className="center-login">
        <h1><b>Login</b></h1>
        <form onSubmit={handleLogin} method="post">
          <div className={`txt_field ${errors.email ? 'error' : ''}`}>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
            />
            <span></span>
            <label>Email Address <span className="required">*</span></label>
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <div className={`txt_field ${errors.password ? 'error' : ''}`}>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
            />
            <span></span>
            <label>Password <span className="required">*</span></label>
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>

          <input type="submit" value="Login" disabled={loading} />
          <div className="signup_link_login">Not a member? <Link to="/signup">Signup</Link></div>
        </form>
      </div>
    </>
  );
};

export default Login;
