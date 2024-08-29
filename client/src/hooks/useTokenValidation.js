import { useEffect } from "react";
import { useAuthContext } from "./useAuthContext";
import { useNavigate } from "react-router-dom";

const useTokenValidation = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
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
          localStorage.removeItem("token");
          localStorage.removeItem("userid");
          localStorage.removeItem("name");
          localStorage.removeItem("email");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } catch (err) {
        console.error("Token validation error:", err);
      }
    };

    checkTokenValidity();
    const intervalId = setInterval(checkTokenValidity, 50000); // Check every 5 minutes

    return () => clearInterval(intervalId);
  }, [navigate, user]);

  return null;
};

export default useTokenValidation;
