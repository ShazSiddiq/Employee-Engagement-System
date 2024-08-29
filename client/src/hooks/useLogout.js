import { useEffect } from "react";
import { useAuthContext } from "./useAuthContext";
import { useNavigate } from "react-router-dom";

const useLogout = () => {
  const { dispatch: logoutDispatch } = useAuthContext();
  const navigate = useNavigate();

  const logout = () => {
    // clear localstorage
    localStorage.clear();
    
    // dispatch logout
    logoutDispatch({ type: "LOGOUT" });

    // navigate to login page
    navigate("/login");
  };

  const checkTokenValidity = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      logout();
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/user/check-token-validity`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (res.status === 403) {
        // Token is invalid or expired
        logout();
      }
    } catch (err) {
      console.error("Token validation error:", err);
      logout();
    }
  };

  useEffect(() => {
    // Check token validity every 5 minutes
    const intervalId = setInterval(checkTokenValidity, 5 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return { logout };
};

export default useLogout;
