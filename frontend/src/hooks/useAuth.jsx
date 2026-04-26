import { useState, useEffect } from "react";
import api from "../api";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get("api/user/me/")
      .then((res) => {
        const userData = res.data;
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      })
      .catch((error) => {
        console.error("Failed to fetch user:", error);
        localStorage.removeItem("user");
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, setLoading };
};
