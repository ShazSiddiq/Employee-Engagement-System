import { useState, useEffect } from "react";
import { useSignup } from "../hooks/useSignup";
import { useAuthContext } from "../hooks/useAuthContext";
import { Link } from "react-router-dom";
import { toast } from 'react-hot-toast';

const Signup = () => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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
    const maxSizeInMB = 10;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
    if (!allowedTypes.includes(file.type)) {
      setErrors(prevErrors => ({
        ...prevErrors,
        profileImage: "Invalid file type. Only PNG and JPG are allowed."
      }));
      setProfileImage(null);
      return;
    }
  
    if (file.size > maxSizeInBytes) {
      setErrors(prevErrors => ({
        ...prevErrors,
        profileImage: `File size exceeds the maximum limit of ${maxSizeInMB} MB.`
      }));
      setProfileImage(null);
      return;
    }
  
    setProfileImage(file);
    setErrors(prevErrors => ({ ...prevErrors, profileImage: null }));
  };
  

  const handleNameChange = (e) => {
    let value = e.target.value;
  
    // Allow only letters and spaces
    const isValidName = /^[A-Za-z\s]*$/.test(value);
  
    if (!isValidName) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        name: "Name can only contain letters and spaces.",
      }));
      return;
    }
  
    // Prevent input if it exceeds the maximum length
    if (value.length > 70) {
      value = value.slice(0, 70); // Truncate to 50 characters
    }
  
    // Update the name state with the truncated value
    setName(value);
  
    // Validate the length of the name
    if (value.length < 3) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        name: "Name must be at least 3 characters long.",
      }));
    } else if (value.length === 70) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        name: "Name cannot exceed 70 characters.",
      }));
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, name: null }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
  
    // Update the email state
    setEmail(value);
  
    // Validate the email format
    const isValidEmail = /^[a-zA-Z0-9._%+-]+@innobles\.com$/.test(value);
  
    if (!isValidEmail) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        email: "Email must be in the format name@innobles.com.",
      }));
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, email: null }));
    }
  };
  
  
  

  const handlePhoneNumberChange = (e) => {
    let value = e.target.value;
  
    // Prevent input of more than 10 digits
    if (value.length > 10) {
      return;
    }
  
    // Allow empty input (for backspacing) and only numbers that don't start with zero
    const isNumeric = value === '' || /^[1-9][0-9]*$/.test(value);
  
    if (!isNumeric) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        phoneNumber: "Phone number must contain only digits and cannot start with zero.",
      }));
      return;
    }
  
    // Update the phone number state if the input is valid or empty
    setPhoneNumber(value);
  
    // Validate the length of the phone number
    if (value.length > 0 && value.length !== 10) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        phoneNumber: "Phone number must be exactly 10 digits long.",
      }));
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, phoneNumber: null }));
    }
  };
 
  

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

  const handleSignup = async (e) => {
    e.preventDefault();
    let valid = true;
    const newErrors = {};

    if (name.trim() === "") {
      newErrors.name = "Full Name is required.";
      valid = false;
    } else if (name.length < 3 || name.length > 70) {
      newErrors.name = "Name must be between 3 and 70 characters long.";
      valid = false;
    }
    if (phoneNumber.trim() === "") {
      newErrors.phoneNumber = "phoneNumber is required.";
      valid = false;
    }

    // Email validation with format check
    const emailPattern = /^[a-zA-Z0-9._%+-]+@innobles\.com$/;
    if (email.trim() === "") {
      newErrors.email = "Email is required.";
      valid = false;
    } else if (!emailPattern.test(email)) {
      newErrors.email = "Email must be in the format name@innobles.com.";
      valid = false;
    }

    if (password.trim() === "") {
      newErrors.password = "Password is required.";
      valid = false;
    } else if (password.length < 6 || password.length > 20) {
      newErrors.password = "Password must be between 6 and 20 characters long.";
      valid = false;
    }

    if (!profileImage) {
      newErrors.profileImage = "Profile image is required.";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    const user = await signup(name, phoneNumber, email, password, profileImage);
    if (user) {
      dispatch({ type: "LOGIN", payload: user });
      localStorage.setItem("user", JSON.stringify(user));
    }
  };

  return (
    <>
      <div>
        <img src="./image/mtye_bg_2.png" alt="" style={{ height: "100vh", width: "100%" }} />
      </div>
      <div className="center">
        <h1 ><b>Sign Up</b></h1>
        <form onSubmit={handleSignup} method="post">
          <div className={`txt_field ${errors.name ? 'error' : ''}`}>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Full Name"
            />
            <span></span>
            <label>Full Name <span className="required">*</span></label>
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>
          <div className={`txt_field ${errors.phoneNumber ? 'error' : ''}`}>
            <input
              type="text"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="Mobile Number"
            />
            <span></span>
            <label>PhonNumber <span className="required">*</span></label>
            {errors.phoneNumber && <p className="error-message">{errors.phoneNumber}</p>}
          </div>
          <div className={`txt_field ${errors.email ? 'error' : ''}`}>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="name@innobles.com"
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
              placeholder="Password"
            />
            <span></span>
            <label>Password <span className="required">*</span></label>
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>
          <div className={`mb-2 ${errors.profileImage ? 'error' : ''}`}>
            <label className="block mb-2 text-sm font-small text-cyan-600 dark:text-cyan upload-file" htmlFor="file_input">
              Upload Profile Image <span className="required">*</span>
            </label>
            <div onClick={() => document.getElementById('fileInput').click()} className="flex flex-col space-y-2 items-center justify-center uplode-img-profile cursor-pointer">
              <i className="fas fa-cloud-upload-alt fa-3x text-currentColor"></i>
              <p className="text-[#f9eaea8f] m-0 text-[12px]">{profileImage ? profileImage.name : 'Drag your files here or click in this area.'}</p>
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
