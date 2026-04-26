import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MapPin, Truck, Phone, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import Form from "../components/Form";
import api from "../api";

import {
  Buttons,
  InfoItem,
  InputItem,
  TextareaItem,
} from "../components/components";

const SupplierForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { supplierId } = useParams();

  // Determine mode from route path
  const isViewMode = location.pathname.includes("/view/");
  const isEditMode = location.pathname.includes("/edit/");

  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    website: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [supplier, setSupplier] = useState(null);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (supplierId) {
      setLoading(true);
      api
        .get(`api/supplier/${supplierId}/`)
        .then((response) => {
          const sData = response.data;
          setSupplier(sData);
          setFormData({
            name: sData.name || "",
            email: sData.email || "",
            phone: sData.phone || "",
            address: sData.address || "",
          });
        })
        .catch(() => setPageError("Failed to load supplier details."))
        .finally(() => setLoading(false));
    }
  }, [supplierId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Supplier name is required.";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setPageError("Please correct the errors below.");
      return;
    }

    setLoading(true);
    setPageError("");
    setErrors({});

    // Filter out empty strings and send them as null if desired by the backend
    const payload = Object.entries(formData).reduce((acc, [key, value]) => {
      acc[key] = value || null;
      return acc;
    }, {});

    try {
      if (isEditMode) await api.patch(`api/supplier/${supplierId}/`, payload);
      else await api.post("api/supplier/", payload);
      alert("Supplier saved successfully!");
      navigate("/supplier");
    } catch (error) {
      const apiErrors = error.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
        setErrors(apiErrors);
        setPageError("Please correct the errors below.");
      } else setPageError(apiErrors?.detail || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const canManage = user?.role === "ADMIN";

  return (
    <Form
      icon={<Truck />}
      heading={
        isViewMode
          ? "Supplier Details"
          : isEditMode
            ? "Edit Supplier"
            : "Add New Supplier"
      }
      text_01={
        isViewMode ? "View supplier information" : "Manage supplier details"
      }
      text_02="Suppliers"
      onClick={() => navigate("/supplier")}
      fnction={() => navigate(`/supplier/edit/${supplierId}`)}
      gradient="from-lime-600 to-lime-800"
      isViewMode={isViewMode && canManage}
      pageError={pageError}
      loading={loading}
    >
      {isViewMode ? (
        // View Mode
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <InfoItem
            icon={<Truck />}
            label="Supplier Name"
            value={supplier?.name}
          />
          <InfoItem icon={<Mail />} label="Email" value={supplier?.email} />
          <InfoItem icon={<Phone />} label="Phone" value={supplier?.phone} />
          <div className="md:col-span-2">
            <InfoItem
              icon={<MapPin />}
              label="Address"
              value={supplier?.address}
            />
          </div>
        </div>
      ) : (
        // Edit/Create Mode
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputItem
              label="Supplier Name"
              name="name"
              icon={<Truck />}
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Global Parts Inc."
              error={errors.name}
            />
            <InputItem
              label="Email"
              name="email"
              icon={<Mail />}
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., contact@globalparts.com"
              error={errors.email}
            />
            <InputItem
              label="Phone"
              name="phone"
              icon={<Phone />}
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., 1234567890"
              error={errors.phone}
            />
            <div className="md:col-span-2">
              <TextareaItem
                label="Address"
                name="address"
                icon={<MapPin />}
                value={formData.address}
                onChange={handleChange}
                rows="3"
                placeholder="Enter full address"
                error={errors.address}
              />
            </div>
          </div>

          <Buttons
            onCancel={() => navigate("/supplier")}
            text_01={isEditMode ? "Save Changes" : "Create Supplier"}
            disabled={loading || !canManage}
          />
        </form>
      )}
    </Form>
  );
};

export default SupplierForm;
