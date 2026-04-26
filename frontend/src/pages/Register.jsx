import { UserRoundPlus, FileText, UserCog, KeyRound } from "lucide-react";
import { USER_ROLES, USER_ROLE_LABELS } from "../constants";
import { useState, useEffect } from "react";
import api from "../api";

// !Render input fields
const InputItem = ({ label, name, caption, ...props }) => (
  <div className="flex flex-col mb-[-5px]">
    <label htmlFor={name} className="mb-2 text-sm ml-1">
      {label}
    </label>
    <input
      id={name}
      name={name}
      className="bg-card-accent border-none outline-none text-star-dust-300 rounded-lg p-2  disabled:bg-stone-600 disabled:text-stone-400 disabled:cursor-not-allowed"
      {...props}
    />
    {caption && (
      <small className="text-disabled-text mt-1 text-xs">{caption}</small>
    )}
  </div>
);

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    dob: "",
    nic: "",
    mobile_no: "",
    password: "",
    confirmPassword: "",
    role: USER_ROLES.OPERATOR,
    department: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  useEffect(() => {
    api
      .get("api/department/")
      .then((res) => setDepartments(res.data))
      .catch((err) => {
        console.error("Failed to fetch departments:", err);
        setError("Failed to load departments");
      })
      .finally(() => setLoadingDepartments(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // !Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const submitData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        dob: formData.dob || null,
        nic: formData.nic || null,
        mobile_no: formData.mobile_no || null,
        role: formData.role,
        department: formData.department ? parseInt(formData.department) : null,
        is_active: true, // Set user as active by default
      };

      await api.post("api/user/", submitData);
      alert("New user created successfully !!!");
      window.location.href = "/";
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        "Registration failed";
      setError(errorMessage, err.response?.data);
      console.error("Registration error:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 flex justify-center text-star-dust-200">
      <div className="w-full max-w-4xl bg-card-main rounded-xl shadow-md p-9 sm:p-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center mb-3 pb-4 border-b border-stone-500">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-2 rounded-md mr-3 mb-2 sm:mb-0">
            <UserRoundPlus size={34} />
          </div>
          <h1 className="text-4xl font-medium">Register User</h1>
        </div>
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-lg">
            {error}
          </div>
        )}
        {/* form body */}
        <form onSubmit={handleSubmit}>
          {/* Initial data */}
          <div className="border-b border-stone-500 pb-5 mb-3">
            <h3 className="font-medeium flex items-center gap-2">
              <FileText size={18} /> User initial data
            </h3>
            <p className="text-secondary-text text-sm mt-1 text-star-dust-400">
              Fill initial user data fields.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <InputItem
                label="First Name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                required
              />
              <InputItem
                label="Last Name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
              <InputItem
                label="Username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="user0000"
                required
              />
              <InputItem
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="cat@example.com"
                required
              />
              <InputItem
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
              />
              <InputItem
                label="NIC"
                name="nic"
                type="text"
                value={formData.nic}
                onChange={handleChange}
                placeholder="123456789V"
              />
              <InputItem
                label="Mobile Number"
                name="mobile_no"
                type="tel"
                value={formData.mobile_no}
                onChange={handleChange}
                placeholder="0771234567"
              />
            </div>
          </div>
          {/* User position */}
          <div className="border-b border-stone-500 pb-5 mb-3">
            <h3 className="font-medeium flex items-center gap-2">
              <UserCog size={18} /> User Role
            </h3>
            <p className="text-secondary-text text-sm mt-1 text-stone-400">
              Set user role and department.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="flex flex-col mb-[-5px]">
                <label className="mb-2 text-sm text-burning-orange-300 ml-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  className="bg-card-accent border-none outline-none text-primary-text rounded-lg p-2  disabled:bg-stone-600 disabled:text-stone-400 disabled:cursor-not-allowed"
                  onChange={handleChange}
                  required
                >
                  {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col mb-[-5px]">
                <label className="mb-2 text-sm text-burning-orange-300 ml-1">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  className="bg-card-accent border-none outline-none text-primary-text rounded-lg p-2  disabled:bg-stone-600 disabled:text-stone-400 disabled:cursor-not-allowed"
                  onChange={handleChange}
                  disabled={loadingDepartments}
                >
                  <option value="">
                    {loadingDepartments
                      ? "Loading departments..."
                      : "Select Department (Optional)"}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Set user password */}
          <div className="mb-3">
            <h3 className="font-medeium flex items-center gap-2">
              <KeyRound size={18} /> User Password
            </h3>
            <p className="text-secondary-text text-sm mt-1 text-stone-400">
              Set user password.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <InputItem
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
              <InputItem
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          {/* Submit button spanning both columns */}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-4 mt-6 border-t border-star-dust-600 ">
            <button
              type="button"
              className="px-3 py-2 bg-gray-600 text-stone-200 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 bg-orange-600 text-stone-700 rounded-lg hover:bg-orange-500 transition-colors text-sm font-medium"
            >
              {loading ? "Registering..." : "Register"}
              <UserRoundPlus className="inline ml-2" size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
