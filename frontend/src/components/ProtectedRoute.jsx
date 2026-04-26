import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";

function ProtectedRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN);

      if (!refreshTokenValue) {
        setIsAuthorized(false);
        setIsLoading(false);
        return false;
      }

      const response = await api.post("/api/token/refresh/", {
        refresh: refreshTokenValue,
      });

      if (response.status === 200) {
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
        setIsAuthorized(true);
        setIsLoading(false);
        return true;
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      setIsAuthorized(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Check token validity and refresh if needed
  const checkAndRefreshToken = useCallback(async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);

      if (!token) {
        setIsAuthorized(false);
        setIsLoading(false);
        return false;
      }

      // Check if token is expired or about to expire
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000; // Convert to seconds
      const timeUntilExpiry = decoded.exp - now;
      const fiveMinutesInSeconds = 5 * 60;

      // If token is valid for more than 5 minutes
      if (timeUntilExpiry > fiveMinutesInSeconds) {
        setIsAuthorized(true);
        setIsLoading(false);
        return true;
      }

      // Token needs refresh
      return await refreshToken();
    } catch (error) {
      console.error("Error checking token:", error);
      return await refreshToken(); // Try refreshing if token parsing failed
    }
  }, [refreshToken]);

  useEffect(() => {
    // Initial check
    checkAndRefreshToken();

    // Set up auto-refresh timer - checking every minute
    const interval = setInterval(() => {
      checkAndRefreshToken();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkAndRefreshToken]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/logout" />;
}

export default ProtectedRoute;
