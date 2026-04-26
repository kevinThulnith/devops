import { useNavigate } from "react-router-dom";
import { REFRESH_TOKEN } from "../constants";
import { useEffect, useRef } from "react";
import api from "../api";

function Logout() {
  const navigate = useNavigate();
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    localStorage.clear();

    if (refreshToken) {
      api
        .post("/api/token/blacklist/", { refresh: refreshToken })
        .catch((err) =>
          console.log(
            err.response?.status === 401 ? "Token already blacklisted" : err
          )
        );
    }

    navigate("/login");
    window.location.reload();
    return () => (didRunRef.current = false);
  }, [navigate]);

  return null;
}

export default Logout;
