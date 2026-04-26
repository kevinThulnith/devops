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

import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Activity,
  Calendar,
  Package,
  Factory,
  Wrench,
  User,
  Cog,
} from "lucide-react";

const MachineForm = () => {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine mode from route path
  const isViewMode = location.pathname.includes("/view/");
  const isEditMode = location.pathname.includes("/edit/");

  const [formData, setFormData] = useState({
    name: "",
    model_number: "",
    serial_number: "",
    workshop: "",
    operator: "",
    status: "OPERATIONAL",
    purchase_date: "",
    last_maintenance_date: "",
    next_maintenance_date: "",
    specifications: "",
  });

  const { user } = useAuth();
  const [errors, setErrors] = useState({});
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workshops, setWorkshops] = useState([]);
  const [operators, setOperators] = useState([]);
  const [pageError, setPageError] = useState("");
  const [workshopsLoading, setWorkshopsLoading] = useState(false);
  const [operatorsLoading, setOperatorsLoading] = useState(false);

  useEffect(() => {
    api
      .get("api/workshop/")
      .then((response) =>
        setWorkshops(response.data.results || response.data || []),
      )
      .catch((error) => console.error("Failed to fetch workshops:", error))
      .finally(() => setWorkshopsLoading(false));
    setOperatorsLoading(true);

    api
      .get("api/user/")
      .then((response) => {
        const allUsers = response.data.results || response.data || [];
        const operatorUsers = allUsers.filter((u) => u.role === "OPERATOR"); // !Filter for operators only
        setOperators(operatorUsers);
      })
      .catch((error) => console.error("Failed to fetch operators:", error))
      .finally(() => setOperatorsLoading(false));

    if (machineId) {
      setLoading(true);
      api
        .get(`api/machine/${machineId}/`)
        .then((response) => {
          const mc = response.data;
          setMachine(mc);
          setFormData({
            name: mc.name || "",
            model_number: mc.model_number || "",
            serial_number: mc.serial_number || "",
            workshop: mc.workshop || "",
            operator: mc.operator || "",
            status: mc.status || "OPERATIONAL",
            purchase_date: mc.purchase_date || "",
            last_maintenance_date: mc.last_maintenance_date || "",
            next_maintenance_date: mc.next_maintenance_date || "",
            specifications: mc.specifications || "",
          });
        })
        .catch((error) => {
          setPageError("Failed to load machine details.");
          console.error(error);
        })
        .finally(() => setLoading(false));
    }
  }, [machineId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Machine name is required";
    if (!formData.workshop) newErrors.workshop = "Workshop is required";
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
      operator: formData.operator || null,
      purchase_date: formData.purchase_date || null,
      last_maintenance_date: formData.last_maintenance_date || null,
      next_maintenance_date: formData.next_maintenance_date || null,
    };

    // Filter payload based on user permissions
    let finalPayload = payload;

    if (isEditMode) {
      if (canEditOperatorAndStatus && !canEditAllFields) {
        // SUPERVISOR/MANAGER: only operator and status
        finalPayload = {
          operator: payload.operator,
          status: payload.status,
        };
      } else if (canEditMaintenanceAndStatus && !canEditAllFields) {
        // TECHNICIAN: only status, last_maintenance_date, next_maintenance_date
        finalPayload = {
          status: payload.status,
          last_maintenance_date: payload.last_maintenance_date,
          next_maintenance_date: payload.next_maintenance_date,
        };
      }
    }

    try {
      if (isEditMode)
        await api.patch(`api/machine/${machineId}/`, finalPayload);
      else await api.post("api/machine/", finalPayload);
      alert("Machine saved successfully!");
      navigate("/machine");
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

  const getWorkshopOptions = () => {
    return workshops.map((ws) => ({
      value: ws.id,
      label: ws.name,
    }));
  };

  const getOperatorOptions = () => {
    return operators.map((op) => ({
      value: op.id,
      label:
        op.first_name && op.last_name
          ? `${op.first_name} ${op.last_name} (${op.username})`
          : op.username,
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      OPERATIONAL: {
        color: "bg-green-200 text-green-800",
        icon: <CheckCircle size={14} />,
      },
      IDLE: {
        color: "bg-yellow-200 text-yellow-800",
        icon: <Activity size={14} />,
      },
      MAINTENANCE: {
        color: "bg-blue-200 text-blue-800",
        icon: <Wrench size={14} />,
      },
      BROKEN: {
        color: "bg-red-200 text-red-800",
        icon: <AlertTriangle size={14} />,
      },
    };
    const config = statusConfig[status] || statusConfig.OPERATIONAL;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${config.color}`}
      >
        {config.icon}
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString + "T00:00:00Z").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Determine field editability based on backend permissions
  const canEditAllFields = user?.role === "ADMIN";
  const canEditOperatorAndStatus =
    user && ["SUPERVISOR", "MANAGER"].includes(user.role);
  const canEditMaintenanceAndStatus = user?.role === "TECHNICIAN";

  return (
    <Form
      icon={<Cog />}
      heading={
        isViewMode
          ? "Machine Details"
          : isEditMode
            ? "Edit Machine"
            : "Create New Machine"
      }
      text_01={
        isViewMode
          ? "View machine information"
          : isEditMode
            ? "Update machine information and settings"
            : "Add a new machine to your workshop"
      }
      text_02="Machines"
      onClick={() => navigate("/machine")}
      fnction={() => navigate(`/machine/edit/${machineId}`)}
      gradient="from-yellow-600 to-yellow-800"
      isViewMode={
        isViewMode &&
        (canEditAllFields ||
          canEditOperatorAndStatus ||
          canEditMaintenanceAndStatus)
      }
      pageError={pageError}
      loading={loading}
    >
      {isViewMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem icon={<Cog />} label="Machine Name" value={machine?.name} />
          <InfoItem
            icon={<Package />}
            label="Model Number"
            value={machine?.model_number}
          />
          <InfoItem
            icon={<Factory />}
            label="Workshop"
            value={machine?.workshop_name}
          />
          <InfoItem
            icon={<User />}
            label="Current Operator"
            value={machine?.operator_name}
          />

          <InfoItem
            icon={<Calendar />}
            label="Purchase Date"
            value={formatDate(machine?.purchase_date)}
          />
          <InfoItem
            icon={<Wrench />}
            label="Last Maintenance"
            value={formatDate(machine?.last_maintenance_date)}
          />
          <InfoItem
            icon={<Calendar />}
            label="Next Maintenance"
            value={formatDate(machine?.next_maintenance_date)}
          />
          <div className="flex flex-col">
            <label className="flex items-center gap-2 text-sm text-stone-400 mb-2">
              <Activity size={16} />
              Status
            </label>
            {machine?.status && getStatusBadge(machine.status)}
          </div>
          <div className="md:col-span-2">
            <InfoItem
              icon={<FileText />}
              label="Specifications"
              value={machine?.specifications}
            />
          </div>
        </div>
      ) : (
        // !Edit/Create Mode
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputItem
                label="Machine Name"
                name="name"
                icon={<Cog />}
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter machine name"
                error={errors.name}
                disabled={isEditMode && !canEditAllFields}
              />
            </div>

            <InputItem
              label="Model Number"
              name="model_number"
              icon={<Package />}
              value={formData.model_number}
              onChange={handleChange}
              placeholder="e.g., XYZ-2000"
              error={errors.model_number}
              disabled={isEditMode && !canEditAllFields}
            />

            <SelectItem
              label="Workshop"
              name="workshop"
              icon={<Factory />}
              value={formData.workshop}
              onChange={handleChange}
              options={getWorkshopOptions()}
              loading={workshopsLoading}
              error={errors.workshop}
              required
              disabled={isEditMode && !canEditAllFields}
            />

            <SelectItem
              label="Operator"
              name="operator"
              icon={<User />}
              value={formData.operator}
              onChange={handleChange}
              options={getOperatorOptions()}
              loading={operatorsLoading}
              error={errors.operator}
              disabled={
                isEditMode && !canEditAllFields && !canEditOperatorAndStatus
              }
            />

            <SelectItem
              label="Status"
              name="status"
              icon={<Activity />}
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: "OPERATIONAL", label: "Operational" },
                { value: "IDLE", label: "Idle" },
                { value: "MAINTENANCE", label: "Under Maintenance" },
                { value: "BROKEN", label: "Broken" },
              ]}
              error={errors.status}
              required
              disabled={
                isEditMode &&
                !canEditAllFields &&
                !canEditOperatorAndStatus &&
                !canEditMaintenanceAndStatus
              }
            />

            <InputItem
              label="Purchase Date"
              name="purchase_date"
              icon={<Calendar />}
              type="date"
              value={formData.purchase_date}
              onChange={handleChange}
              error={errors.purchase_date}
              disabled={isEditMode && !canEditAllFields}
            />

            <InputItem
              label="Last Maintenance Date"
              name="last_maintenance_date"
              icon={<Wrench />}
              type="date"
              value={formData.last_maintenance_date}
              onChange={handleChange}
              error={errors.last_maintenance_date}
              disabled={
                isEditMode && !canEditAllFields && !canEditMaintenanceAndStatus
              }
            />

            <InputItem
              label="Next Maintenance Date"
              name="next_maintenance_date"
              icon={<Calendar />}
              type="date"
              value={formData.next_maintenance_date}
              onChange={handleChange}
              error={errors.next_maintenance_date}
              disabled={
                isEditMode && !canEditAllFields && !canEditMaintenanceAndStatus
              }
            />

            <div className="md:col-span-2">
              <TextareaItem
                label="Specifications"
                name="specifications"
                icon={<FileText />}
                value={formData.specifications}
                onChange={handleChange}
                rows="4"
                placeholder="Enter machine specifications and technical details"
                error={errors.specifications}
                disabled={isEditMode && !canEditAllFields}
              />
            </div>
          </div>

          <Buttons
            onCancel={() => navigate("/machine")}
            text_01={isEditMode ? "Save Changes" : "Create Machine"}
            disabled={
              loading ||
              (isEditMode &&
                !canEditAllFields &&
                !canEditOperatorAndStatus &&
                !canEditMaintenanceAndStatus)
            }
          />
        </form>
      )}
    </Form>
  );
};

export default MachineForm;
