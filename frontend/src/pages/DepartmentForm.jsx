import { Building2, FileText, MapPin, House, User } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import Form from "../components/Form";
import api from "../api";

import {
  TextareaItem,
  SelectItem,
  InputItem,
  InfoItem,
  Buttons,
} from "../components/components";

const DepartmentForm = () => {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine mode from route path
  const isViewMode = location.pathname.includes("/view/");
  const isEditMode = location.pathname.includes("/edit/");

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    supervisor: "",
    description: "",
  });

  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [department, setDepartment] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    setUsersLoading(true);
    api
      .get("api/user/")
      .then((response) =>
        setUsers(response.data.results || response.data || []),
      )
      .catch((error) => console.error("Failed to fetch users:", error))
      .finally(() => setUsersLoading(false));

    if (departmentId) {
      setLoading(true);
      api
        .get(`api/department/${departmentId}/`)
        .then((response) => {
          const dept = response.data;
          setDepartment(dept);
          setFormData({
            name: dept.name || "",
            location: dept.location || "",
            supervisor: dept.supervisor || "",
            description: dept.description || "",
          });
        })
        .catch((error) => {
          setPageError("Failed to load department details.");
          console.error(error);
        })
        .finally(() => setLoading(false));
    }
  }, [departmentId, isEditMode, isViewMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Department name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setPageError("");
    setErrors({});

    const payload = {
      ...formData,
      supervisor: formData.supervisor || null,
    };

    try {
      if (isEditMode) await api.put(`api/department/${departmentId}/`, payload);
      else await api.post("api/department/", payload);
      alert("Department updated successfully !!!");
      navigate("/department");
    } catch (error) {
      console.error("Form submission error:", error.response);
      const apiErrors = error.response?.data;

      if (apiErrors && typeof apiErrors === "object") {
        const newFormErrors = {};
        for (const key in apiErrors) {
          if (Object.hasOwn(formData, key) && Array.isArray(apiErrors[key])) {
            newFormErrors[key] = apiErrors[key].join(" ");
          }
        }
        setErrors(newFormErrors);

        if (Object.keys(newFormErrors).length === 0) {
          setPageError(
            apiErrors.detail || "An error occurred. Please try again.",
          );
        } else setPageError("Please correct the errors below.");
      } else {
        setPageError(
          error.response?.data?.detail ||
            "An error occurred. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserOptions = () => {
    return users.map((user) => ({
      value: user.id,
      label:
        user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name} (${user.username})`
          : user.username,
    }));
  };

  return (
    <Form
      icon={<Building2 />}
      heading={
        isViewMode
          ? "Department Details"
          : isEditMode
            ? "Edit Department"
            : "Create New Department"
      }
      text_01={
        isViewMode
          ? "View department information"
          : isEditMode
            ? "Update department information and settings"
            : "Add a new department to your organization"
      }
      text_02="Departments"
      onClick={() => navigate("/department")}
      fnction={() => navigate(`/department/edit/${departmentId}`)}
      gradient="from-red-600 to-red-800"
      isViewMode={user?.role === "ADMIN"}
      pageError={pageError}
      loading={loading}
    >
      {isViewMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem
            icon={<Building2 />}
            label="Department Name"
            value={department?.name}
          />
          <InfoItem
            icon={<MapPin />}
            label="Location"
            value={department?.location}
          />
          <InfoItem
            icon={<User />}
            label="Supervisor"
            value={department?.supervisor_name}
          />
          <InfoItem
            icon={<House />}
            label="Workshops"
            value={department?.workshops}
          />
          <div className="md:col-span-2">
            <InfoItem
              icon={<FileText />}
              label="Description"
              value={department?.description}
            />
          </div>
        </div>
      ) : (
        // !Edit/Create Mode
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputItem
                label="Department Name"
                name="name"
                icon={<Building2 />}
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter department name"
                error={errors.name}
              />
            </div>

            <div className="md:col-span-2">
              <TextareaItem
                label="Description"
                name="description"
                icon={<FileText />}
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe the department's purpose and responsibilities"
                error={errors.description}
              />
            </div>

            <InputItem
              label="Location"
              name="location"
              icon={<MapPin />}
              value={formData.location}
              onChange={handleChange}
              placeholder="Building, floor, or area"
              error={errors.location}
            />

            <SelectItem
              label="Supervisor"
              name="supervisor"
              icon={<User />}
              value={formData.supervisor}
              onChange={handleChange}
              options={getUserOptions()}
              loading={usersLoading}
              error={errors.supervisor}
            />
          </div>

          <Buttons
            onCancel={() => navigate("/department")}
            text_01={isEditMode ? "Save Changes" : "Create Department"}
          />
        </form>
      )}
    </Form>
  );
};

export default DepartmentForm;
