import { useState, useEffect } from "react";
import { useSignup } from "../hooks/useSignup";
import { useAuthContext } from "../hooks/useAuthContext";
import { Link } from "react-router-dom";
import { toast } from 'react-hot-toast';

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState({});

  const { signup, error, loading } = useSignup();
  const { dispatch } = useAuthContext();

  useEffect(() => {
    if (error) {
      toast.error(error); // Show backend errors using toast 
    }
  }, [error]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const allowedTypes = ["image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prevErrors => ({
        ...prevErrors,
        profileImage: "Invalid file type. Only PNG and JPG are allowed."
      }));
      setProfileImage(null);
      return;
    }
    setProfileImage(file);
    setErrors(prevErrors => ({ ...prevErrors, profileImage: null }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);

    if (value.length < 3) {
      setErrors(prevErrors => ({
        ...prevErrors,
        name: "Name must be at least 3 characters long."
      }));
    } else if (value.length > 50) {
      setErrors(prevErrors => ({
        ...prevErrors,
        name: "Name cannot exceed 50 characters."
      }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, name: null }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    if (value.length < 8) {
      setErrors(prevErrors => ({
        ...prevErrors,
        password: "Password must be at least 8 characters long."
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

  const handleSignup = async (e) => {
    e.preventDefault();
    let valid = true;
    const newErrors = {};

    if (name.trim() === "") {
      newErrors.name = "Full Name is required.";
      valid = false;
    } else if (name.length < 3 || name.length > 50) {
      newErrors.name = "Name must be between 3 and 50 characters long.";
      valid = false;
    }

    if (email.trim() === "") {
      newErrors.email = "Email is required.";
      valid = false;
    }

    if (password.trim() === "") {
      newErrors.password = "Password is required.";
      valid = false;
    } else if (password.length < 8 || password.length > 20) {
      newErrors.password = "Password must be between 8 and 20 characters long.";
      valid = false;
    }

    if (!profileImage) {
      newErrors.profileImage = "Profile image is required.";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    const user = await signup(name, email, password, profileImage);
    if (user) {
      dispatch({ type: "LOGIN", payload: user });
      localStorage.setItem("user", JSON.stringify(user));
    }
  };

  return (
    <>
      <div>
        <img src="./image/mtye_bg_2.png" alt="" style={{ height: "90vh", width: "100%" }} />
      </div>
      <div className="center">
        <h1><b>Sign Up</b></h1>
        <form onSubmit={handleSignup} method="post">
          <div className={`txt_field ${errors.name ? 'error' : ''}`}>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
            />
            <span></span>
            <label>Full Name <span className="required">*</span></label>
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>
          <div className={`txt_field ${errors.email ? 'error' : ''}`}>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(prevErrors => ({ ...prevErrors, email: null }));
              }}
            />
            <span></span>
            <label>Email <span className="required">*</span></label>
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
          <div className={`mb-4 ${errors.profileImage ? 'error' : ''}`}>
            <label className="block mb-2 text-sm font-medium text-cyan-600 dark:text-cyan upload-file" htmlFor="file_input">
              Upload File <span className="required">*</span>
            </label>
            <div onClick={() => document.getElementById('fileInput').click()} className="flex flex-col space-y-2 items-center justify-center uplode-img-profile cursor-pointer">
              <i className="fas fa-cloud-upload-alt fa-3x text-currentColor"></i>
              <p className="text-[#f9eaea8f] m-0 text-[15px]">{profileImage ? profileImage.name : 'Drag your files here or click in this area.'}</p>
              <a className="flex items-center py-1 px-2 text-white text-center text-[12px] border border-transparent rounded-md outline-none bg-[#2691d9]">Select a file</a>
            </div>
            <input type="file" id="fileInput" style={{ display: 'none' }} onChange={handleFileChange} />
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-300" id="file_input_help">Only PNG, JPG are Allowed.</p>
            {errors.profileImage && <p className="error-message">{errors.profileImage}</p>}
          </div>
          <input type="submit" value="Sign Up" disabled={loading} required />
          <div className="signup_link">Already a member? <Link to="/login">Login</Link></div>
        </form>
      </div>
    </>
  );
};

export default Signup;
