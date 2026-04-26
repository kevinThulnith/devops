import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import Form from "../components/Form";
import api from "../api";

import {
  Buttons,
  InfoItem,
  InputItem,
  SelectItem,
} from "../components/components";

import {
  CalendarClock,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  Activity,
  FileText,
  Package,
  Factory,
  XCircle,
  Trash2,
  Beaker,
  Clock,
} from "lucide-react";

// --- Material Consumption Line Item Form ---
const ConsumptionItemForm = ({ materials, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    material: "",
    quantity: "1.00",
    notes: "",
  });

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.material || parseFloat(formData.quantity) <= 0) return;
    onSave({
      material: parseInt(formData.material),
      quantity: formData.quantity,
      notes: formData.notes || null,
    });
    setFormData({ material: "", quantity: "1.00", notes: "" });
  };

  return (
    <div className="bg-stone-800 rounded-xl p-4 my-4 inset-shadow-2xl">
      <h4 className="text-md font-semibold text-stone-200 mb-4">
        Add Material Consumption
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectItem
            label="Material"
            name="material"
            value={formData.material}
            onChange={handleChange}
            options={materials.map((m) => ({
              value: m.id,
              label: `${m.name} (${m.quantity} ${m.unit_of_measurement || ""})`,
            }))}
            required
          />
          <InputItem
            label="Quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            type="number"
            required
          />
          <InputItem
            label="Notes (optional)"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-stone-600 hover:bg-stone-700 text-stone-200 py-2 px-3 rounded-md text-[14px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-[14px]"
          >
            {loading ? "Saving..." : "Add Consumption"}
          </button>
        </div>
      </form>
    </div>
  );
};

const ProductionScheduleListForm = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isViewMode = location.pathname.includes("/view/");
  const isCreateMode = location.pathname.includes("/new");

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [allProductionLines, setAllProductionLines] = useState([]);
  const [showAddConsumption, setShowAddConsumption] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    production_line: "",
    product: "",
    quantity: "1.00",
    start_time: "",
    end_time: "",
    status: "SCHEDULED",
  });

  // Permissions
  const canManage =
    user && ["ADMIN", "SUPERVISOR", "MANAGER"].includes(user.role);

  const canAddConsumption = canManage || (user && user.role === "OPERATOR");

  // Data Fetching
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api
        .get("api/production-line/")
        .then((res) => setAllProductionLines(res.data.results || res.data)),
      api
        .get("api/product/")
        .then((res) => setAllProducts(res.data.results || res.data)),
      api
        .get("api/material/")
        .then((res) => setAllMaterials(res.data.results || res.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const fetchScheduleData = useCallback(() => {
    if (!scheduleId) {
      // Set default start time to 5 minutes in the future
      const nowPlus5Min = new Date(new Date().getTime() + 5 * 60000);
      const localTime = new Date(
        nowPlus5Min.getTime() - nowPlus5Min.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16);
      setFormData((prev) => ({ ...prev, start_time: localTime }));
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`api/production-schedule/${scheduleId}/`)
      .then((res) => {
        setSchedule(res.data);
        setFormData({
          production_line: res.data.production_line || "",
          product: res.data.product || "",
          quantity: parseFloat(res.data.quantity || 1).toFixed(2),
          start_time: res.data.start_time
            ? new Date(
                new Date(res.data.start_time).getTime() -
                  new Date().getTimezoneOffset() * 60000,
              )
                .toISOString()
                .slice(0, 16)
            : "",
          end_time: res.data.end_time
            ? new Date(
                new Date(res.data.end_time).getTime() -
                  new Date().getTimezoneOffset() * 60000,
              )
                .toISOString()
                .slice(0, 16)
            : "",
          status: res.data.status || "SCHEDULED",
        });
        // Load consumptions from nested serializer data
        setConsumptions(res.data.comsumed_materials || []);
      })
      .catch((error) => {
        console.error("Failed to load schedule details:", error);
        setPageError("Failed to load production schedule details.");
      })
      .finally(() => setLoading(false));
  }, [scheduleId]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // Fetch material consumptions for this schedule
  // Refresh consumptions by re-fetching the schedule (consumptions are nested in the schedule response)
  const fetchConsumptions = useCallback(() => {
    if (!scheduleId) return;
    api
      .get(`api/production-schedule/${scheduleId}/`)
      .then((res) => setConsumptions(res.data.comsumed_materials || []))
      .catch((err) => console.error("Error refreshing consumptions:", err));
  }, [scheduleId]);

  useEffect(() => {
    fetchConsumptions();
  }, [fetchConsumptions]);

  // Material consumption handlers
  const handleAddConsumption = async (payload) => {
    setActionLoading(true);
    try {
      await api.post("api/material-consumption/", {
        ...payload,
        production_schedule: parseInt(scheduleId),
      });
      setShowAddConsumption(false);
      fetchConsumptions();
      // Refresh materials to get updated stock
      api
        .get("api/material/")
        .then((res) => setAllMaterials(res.data.results || res.data));
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        Object.values(err.response?.data || {})
          .flat()
          .join(", ") ||
        "Failed to add consumption.";
      setPageError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConsumption = async (id) => {
    if (!window.confirm("Delete this material consumption record?")) return;
    setActionLoading(true);
    try {
      await api.delete(`api/material-consumption/${id}/`);
      fetchConsumptions();
      api
        .get("api/material/")
        .then((res) => setAllMaterials(res.data.results || res.data));
    } catch {
      setPageError("Failed to delete consumption record.");
    } finally {
      setActionLoading(false);
    }
  };

  // Event Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDecimalChange = (e) => {
    const { name, value } = e.target;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPageError("");

    // Validate quantity
    const quantityVal = parseFloat(formData.quantity);
    if (isNaN(quantityVal) || quantityVal <= 0) {
      setPageError("Quantity must be a positive number greater than 0.");
      setLoading(false);
      return;
    }

    // Validate start time
    if (!formData.start_time) {
      setPageError("Start time is required.");
      setLoading(false);
      return;
    }

    // Validate end time if provided
    if (
      formData.end_time &&
      formData.start_time &&
      new Date(formData.end_time) < new Date(formData.start_time)
    ) {
      setPageError("End time cannot be before start time.");
      setLoading(false);
      return;
    }

    const payload = {
      production_line: parseInt(formData.production_line),
      product: parseInt(formData.product),
      quantity: parseFloat(formData.quantity).toFixed(2),
      start_time: formData.start_time
        ? new Date(formData.start_time).toISOString()
        : null,
      end_time: formData.end_time
        ? new Date(formData.end_time).toISOString()
        : null,
      status: formData.status,
    };

    if (!payload.end_time) delete payload.end_time;

    try {
      if (isCreateMode) {
        await api.post("api/production-schedule/", payload);
      } else {
        // For edit, only send updatable fields
        const updatePayload = {
          quantity: payload.quantity,
          start_time: payload.start_time,
          end_time: payload.end_time,
          status: payload.status,
        };
        // Allow changing production_line and product when schedule is still SCHEDULED
        if (schedule?.status === "SCHEDULED") {
          updatePayload.production_line = payload.production_line;
          updatePayload.product = payload.product;
        }
        await api.patch(
          `api/production-schedule/${scheduleId}/`,
          updatePayload,
        );
      }
      alert(
        `Production Schedule ${isCreateMode ? "created" : "updated"} successfully!`,
      );
      navigate("/production-schedule");
    } catch (err) {
      console.error("Form submission error:", err);
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Failed to save production schedule.";
      setPageError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      SCHEDULED: {
        color: "bg-blue-200 text-blue-800",
        icon: <Clock size={14} />,
      },
      IN_PROGRESS: {
        color: "bg-yellow-200 text-yellow-800",
        icon: <Activity size={14} />,
      },
      COMPLETED: {
        color: "bg-green-200 text-green-800",
        icon: <CheckCircle size={14} />,
      },
      CANCELLED: {
        color: "bg-red-200 text-red-800",
        icon: <XCircle size={14} />,
      },
    };
    const config = statusConfig[status] || statusConfig.SCHEDULED;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${config.color}`}
      >
        {config.icon} {status}
      </span>
    );
  };

  const isFieldDisabled = (fieldName) => {
    // In edit mode, prevent changes to production_line and product if not SCHEDULED
    if (!isCreateMode && schedule?.status !== "SCHEDULED") {
      if (fieldName === "production_line" || fieldName === "product") {
        return true;
      }
    }
    return false;
  };

  return (
    <Form
      icon={<CalendarClock />}
      heading={
        isViewMode
          ? "View Production Schedule"
          : isCreateMode
            ? "Create Production Schedule"
            : "Edit Production Schedule"
      }
      text_01={
        isViewMode
          ? "View details of the production schedule."
          : isCreateMode
            ? "Fill in the details to create a new production schedule."
            : "Modify the details of the production schedule."
      }
      text_02={"Production Schedules"}
      onClick={() => navigate("/production-schedule")}
      fnction={() => navigate("/production-schedule/edit/" + scheduleId)}
      gradient={"from-cyan-600 to-cyan-800"}
      isViewMode={isViewMode}
      pageError={pageError}
      loading={loading}
    >
      {isViewMode ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoItem
              icon={<Package />}
              label="Product"
              value={schedule?.product_name || "N/A"}
            />
            <InfoItem
              icon={<Factory />}
              label="Production Line"
              value={schedule?.production_line_name || "N/A"}
            />
            <InfoItem
              icon={<Factory />}
              label="Workshop"
              value={schedule?.workshop_name || "N/A"}
            />
            <InfoItem
              icon={<Activity />}
              label="Quantity"
              value={
                schedule?.quantity
                  ? `${parseFloat(schedule.quantity).toFixed(2)} units`
                  : "N/A"
              }
            />
            <InfoItem
              icon={<Clock />}
              label="Start Time"
              value={
                schedule?.start_time
                  ? new Date(schedule.start_time).toLocaleString()
                  : "N/A"
              }
            />
            <InfoItem
              icon={<CheckCircle />}
              label="End Time"
              value={
                schedule?.end_time
                  ? new Date(schedule.end_time).toLocaleString()
                  : "Not set"
              }
            />
            <div className="flex flex-col">
              <label className="flex items-center gap-2 text-sm text-stone-400 mb-2">
                <Activity size={16} /> Status
              </label>
              {schedule?.status && getStatusBadge(schedule.status)}
            </div>
          </div>

          {/* Material Consumption Section - View Mode */}
          <div className="mt-6 pt-5 border-t border-stone-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-stone-200 flex items-center gap-2">
                <Beaker size={20} /> Material Consumption
              </h3>
              {canAddConsumption && !showAddConsumption && (
                <button
                  onClick={() => setShowAddConsumption(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md flex items-center gap-2 transition text-[14px]"
                >
                  <PlusCircle size={18} /> Add Consumption
                </button>
              )}
            </div>

            {showAddConsumption && (
              <ConsumptionItemForm
                materials={allMaterials}
                onSave={handleAddConsumption}
                onCancel={() => setShowAddConsumption(false)}
                loading={actionLoading}
              />
            )}

            {consumptions.length > 0 ? (
              <div className="space-y-4">
                {consumptions.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-card-sub rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-2"
                  >
                    <div>
                      <p className="font-semibold text-stone-300">
                        {item.material_name}
                      </p>
                      <p className="text-sm text-stone-400">
                        {parseFloat(item.quantity).toFixed(2)}{" "}
                        {item.material_unit || "units"} &middot; by{" "}
                        {item.consumed_by_name || "Unknown"} &middot;{" "}
                        {new Date(item.consumed_at).toLocaleString()}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                          <FileText size={12} /> {item.notes}
                        </p>
                      )}
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleDeleteConsumption(item.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 italic text-center py-4">
                No material consumption recorded yet.
              </p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectItem
              label="Production Line"
              name="production_line"
              icon={<Factory />}
              value={formData.production_line}
              onChange={handleChange}
              options={allProductionLines.map((line) => ({
                value: line.id,
                label: `${line.name} (${line.workshop_name})`,
              }))}
              required
              disabled={isFieldDisabled("production_line")}
            />
            <SelectItem
              label="Product"
              name="product"
              icon={<Package />}
              value={formData.product}
              onChange={handleChange}
              options={allProducts.map((prod) => ({
                value: prod.id,
                label: `${prod.name} (${prod.code})`,
              }))}
              required
              disabled={isFieldDisabled("product")}
            />
            <InputItem
              label="Quantity to Produce"
              name="quantity"
              icon={<Activity />}
              value={formData.quantity}
              onChange={handleDecimalChange}
              type="text"
              inputMode="decimal"
              required
              disabled={!isCreateMode && schedule?.status !== "SCHEDULED"}
            />
            <SelectItem
              label="Status"
              name="status"
              icon={<Activity />}
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: "SCHEDULED", label: "Scheduled" },
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "COMPLETED", label: "Completed" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
              required
              disabled={
                !isCreateMode &&
                (schedule?.status === "COMPLETED" ||
                  schedule?.status === "CANCELLED")
              }
            />
            <InputItem
              label="Scheduled Start Time"
              name="start_time"
              icon={<Clock />}
              value={formData.start_time}
              onChange={handleChange}
              type="datetime-local"
              required
              disabled={!isCreateMode && schedule?.status !== "SCHEDULED"}
            />
            <InputItem
              label="Scheduled End Time (Optional)"
              name="end_time"
              icon={<CheckCircle />}
              value={formData.end_time}
              onChange={handleChange}
              type="datetime-local"
              disabled={!isCreateMode && schedule?.status !== "SCHEDULED"}
            />
          </div>

          {!isCreateMode && (
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
              <p className="text-xs text-blue-300 flex items-center gap-2">
                <AlertCircle size={14} />
                Major status changes are typically done via actions on the list
                page.
              </p>
            </div>
          )}

          {/* Material Consumption Section - Edit Mode */}
          {!isCreateMode && (
            <div className="mt-6 pt-5 border-t border-stone-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-stone-200 flex items-center gap-2">
                  <Beaker size={20} /> Material Consumption
                </h3>
                {canAddConsumption && !showAddConsumption && (
                  <button
                    type="button"
                    onClick={() => setShowAddConsumption(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md flex items-center gap-2 transition text-[14px]"
                  >
                    <PlusCircle size={18} /> Add Consumption
                  </button>
                )}
              </div>

              {showAddConsumption && (
                <ConsumptionItemForm
                  materials={allMaterials}
                  onSave={handleAddConsumption}
                  onCancel={() => setShowAddConsumption(false)}
                  loading={actionLoading}
                />
              )}

              {consumptions.length > 0 ? (
                <div className="space-y-4">
                  {consumptions.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-2 bg-card-sub"
                    >
                      <div>
                        <p className="font-semibold text-stone-300">
                          {item.material_name}
                        </p>
                        <p className="text-sm text-stone-400">
                          {parseFloat(item.quantity).toFixed(2)}{" "}
                          {item.material_unit || "units"} &middot; by{" "}
                          {item.consumed_by_name || "Unknown"} &middot;{" "}
                          {new Date(item.consumed_at).toLocaleString()}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                            <FileText size={12} /> {item.notes}
                          </p>
                        )}
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeleteConsumption(item.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 italic text-center py-4">
                  No material consumption recorded yet.
                </p>
              )}
            </div>
          )}

          <Buttons
            onCancel={() => navigate("/production-schedule")}
            text_01={isCreateMode ? "Create Schedule" : "Save Changes"}
            disabled={loading || !canManage}
          />
        </form>
      )}
    </Form>
  );
};

export default ProductionScheduleListForm;
