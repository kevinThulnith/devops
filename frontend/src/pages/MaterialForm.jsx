import { Warehouse, FileText, Package, Ruler, Box } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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

const MaterialForm = () => {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine mode from route path
  const isViewMode = location.pathname.includes("/view/");
  const isEditMode = location.pathname.includes("/edit/");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "0.00",
    reorder_level: "0.00",
    unit_of_measurement: "",
  });

  const { user } = useAuth();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [material, setMaterial] = useState(null);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (materialId) {
      setLoading(true);
      api
        .get(`api/material/${materialId}/`)
        .then((response) => {
          const mData = response.data;
          setMaterial(mData);
          setFormData({
            name: mData.name || "",
            description: mData.description || "",
            unit_of_measurement: mData.unit_of_measurement || "",
            quantity: parseFloat(mData.quantity || 0).toFixed(2),
            reorder_level: parseFloat(mData.reorder_level || 0).toFixed(2),
          });
        })
        .catch((error) => {
          setPageError("Failed to load material details.");
          console.error(error);
        })
        .finally(() => setLoading(false));
    }
  }, [materialId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleDecimalChange = (e) => {
    const { name, value } = e.target;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Material name is required.";
    if (
      isNaN(parseFloat(formData.quantity)) ||
      parseFloat(formData.quantity) < 0
    ) {
      newErrors.quantity = "Quantity must be a non-negative number.";
    }
    if (
      isNaN(parseFloat(formData.reorder_level)) ||
      parseFloat(formData.reorder_level) < 0
    ) {
      newErrors.reorder_level = "Reorder level must be a non-negative number.";
    }
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
      quantity: parseFloat(formData.quantity).toFixed(2),
      reorder_level: parseFloat(formData.reorder_level).toFixed(2),
    };

    try {
      if (isEditMode) {
        await api.patch(`api/material/${materialId}/`, payload);
      } else {
        await api.post("api/material/", payload);
      }
      alert("Material saved successfully!");
      navigate("/material");
    } catch (error) {
      console.error("Form submission error:", error.response);
      const apiErrors = error.response?.data;

      if (apiErrors && typeof apiErrors === "object") {
        const newFormErrors = {};
        for (const key in apiErrors) {
          if (
            Object.prototype.hasOwnProperty.call(formData, key) &&
            Array.isArray(apiErrors[key])
          ) {
            newFormErrors[key] = apiErrors[key].join(" ");
          }
        }
        setErrors(newFormErrors);

        if (Object.keys(newFormErrors).length === 0) {
          setPageError(
            apiErrors.detail || "An error occurred. Please try again.",
          );
        } else {
          setPageError("Please correct the errors below.");
        }
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

  return (
    <Form
      icon={<Box />}
      heading={
        isViewMode
          ? "Material Details"
          : isEditMode
            ? "Edit Material"
            : "Create New Material"
      }
      text_01={
        isViewMode
          ? "View material information"
          : isEditMode
            ? "Update material information"
            : "Add a new material to your inventory"
      }
      text_02="Materials"
      onClick={() => navigate("/material")}
      fnction={() => navigate(`/material/edit/${materialId}`)}
      gradient="from-sky-600 to-sky-800"
      isViewMode={isViewMode && user?.role !== "PURCHASING"}
      pageError={pageError}
      loading={loading}
    >
      {isViewMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem
            icon={<Package />}
            label="Material Name"
            value={material?.name}
          />
          <InfoItem
            icon={<Ruler />}
            label="Unit of Measurement"
            value={material?.unit_of_measurement}
          />
          <InfoItem
            icon={<Warehouse />}
            label="Quantity in Stock"
            value={material?.quantity}
          />
          <InfoItem
            icon={<Warehouse />}
            label="Reorder Level"
            value={material?.reorder_level}
          />
          <div className="md:col-span-2">
            <InfoItem
              icon={<FileText />}
              label="Description"
              value={material?.description}
            />
          </div>
        </div>
      ) : (
        // !Edit/Create Mode
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputItem
                label="Material Name"
                name="name"
                icon={<Package />}
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Steel Plate 5mm"
                error={errors.name}
              />
            </div>

            <InputItem
              label="Unit of Measurement"
              name="unit_of_measurement"
              icon={<Ruler />}
              value={formData.unit_of_measurement}
              onChange={handleChange}
              placeholder="e.g., kg, meters, units"
              error={errors.unit_of_measurement}
            />

            <InputItem
              label="Quantity"
              name="quantity"
              icon={<Warehouse />}
              value={formData.quantity}
              onChange={handleDecimalChange}
              required
              inputMode="decimal"
              error={errors.quantity}
            />

            <InputItem
              label="Reorder Level"
              name="reorder_level"
              icon={<Warehouse />}
              value={formData.reorder_level}
              onChange={handleDecimalChange}
              required
              inputMode="decimal"
              error={errors.reorder_level}
            />

            <div className="md:col-span-2">
              <TextareaItem
                label="Description"
                name="description"
                icon={<FileText />}
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Enter details about the material"
                error={errors.description}
              />
            </div>
          </div>

          <Buttons
            onCancel={() => navigate("/material")}
            text_01={isEditMode ? "Save Changes" : "Create Material"}
          />
        </form>
      )}
    </Form>
  );
};

export default MaterialForm;
