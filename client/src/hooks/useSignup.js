import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import { useNavigate } from "react-router-dom";

export const useSignup = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { dispatch } = useAuthContext();
  const navigate = useNavigate(); // useNavigate hook for navigation

  const signup = async (name,phoneNumber, email, password, profileImage) => {
    setLoading(true);
    setError(null);

    console.log('Signup input values:', { name,phoneNumber, email, password, profileImage });

    if (!name || !phoneNumber || !email || !password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phoneNumber', phoneNumber);
      formData.append('email', email);
      formData.append('password', password);

      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const res = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/user/signup`,
        {
          method: "POST",
          body: formData,
        }
      );

      const json = await res.json();
      console.log(json, "json signup");

      if (!res.ok) {
        setLoading(false);
        setError(json.error);
        console.error('Signup error:', json.error);
        return;
      }

      dispatch({ type: "LOGIN", payload: json });

      localStorage.setItem("userid", json.userid);
      localStorage.setItem("name", json.name);
      localStorage.setItem("email", json.email);
      localStorage.setItem("token", json.token);
      localStorage.setItem("user", JSON.stringify(json));

      // Navigate based on user role
      if (json.role === "Admin") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }

      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setLoading(false);
      setError('Failed to signup');
    }
  };

  return { signup, error, loading };
};








// import { useState } from "react";
// import { useAuthContext } from "./useAuthContext";

// export const useSignup = () => {
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const { dispatch } = useAuthContext();

//   const signup = async (name, email, password) => {
//     setLoading(true);
//     setError(null);

//     if (!name || !email || !password) {
//       setError("All fields are required");
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch(
//         `${process.env.REACT_APP_BASE_URL}/api/user/signup`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ name, email, password }),
//           credentials: 'include', // Include cookies in the request
//         }
//       );

//       const json = await res.json();
//       console.log(json, "json signup");

//       if (!res.ok) {
//         setLoading(false);
//         setError(json.error);
//         return;
//       }

//       // Update the auth context
//       dispatch({ type: "LOGIN", payload: json });

      
//       // Save the user to local storage
//       let user=json
//       localStorage.setItem("userid",user.userid);
//       localStorage.setItem("name",user.name);
//       localStorage.setItem("email",user.email);
//       localStorage.setItem("token",user.token);

//       // Save the user to local storage
//       localStorage.setItem("user", JSON.stringify(json));

//       setLoading(false);
//     } catch (err) {
//       console.error('Fetch error:', err); // Log fetch error
//       setLoading(false);
//       setError('Failed to signup');
//     }
//   };

//   return { signup, error, loading };
// };
