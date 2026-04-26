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

import {
  SlidersHorizontal,
  ListChecks,
  FileText,
  Factory,
  Clock,
} from "lucide-react";

const ManufacturingProcessForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { processId } = useParams();

  // Mode Detection
  const isViewMode = location.pathname.includes("/view/");
  const isEditMode = location.pathname.includes("/edit/");

  // State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    standard_time: "00:00:00",
    quality_parameters: "{}",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [processData, setProcessData] = useState(null);

  useEffect(() => {
    if (processId) {
      setLoading(true);
      api
        .get(`api/manufacturing-process/${processId}/`)
        .then((response) => {
          const data = response.data;
          setProcessData(data);
          setFormData({
            name: data.name || "",
            description: data.description || "",
            standard_time: data.standard_time || "00:00:00",
            quality_parameters: JSON.stringify(
              data.quality_parameters || {},
              null,
              2,
            ),
          });
        })
        .catch(() => setPageError("Failed to load process details."))
        .finally(() => setLoading(false));
    }
  }, [processId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Name Validation
    if (!formData.name.trim()) newErrors.name = "Process name is required.";

    // Time Validation (Regex from your original code)
    const timeRegex =
      /^(\d+\s+days?,\s+)?([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/; // "X days, HH:MM:SS"
    const simpleTimeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/; // "HH:MM:SS"
    const shortTimeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/; // "HH:MM"
    const secondsRegex = /^\d+$/; // "SS"

    if (
      !formData.standard_time.match(timeRegex) &&
      !formData.standard_time.match(simpleTimeRegex) &&
      !formData.standard_time.match(shortTimeRegex) &&
      !formData.standard_time.match(secondsRegex)
    ) {
      newErrors.standard_time =
        "Invalid format. Use HH:MM:SS (e.g., 01:30:00).";
    }

    // JSON Validation
    try {
      const parsedParams = JSON.parse(formData.quality_parameters);
      if (
        typeof parsedParams !== "object" ||
        parsedParams === null ||
        Array.isArray(parsedParams)
      ) {
        newErrors.quality_parameters =
          'Must be a valid JSON object (e.g., {"key": "value"}).';
      }
    } catch (e) {
      newErrors.quality_parameters = "Invalid JSON format." + " " + e.message;
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

    try {
      // Parse JSON before sending
      const payload = {
        ...formData,
        quality_parameters: JSON.parse(formData.quality_parameters),
      };

      if (isEditMode)
        await api.patch(`api/manufacturing-process/${processId}/`, payload);
      else await api.post("api/manufacturing-process/", payload);

      alert(
        `Manufacturing Process ${
          isEditMode ? "updated" : "created"
        } successfully.`,
      );
      navigate("/manufacturing-process");
    } catch (error) {
      console.error("Submission Error:", error);
      const apiErrors = error.response?.data;

      if (apiErrors && typeof apiErrors === "object") {
        const newFormErrors = {};
        for (const key in apiErrors) {
          if (
            Object.prototype.hasOwnProperty.call(formData, key) &&
            Array.isArray(apiErrors[key])
          )
            newFormErrors[key] = apiErrors[key].join(" ");
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
          error.response?.data?.detail || "An unexpected error occurred.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to format JSON for View Mode
  const formatJSON = (data) => {
    if (!data) return "N/A";
    try {
      return (
        <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    } catch (e) {
      return "Invalid Data" + e.message;
    }
  };

  // Check if user has write permission (ADMIN role)
  const canWrite = user?.role === "ADMIN";

  return (
    <Form
      icon={<ListChecks />}
      heading={
        isViewMode
          ? "Process Details"
          : isEditMode
            ? "Edit Process"
            : "Define Process"
      }
      text_01={
        isViewMode
          ? "View manufacturing process specifications"
          : isEditMode
            ? "Update process standards and parameters"
            : "Create a new manufacturing standard"
      }
      text_02="Manufacturing Processes"
      onClick={() => navigate("/manufacturing-process")}
      fnction={() => navigate(`/manufacturing-process/edit/${processId}`)}
      gradient="from-purple-600 to-purple-800"
      isViewMode={isViewMode && canWrite}
      pageError={pageError}
      loading={loading}
    >
      {isViewMode ? (
        // --- VIEW MODE ---
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem
            icon={<Factory />}
            label="Process Name"
            value={processData?.name}
          />
          <InfoItem
            icon={<Clock />}
            label="Standard Time"
            value={processData?.standard_time}
          />
          <div className="md:col-span-2">
            <InfoItem
              icon={<SlidersHorizontal />}
              label="Quality Parameters"
              value={formatJSON(processData?.quality_parameters)}
            />
          </div>
          <div className="md:col-span-2">
            <InfoItem
              icon={<FileText />}
              label="Description"
              value={processData?.description}
            />
          </div>
        </div>
      ) : (
        // --- EDIT/CREATE MODE ---
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <InputItem
              label="Process Name"
              name="name"
              icon={<Factory />}
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Metal Casting Phase 1"
              error={errors.name}
            />

            {/* Standard Time */}
            <div className="relative">
              <InputItem
                label="Standard Time"
                name="standard_time"
                icon={<Clock />}
                value={formData.standard_time}
                onChange={handleChange}
                required
                placeholder="HH:MM:SS (e.g., 01:30:00)"
                error={errors.standard_time}
              />
              {!errors.standard_time && (
                <p className="text-xs text-stone-400 mt-1 ml-1">
                  Format: HH:MM:SS or "D days, HH:MM:SS"
                </p>
              )}
            </div>

            {/* Quality Parameters (JSON) */}
            <div className="md:col-span-2">
              <TextareaItem
                label="Quality Parameters (JSON)"
                name="quality_parameters"
                icon={<SlidersHorizontal />}
                value={formData.quality_parameters}
                onChange={handleChange}
                rows="5"
                placeholder={
                  '{\n  "tolerance": "±0.01mm",\n  "finish": "smooth"\n}'
                }
                error={errors.quality_parameters}
              />
              <p className="text-xs text-stone-400 mt-1">
                Must be valid JSON format.
              </p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <TextareaItem
                label="Description"
                name="description"
                icon={<FileText />}
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Describe the manufacturing steps and requirements..."
                error={errors.description}
              />
            </div>
          </div>

          <Buttons
            onCancel={() => navigate("/manufacturing-processes")}
            text_01={isEditMode ? "Save Changes" : "Create Process"}
            disabled={loading || !canWrite}
          />
        </form>
      )}
    </Form>
  );
};

export default ManufacturingProcessForm;
