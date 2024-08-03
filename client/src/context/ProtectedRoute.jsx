import { useAuthContext } from "../hooks/useAuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const ProtectedRoute = ({ role, children }) => {
  const { user } = useAuthContext();
  const location = useLocation();
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (!user || (role && user.role !== role)) {
      setUnauthorized(true);
      const timer = setTimeout(() => {
        setUnauthorized(false);
      }, 3000); // Message will disappear after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [user, role]);

  if (!user || (role && user.role !== role)) {
    return (
      <>
        {unauthorized && (
          <div className="unauthorized-message">
            You are not authorized to access this page.
          </div>
        )}
        <Navigate to="/" state={{ from: location }} replace />
      </>
    );
  }

  return children;
};

export default ProtectedRoute;
