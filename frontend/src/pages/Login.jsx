import GoogleLoginButton from "../components/GoogleLoginButton";
import LoadingIndicator from "../components/LoadingIndicator";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo1.png";
import { useState } from "react";
import api from "../api";

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    api
      .post("api/token/", formData)
      .then((res) => {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
      })
      .catch((error) => {
        if (error.response && error.response.status === 401)
          alert("Invalid username or password. Please try again.");
        else alert("An error occurred. Please try again later.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h2 className="text-3xl md:text-4xl font-semibold text-[#eeeade] pt-3 flex items-center justify-center mb-5 text-center">
        <img
          className="inline-block mr-2"
          style={{ height: "30px", marginBottom: "-16px" }}
          src={logo}
          alt="Logo"
        />
        <div className="mt-5">KY Biscuits</div>
      </h2>

      <div className="form-container w-full max-w-[380px] bg-card-main rounded-lg shadow-md p-5 mx-auto">
        <p className="mt-2 font-medium text-xl text-star-dust-100">
          Login to your account
        </p>
        <p className="mt-2 text-xs text-star-dust-200">
          Enter your username below to login to your account
        </p>

        <form className="mt-5" onSubmit={handleSubmit}>
          {["username", "password"].map((field) => (
            <div key={field} className="mb-4">
              <label
                htmlFor={field}
                className="block font-medium capitalize text-star-dust-300"
              >
                {field}
              </label>
              <input
                type={field === "password" ? "password" : "text"}
                id={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-2 border-0 rounded-lg outline-none ring-0 bg-card-sub text-stone-100"
                placeholder={`Enter your ${field}`}
                required
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full mt-2 px-4 py-2 text-stone-100 font-medium rounded-lg  bg-blue-700 hover:bg-blue-800"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <GoogleLoginButton sent="Login with Google" />

        {loading && <LoadingIndicator />}
      </div>
    </div>
  );
}

export default Login;
