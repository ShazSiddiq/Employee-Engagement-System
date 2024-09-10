import { useState } from "react";
import axios from "axios";

export const useForgotPassword = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const forgotPassword = async (email) => {
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/forgot-password`, { email });
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Failed to send reset link. Please try again later.");
      return null;
    }
  };

  return { forgotPassword, error, loading };
};
