import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from 'react-hot-toast';
import { useForgotPassword } from "../hooks/useForgotPassword";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const { forgotPassword, error, loading } = useForgotPassword();

  useEffect(() => {
    if (error) {
      toast.error(error); // Show backend errors using toast
    }
  }, [error]);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    const isValidEmail = /^[a-zA-Z0-9._%+-]+@innobles\.com$/.test(value);
    if (!isValidEmail) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        email: "Email must be in the format name@innobles.com.",
      }));
    } else if (value.length > 50) {
      setErrors(prevErrors => ({
        ...prevErrors,
        email: "email cannot exceed 50 characters."
      }));
    }
    else {
      setErrors((prevErrors) => ({ ...prevErrors, email: null }));
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    const emailPattern = /^[a-zA-Z0-9._%+-]+@innobles\.com$/;
    if (email.trim() === "") {
      setErrors({ email: "Email is required." });
      return;
    } else if (!emailPattern.test(email)) {
      setErrors({ email: "Email must be in the format name@innobles.com." });
      return;
    }

    const result = await forgotPassword(email);
    if (result) {
      toast.success(result.message);
    }
  };

  return (
    <>
      <div>
        <img src="./image/myte_bg_3.png" alt="" style={{ height: "100vh", width: "100%" }} />
        <img src="./image/myte_bg_name.png" alt="" style={{ position: "absolute", top: "30%" }} />
      </div>

      <div className="center mb-5">
        <h1><b>Forget Password</b></h1>
        <p className="p-2" style={{ color: "#cdc0c0", fontSize: "14px" }}>
          Enter your Email Address associated with your Account and we'll send the link to reset Password
        </p>
        <form onSubmit={handleForgotPassword} method="post">
          <div className={`txt_field mb-5 mt-5 ${errors.email ? 'error' : ''}`}>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="name@innobles.com"
              disabled={loading} // Disable the field while loading
            />
            <span></span>
            <label>Email Address <span className="required">*</span></label>
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <input
            type="submit"
            value={loading ? "Please Wait..." : "Next"}
            disabled={loading} // Disable the button while loading
          />

          <div className="signup_link">
            <Link to="/login">Return to Login</Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default ForgetPassword;
