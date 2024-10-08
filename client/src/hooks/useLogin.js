import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import { useNavigate } from "react-router-dom"; // Import useNavigate

export const useLogin = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { dispatch } = useAuthContext();
  const navigate = useNavigate(); // useNavigate hook for navigation

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/user/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(json.error);
        return;
      }

      // Update the auth context
      dispatch({ type: "LOGIN", payload: json });

      // Save the user to local storage
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
      console.error('Login error:', err); // Log fetch error
      setLoading(false);
      setError('Failed to login');
    }
  };

  return { login, error, loading };
};








// import { useState } from "react";
// import { useAuthContext } from "./useAuthContext";

// export const useLogin = () => {
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const { dispatch } = useAuthContext();

//   const login = async (email, password) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const res = await fetch(
//         `${process.env.REACT_APP_BASE_URL}/api/user/login`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ email, password }),
//           credentials: 'include', // Include cookies in the request
//         }
//       );

//       const json = await res.json();

//       if (!res.ok) {
//         setLoading(false);
//         setError(json.error);
//         return;
//       }

//       // Update the auth context
//       dispatch({ type: "LOGIN", payload: json });
// console.log(json);
      
//       // Save the user to local storage
//       let user=json
//       localStorage.setItem("userid",user.userid);
//       localStorage.setItem("name",user.name);
//       localStorage.setItem("email",user.email);
//       localStorage.setItem("token",user.token);

//       // Save the user to local storage (optional)
//       localStorage.setItem("user", JSON.stringify(json));

//       setLoading(false);
//     } catch (err) {
//       console.error('Fetch error:', err); // Log fetch error
//       setLoading(false);
//       setError('Failed to login');
//     }
//   };

//   return { login, error, loading };
// };

