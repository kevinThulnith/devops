import LoadingIndicator from "../components/LoadingIndicator";
import { MdOutlineConfirmationNumber } from "react-icons/md";
import { RotateCcwKey, UserRound } from "lucide-react";
import { Buttons } from "../components/components";
import { LuUserRoundPen } from "react-icons/lu";
import { useAuth } from "../hooks/useAuth.jsx";
import { useState } from "react";
import api from "../api";

import {
  FiSmartphone,
  FiBriefcase,
  FiCalendar,
  FiUser,
  FiMail,
} from "react-icons/fi";

// !Display info items
const InfoItem = ({ icon, label, value }) => (
  <div className="bg-card-sub p-2 rounded-lg border-l-4 border-orange-600 shadow-lg">
    <label className="flex items-center gap-2 text-sm text-stone-400 mb-1">
      {icon} {label}
    </label>
    <p className="text-base font-medium">
      {value === null || value === undefined || value === "" ? (
        <span className="text-stone-500">N/A</span>
      ) : (
        value
      )}
    </p>
  </div>
);

// !Input component for forms
const InputItem = ({ label, name, caption, ...props }) => (
  <div className="flex flex-col mb-[-5px]">
    <label htmlFor={name} className="mb-2 text-sm text-stone-400 ml-1">
      {label}
    </label>
    <input
      id={name}
      name={name}
      className="bg-card-accent border-none outline-none text-stone-200 rounded-lg p-2  disabled:bg-[#5a5a5a] disabled:text-stone-400 disabled:cursor-not-allowed"
      {...props}
    />
    {caption && (
      <small className="text-stone-400 mt-1 text-xs">{caption}</small>
    )}
  </div>
);

const ProfilePage = () => {
  const { user, loading, setLoading } = useAuth();
  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveChanges = (updatedData) => {
    setLoading(true);
    const apiData = {
      username: user.username,
      first_name: updatedData.firstname,
      last_name: updatedData.lastname,
      email: updatedData.email,
      dob: updatedData.dob || null,
      nic: updatedData.nic || null,
      mobile_no: updatedData.mobile || null,
    };

    // ?Only include password if it's being changed
    if (updatedData.newPassword) apiData.password = updatedData.newPassword;

    api
      .put("api/user/me/", apiData)
      .then((res) => {
        localStorage.setItem("user", JSON.stringify(res.data));
        alert("Profile updated successfully !!!");
        setIsEditing(false);
        setLoading(false);
        window.location.reload();
      })
      .catch((error) => {
        alert("API Error:", error.response?.data || error);
        setLoading(false);
      });
  };

  return (
    <div className="p-4 sm:p-6 flex justify-center text-star-dust-200">
      <div className="w-full max-w-4xl bg-card-main shadow-md rounded-xl p-5 sm:p-7">
        {!user ? (
          <div className="text-center py-8">
            <p className="text-stone-400">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center mb-5 pb-3 border-b gap-[-5px] border-stone-500">
              <div className="flex">
                <div className="bg-yellow-500 rounded-lg p-1 sm:mr-6 mb-4 sm:mb-0 shadow-lg">
                  <UserRound className="text-stone-800 sm:h-[40px] sm:w-[40px] h-[30px] w-[30px]" />
                </div>
                <h1 className="font-medium text-2xl sm:hidden ml-4 mt-1">
                  {user.name || user.name || "Unknown User"}
                </h1>
              </div>
              <div className="text-center sm:text-left">
                <h1 className="font-medium hidden sm:block text-2xl">
                  {user.name || user.name || "Unknown User"}
                </h1>
                <p className="text-stone-400 text-sm">
                  {user.role || "No Role"} •{" "}
                  {user.department_name || "No Department"}
                </p>
              </div>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="mt-4 sm:mt-0 sm:ml-auto bg-orange-600 hover:bg-burning-orange-700 text-stone-800 font-medium py-2 px-4 rounded-lg text-[14px]"
                >
                  Edit Profile
                  <LuUserRoundPen size={18} className="inline-block ml-2" />
                </button>
              )}
            </div>

            {isEditing ? (
              <ProfileEditForm
                user={user}
                onSave={handleSaveChanges}
                onCancel={handleCancel}
              />
            ) : (
              <ProfileView user={user} />
            )}
          </>
        )}
      </div>
      {loading && <LoadingIndicator />}
    </div>
  );
};

// Component to Display User Data
const ProfileView = ({ user }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <InfoItem icon={<FiUser />} label="Full Name" value={user.name} />
    <InfoItem icon={<FiUser />} label="Username" value={user.username} />
    <InfoItem icon={<FiMail />} label="Email Address" value={user.email} />
    <InfoItem icon={<FiBriefcase />} label="Role" value={user.role} />
    <InfoItem
      icon={<FiBriefcase />}
      label="Department"
      value={user.department_name}
    />
    <InfoItem icon={<FiCalendar />} label="Date of Birth" value={user.dob} />
    <InfoItem
      icon={<MdOutlineConfirmationNumber />}
      label="NIC Number"
      value={user.nic}
    />
    <InfoItem
      icon={<FiSmartphone />}
      label="Mobile Number"
      value={user.mobile_no}
    />
  </div>
);

// Component for the Edit Form
const ProfileEditForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    firstname: user.first_name || "",
    lastname: user.last_name || "",
    email: user.email || "",
    dob: user.dob || "",
    nic: user.nic || "",
    mobile: user.mobile_no || "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      alert("New passwords do not match!");
      return;
    }
    // Prepare data for submission, excluding passwords if not changed
    const dataToSave = { ...formData };
    if (!dataToSave.newPassword) {
      delete dataToSave.newPassword;
      delete dataToSave.confirmPassword;
    }

    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputItem
          label="First Name"
          name="firstname"
          value={formData.firstname}
          onChange={handleChange}
          required
        />
        <InputItem
          label="Last Name"
          name="lastname"
          value={formData.lastname}
          onChange={handleChange}
          required
        />
        <InputItem
          label="Email Address"
          name="email"
          value={formData.email}
          onChange={handleChange}
          type="email"
          required
        />
        <InputItem
          label="Username"
          name="username"
          value={user.username}
          disabled
          caption="Username cannot be changed"
        />
        <InputItem
          label="Date of Birth"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          type="date"
        />
        <InputItem
          label="NIC Number"
          name="nic"
          placeholder="e.g., 1234567890"
          value={formData.nic}
          onChange={handleChange}
        />
        <InputItem
          label="Mobile Number"
          name="mobile"
          placeholder="0771234567"
          value={formData.mobile}
          onChange={handleChange}
        />
      </div>

      <div className="mt-6 pt-4 border-t border-stone-500">
        <h3 className="font-medium flex items-center gap-2">
          <RotateCcwKey size={18} /> Change Password
        </h3>
        <p className="text-secondary-text text-sm mt-1 text-stone-400">
          Leave fields blank to keep your current password.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <InputItem
            label="New Password"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$"
            title="Password must be at least 8 characters and include both letters and numbers"
            caption="Minimum 8 characters with both letters and numbers"
          />
          <InputItem
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$"
            title="Password must be at least 8 characters and include both letters and numbers"
          />
        </div>
      </div>

      {<Buttons onCancel={onCancel} />}
    </form>
  );
};

export default ProfilePage;
