import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
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
  ClipboardList,
  CheckCircle,
  AlertCircle,
  ArrowDown,
  FileText,
  Activity,
  ListPlus,
  Package,
  XCircle,
  ArrowUp,
  Trash2,
  Tag,
} from "lucide-react";

const ProductForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams();

  // Determine mode
  const isViewMode = location.pathname.includes("/view/");
  const isEditMode = location.pathname.includes("/edit/");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    status: "ACTIVE",
    unit_of_measurement: "",
    specifications: "{}",
    selected_processes: [],
  });

  const [errors, setErrors] = useState({});
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [allProcesses, setAllProcesses] = useState([]);
  const [processToAdd, setProcessToAdd] = useState("");

  // Fetch user for permissions & all available processes
  useEffect(() => {
    api
      .get("api/manufacturing-process/")
      .then((res) => setAllProcesses(res.data.results || res.data));

    if (productId) {
      setLoading(true);
      api
        .get(`api/product/${productId}/`)
        .then((response) => {
          const pData = response.data;
          setProduct(pData);
          setFormData({
            name: pData.name || "",
            code: pData.code || "",
            status: pData.status || "ACTIVE",
            unit_of_measurement: pData.unit_of_measurement || "",
            specifications: JSON.stringify(pData.specifications || {}, null, 2),
            selected_processes: (pData.processes || [])
              .map((p, index) => ({
                // Use manufacturing_processes array for IDs or fallback to index
                id: pData.manufacturing_processes?.[index] || index,
                name: p.process__name, // Map from process__name instead of name
                sequence: p.sequence,
              }))
              .sort((a, b) => a.sequence - b.sequence),
          });
        })
        .catch(() => setPageError("Failed to load product details."))
        .finally(() => setLoading(false));
    }
  }, [productId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleAddProcess = () => {
    const process = allProcesses.find((p) => p.id === parseInt(processToAdd));
    if (!process) return;
    setFormData((prev) => ({
      ...prev,
      selected_processes: [
        ...prev.selected_processes,
        { ...process, sequence: prev.selected_processes.length + 1 },
      ],
    }));
    setProcessToAdd("");
  };

  const handleRemoveProcess = (id) => {
    const updated = formData.selected_processes
      .filter((p) => p.id !== id)
      .map((p, index) => ({ ...p, sequence: index + 1 }));
    setFormData((prev) => ({ ...prev, selected_processes: updated }));
  };

  const moveProcess = (id, direction) => {
    const processes = [...formData.selected_processes];
    const index = processes.findIndex((p) => p.id === id);
    if (direction === "up" && index > 0)
      [processes[index], processes[index - 1]] = [
        processes[index - 1],
        processes[index],
      ];
    else if (direction === "down" && index < processes.length - 1)
      [processes[index], processes[index + 1]] = [
        processes[index + 1],
        processes[index],
      ];
    const resequenced = processes.map((p, i) => ({ ...p, sequence: i + 1 }));
    setFormData((prev) => ({ ...prev, selected_processes: resequenced }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPageError("");
    setErrors({});

    // Validate JSON specifications
    try {
      JSON.parse(formData.specifications);
    } catch {
      setErrors({ specifications: "Invalid JSON format" });
      setLoading(false);
      return;
    }

    // Product payload (without processes)
    const productPayload = {
      name: formData.name,
      code: formData.code,
      status: formData.status,
      unit_of_measurement: formData.unit_of_measurement,
      specifications: JSON.parse(formData.specifications),
    };

    try {
      let savedProduct;
      if (isEditMode) {
        // Update existing product
        savedProduct = (
          await api.patch(`api/product/${productId}/`, productPayload)
        ).data;

        // Delete existing processes for this product
        const existingProcesses = (
          await api.get(`api/product/${productId}/process/`)
        ).data;
        await Promise.all(
          existingProcesses.map((pp) =>
            api.delete(`api/product/${productId}/process/${pp.id}/`),
          ),
        );
      } else {
        // Create new product
        savedProduct = (await api.post("api/product/", productPayload)).data;
      }

      // Create new process associations
      await Promise.all(
        formData.selected_processes.map((p) =>
          api.post(`api/product/${savedProduct.id}/process/`, {
            process: p.id,
            sequence: p.sequence,
          }),
        ),
      );

      alert("Product saved successfully!");
      navigate("/product");
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === "object") {
          setErrors(errorData);
          setPageError(
            Object.values(errorData).flat().join(", ") ||
              "Failed to save product.",
          );
        } else setPageError(errorData || "Failed to save product.");
      } else setPageError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canManage = user?.role === "ADMIN";

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: {
        color: "bg-green-200 text-green-800",
        icon: <CheckCircle size={14} />,
      },
      INACTIVE: {
        color: "bg-yellow-200 text-yellow-800",
        icon: <AlertCircle size={14} />,
      },
      DISCONTINUED: {
        color: "bg-red-200 text-red-800",
        icon: <XCircle size={14} />,
      },
    };
    const config = statusConfig[status] || statusConfig.ACTIVE;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${config.color}`}
      >
        {config.icon}
        {status}
      </span>
    );
  };

  return (
    <Form
      icon={<Package />}
      heading={
        isViewMode
          ? "Product Details"
          : isEditMode
            ? "Edit Product"
            : "Add New Product"
      }
      text_01={
        isViewMode ? "View product information" : "Manage product details"
      }
      text_02="Products"
      onClick={() => navigate("/product")}
      fnction={() => navigate(`/product/edit/${productId}`)}
      gradient="from-amber-600 to-amber-800"
      isViewMode={isViewMode && canManage}
      pageError={pageError}
      loading={loading}
    >
      {" "}
      {isViewMode ? (
        <div className="space-y-8">
          {/* View Mode: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <InfoItem
              icon={<Package />}
              label="Product Name"
              value={product?.name}
            />
            <InfoItem
              icon={<Tag />}
              label="Product Code"
              value={product?.code}
            />
            <InfoItem
              icon={<ClipboardList />}
              label="Unit of Measurement"
              value={product?.unit_of_measurement}
            />
            <div className="flex flex-col">
              <label className="flex items-center gap-2 text-sm text-stone-400 mb-2">
                <Activity size={16} /> Status
              </label>
              {product?.status && getStatusBadge(product.status)}
            </div>
          </div>
          <div className="bg-card-sub p-2 pl-3 rounded-lg border-l-4 border-orange-600">
            <label className="flex items-center gap-2 text-sm text-stone-400 mb-2">
              <FileText size={16} />
              Specifications (JSON)
            </label>
            <pre className="bg-stone-900/50 p-3 rounded-lg whitespace-pre-wrap text-base font-medium text-stone-300">
              {formData.specifications || (
                <span className="text-stone-500">N/A</span>
              )}
            </pre>
          </div>
          <div>
            <h3 className="text-lg font-medium text-stone-300 mb-3 border-b border-stone-700 pb-2">
              Manufacturing Steps
            </h3>
            <div className="space-y-2 mt-4">
              {formData.selected_processes.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-card-sub rounded-md flex items-center"
                >
                  <span className="font-semibold text-orange-400 w-8">
                    {p.sequence}.
                  </span>
                  <span className="text-stone-300">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Form: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputItem
              label="Product Name"
              name="name"
              icon={<Package />}
              value={formData.name}
              onChange={handleChange}
              required
            />
            <InputItem
              label="Product Code"
              name="code"
              icon={<Tag />}
              value={formData.code}
              onChange={handleChange}
              required
            />
            <SelectItem
              label="Status"
              name="status"
              icon={<Activity />}
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "DISCONTINUED", label: "Discontinued" },
              ]}
              required
            />
            <InputItem
              label="Unit of Measurement"
              name="unit_of_measurement"
              icon={<ClipboardList />}
              value={formData.unit_of_measurement}
              onChange={handleChange}
            />
          </div>
          {/* Form: Specs */}
          <div className="mt-6">
            <TextareaItem
              label="Specifications (JSON format)"
              name="specifications"
              icon={<FileText />}
              value={formData.specifications}
              onChange={handleChange}
              rows="6"
              error={errors.specifications}
            />
          </div>
          {/* Form: Manufacturing Steps */}
          <div className="mt-8 pt-6 border-t border-stone-700">
            <h3 className="text-lg font-medium text-stone-300 mb-4">
              Manufacturing Steps
            </h3>
            <div className="flex items-end gap-3 mb-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-stone-400 mb-1">
                  Add Process
                </label>
                <select
                  value={processToAdd}
                  onChange={(e) => setProcessToAdd(e.target.value)}
                  className="w-full px-4 text-slate-200 appearance-none outline-none rounded-lg bg-card-sub h-10"
                >
                  <option value="">Select a process...</option>
                  {allProcesses
                    .filter(
                      (p) =>
                        !formData.selected_processes.find(
                          (sp) => sp.id === p.id,
                        ),
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddProcess}
                disabled={!processToAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md flex items-center gap-2 transition text-[14px] disabled:opacity-50 h-10"
              >
                <ListPlus size={18} /> Add
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {formData.selected_processes.map((p, i) => (
                <div
                  key={p.id}
                  className="p-2.5 bg-card-sub rounded-md flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="font-semibold text-orange-400 w-8 indent-2">
                      {p.sequence}.
                    </span>
                    <span>{p.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => moveProcess(p.id, "up")}
                      disabled={i === 0}
                      className="p-1.5 text-stone-400 hover:text-white disabled:opacity-40 rounded-full hover:bg-stone-700"
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProcess(p.id, "down")}
                      disabled={i === formData.selected_processes.length - 1}
                      className="p-1.5 text-stone-400 hover:text-white disabled:opacity-40 rounded-full hover:bg-stone-700"
                    >
                      <ArrowDown size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveProcess(p.id)}
                      className="p-1.5 text-red-500 hover:text-red-400 rounded-full hover:bg-red-500/20"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Buttons
            onCancel={() => navigate("/product")}
            disabled={loading}
            text_01={isEditMode ? "Save Changes" : "Create Product"}
          />
        </form>
      )}
    </Form>
  );
};

export default ProductForm;
