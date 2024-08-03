import { useState } from "react";
import { useSignup } from "../hooks/useSignup";
import { useAuthContext } from "../hooks/useAuthContext";
import { Link } from "react-router-dom";

const Signup = () => {
  const [name, setName] = useState("");
  // const [profileImage, setProfileImage] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null); // State to hold the profile image

  const { signup, error, loading } = useSignup();
  const { dispatch } = useAuthContext();
  const handleFileChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Signup user with profile image
    const user = await signup(name, email, password, profileImage);

    if (user) {
      dispatch({ type: "LOGIN", payload: user });
      localStorage.setItem("user", JSON.stringify(user));
    }
  };

  return (
    <div className="center">
      {error && (
        <p className="error_message text-danger">
          {error}
        </p>
      )}
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup} method="post">
        <div className="txt_field">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <span></span>
          <label>Full Name <span className="required">*</span></label>
        </div>

        <div className="txt_field">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <span></span>
          <label>Email <span className="required">*</span></label>
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

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-cyan-600 dark:text-cyan" htmlFor="file_input">
            Upload file <span className="required">*</span>
          </label>
          <div
            onClick={() => document.getElementById('fileInput').click()}
            className="flex flex-col space-y-2 items-center justify-center uplode-img-profile cursor-pointer"
          >
            <i className="fas fa-cloud-upload-alt fa-3x text-currentColor"></i>
            <p className="text-[#0000008f] m-0 text-[15px]">
              {profileImage ? profileImage.name : 'Drag your files here or click in this area.'}
            </p>
            <a className="flex items-center py-1 px-2 text-white text-center text-[12px] border border-transparent rounded-md outline-none bg-[#2691d9]">
              Select a file
            </a>
          </div>
          <input
            type="file"
            id="fileInput"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>


        {/* <p class="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">SVG, PNG, JPG or GIF (MAX. 800x400px).</p> */}

        {/* <div className="txt_field">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files[0])} // Update state with selected file
          />
          <span></span>
          <label > <span className="required">*</span></label>
        </div> */}
        <input
          type="submit"
          value="Sign Up"
          disabled={loading}
          required
        />
        <div className="signup_link">Already a member? <Link to="/login">Login</Link></div>
      </form>
    </div>
  );
};

export default Signup;
