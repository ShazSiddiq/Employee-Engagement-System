import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import '../components/style.css'; // Ensure your CSS file is imported
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, error, loading } = useLogin();

  const handleLogin = async (e) => {
    e.preventDefault();

    // login user
    await login(email, password);
  };

  return (
    <div className="center">
       {error && (
          <p className="error_message text-danger">
            {error}
          </p>
        )}
      <h1>Login</h1>
      <form onSubmit={handleLogin} method="post">
        <div className="txt_field">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <span></span>
          <label>Email Address <span className="required">*</span></label>
        </div>
        <div className="txt_field">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span></span>
          <label>Password <span className="required">*</span></label>
        </div>
        <div className="pass">Forgot Password?</div>
        <input
          type="submit"
          value="Login"
          disabled={loading}
        />
        <div className="signup_link">Not a member? <Link to="/signup">Signup</Link></div>
      </form>
    </div>
  );
};

export default Login;
