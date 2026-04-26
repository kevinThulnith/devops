import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { SelectItem, InputItem, InfoItem } from "../components/components";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import Form from "../components/Form.jsx";
import api from "../api";

import {
  ShoppingCart,
  CalendarDays,
  ListOrdered,
  CheckCircle,
  DollarSign,
  PlusCircle,
  UserCircle,
  FileText,
  Building,
  XOctagon,
  Download,
  Upload,
  Trash2,
  Edit2,
  Save,
  Hash,
  Send,
  X,
} from "lucide-react";

// --- Reusable Line Item Form Sub-Component ---
const LineItemForm = ({ itemToEdit, materials, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    material: "",
    quantity: "1.00",
    unit_price: "0.00",
  });
  const [, setFormErrors] = useState({});

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        material: itemToEdit.material || "",
        quantity: parseFloat(itemToEdit.quantity || 1).toFixed(2),
        unit_price: parseFloat(itemToEdit.unit_price || 0).toFixed(2),
      });
    } else {
      setFormData({ material: "", quantity: "1.00", unit_price: "0.00" });
    }
  }, [itemToEdit]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (
      !formData.material ||
      parseFloat(formData.quantity) <= 0 ||
      parseFloat(formData.unit_price) < 0
    ) {
      setFormErrors({ general: "Please fill all fields correctly." });
      return;
    }
    setFormErrors({});

    // Note: 'order' field is NOT needed - it's automatically set from the URL
    const payload = {
      material: formData.material,
      quantity: formData.quantity,
      unit_price: formData.unit_price,
    };
    onSave(payload, itemToEdit?.id);
  };

  return (
    <div className="bg-stone-800 rounded-xl p-4 my-6 inset-shadow-2xl">
      <h4 className="text-md font-semibold text-stone-200 mb-4">
        {itemToEdit ? "Edit Item" : "Add New Item"}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectItem
            label="Material"
            name="material"
            value={formData.material}
            onChange={handleChange}
            options={materials.map((m) => ({ value: m.id, label: m.name }))}
            required
            disabled={!!itemToEdit}
          />
          <InputItem
            label="Quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
          <InputItem
            label="Unit Price"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleChange}
            required
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
            {loading ? "Saving..." : itemToEdit ? "Save Item" : "Add Item"}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Main Order Form/Detail Component ---
const OrderForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();

  const isViewMode = location.pathname.includes("/view/");
  const isCreateMode = location.pathname.includes("/add");

  const [order, setOrder] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [invoice, setInvoice] = useState(null);
  const [pageError, setPageError] = useState("");
  const [loading, setLoading] = useState({ page: true, action: false });
  const [formData, setFormData] = useState({ supplier: "", status: "DRAFT" });

  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const canManage =
    user && ["ADMIN", "SUPERVISOR", "PURCHASING"].includes(user.role);

  const isEditable = isCreateMode || (order?.status === "DRAFT" && canManage);

  const fetchOrderData = useCallback(() => {
    if (!orderId) {
      setLoading((prev) => ({ ...prev, page: false }));
      return;
    }
    setLoading((prev) => ({ ...prev, page: true }));

    // Fetch order details
    Promise.all([
      api.get(`api/order/${orderId}/`),
      api.get(`api/order/${orderId}/material/`),
    ])
      .then(([orderRes, materialsRes]) => {
        setOrder(orderRes.data);
        setLineItems(materialsRes.data.results || materialsRes.data || []);
        setFormData({
          supplier: orderRes.data.supplier,
          status: orderRes.data.status,
        });
      })
      .catch(() => setPageError("Failed to load order details."))
      .finally(() => setLoading((prev) => ({ ...prev, page: false })));
  }, [orderId]);

  useEffect(() => {
    // api.get("api/user/me/").then((res) => setUser(res.data));
    api
      .get("api/supplier/")
      .then((res) => setSuppliers(res.data.results || res.data));
    api
      .get("api/material/")
      .then((res) => setMaterials(res.data.results || res.data));
    fetchOrderData();
  }, [fetchOrderData]);

  const handleHeaderSubmit = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, action: true }));
    try {
      if (isCreateMode) {
        const res = await api.post("api/order/", {
          supplier: formData.supplier,
          status: "DRAFT",
        });
        alert("Order created! Now you can add items.");
        navigate(`/order/view/${res.data.id}`);
      } else {
        await api.patch(`api/order/${orderId}/`, {
          supplier: formData.supplier,
        });
        alert("Order header updated!");
        fetchOrderData(); // Refetch to confirm changes
      }
    } catch (err) {
      setPageError("Failed to save order header.", err);
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleSaveLineItem = async (payload, itemId) => {
    setLoading((prev) => ({ ...prev, action: true }));

    try {
      if (itemId) {
        // Update existing item - use nested endpoint with PATCH
        await api.patch(`api/order/${orderId}/material/${itemId}/`, {
          quantity: payload.quantity,
          unit_price: payload.unit_price,
        });
      } else {
        // Create new item - use nested endpoint with POST
        await api.post(`api/order/${orderId}/material/`, payload);
      }

      setShowAddItemForm(false);
      setEditingItem(null);
      fetchOrderData(); // Refetch all data
    } catch (err) {
      console.error("API error:", err.response?.data || err.message);
      setPageError("Failed to save line item.");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleDeleteLineItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setLoading((prev) => ({ ...prev, action: true }));
    try {
      // Use nested endpoint for deletion
      await api.delete(`api/order/${orderId}/material/${itemId}/`);
      fetchOrderData();
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      setPageError(err.response?.data?.detail || "Failed to delete line item.");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleOrderStatusUpdate = async (newStatus) => {
    if (
      !window.confirm(`Are you sure you want to change status to ${newStatus}?`)
    )
      return;

    // Check if invoice is required for RECEIVED status
    if (newStatus === "RECEIVED" && !order?.invoice && !invoice) {
      setPageError("Please upload an invoice before marking as received.");
      return;
    }

    setLoading((prev) => ({ ...prev, action: true }));
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("status", newStatus);

      // If there's a new invoice, add it
      if (invoice) {
        formDataToSend.append("invoice", invoice);
      }

      await api.patch(`api/order/${orderId}/`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setInvoice(null); // Clear the invoice state after successful upload
      fetchOrderData();
    } catch (err) {
      setPageError(err.response?.data?.detail || "Failed to update status.");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const orderSummary = useMemo(() => {
    const total = lineItems.reduce(
      (sum, item) => sum + parseFloat(item.total_price || 0),
      0,
    );
    return { total: total.toFixed(2), itemCount: lineItems.length };
  }, [lineItems]);

  return (
    <Form
      icon={<ShoppingCart />}
      heading={
        isViewMode
          ? `Order #${orderId} Details`
          : isCreateMode
            ? "Create New Order"
            : `Edit Order #${orderId}`
      }
      text_01={
        isViewMode
          ? "View order information and items"
          : isCreateMode
            ? "Fill in order details to create a new order"
            : "Update order information and items"
      }
      text_02="Orders"
      onClick={() => navigate("/order")}
      fnction={() => navigate(`/order/edit/${orderId}`)}
      gradient="from-violet-600 to-violet-800"
      pageError={pageError}
      isViewMode={isViewMode && canManage}
      loading={loading.action}
    >
      <form
        onSubmit={handleHeaderSubmit}
        className={`grid grid-cols-1 gap-6 items-start pb-6 mb-2 ${
          isCreateMode ? "md:grid-cols-2" : "md:grid-cols-3"
        }`}
      >
        <InfoItem
          icon={<CalendarDays />}
          label="Order Date"
          value={
            order?.order_date
              ? new Date(order.order_date + "T00:00:00Z").toLocaleDateString()
              : "Pending"
          }
        />
        {!isCreateMode && (
          <>
            <InfoItem
              icon={<UserCircle />}
              label="Created By"
              value={order?.created_by_username || user?.username || "Pending"}
            />
            <InfoItem
              icon={<UserCircle />}
              label="Supplier"
              value={
                suppliers.find((s) => s.id === order?.supplier)?.name ||
                "Unknown"
              }
            />
          </>
        )}
        {isCreateMode && (
          <SelectItem
            label="Supplier"
            name="supplier"
            icon={<Building />}
            value={formData.supplier}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, supplier: e.target.value }))
            }
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            required
            disabled={!isCreateMode}
          />
        )}

        {isCreateMode && canManage && (
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading.action}
              className="bg-orange-500 hover:bg-orange-600 text-stone-900 font-medium py-2 px-3 rounded-md flex items-center gap-2 transition text-[14px]"
            >
              Create Order
              <Save size={18} />
            </button>
          </div>
        )}
      </form>

      {!isCreateMode && (
        <>
          {/* Order Status & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <InfoItem
              icon={<DollarSign />}
              label="Order Total"
              value={`$${orderSummary.total}`}
            />
            <InfoItem
              icon={<Hash />}
              label="Item Count"
              value={`${orderSummary.itemCount} items`}
            />
            <InfoItem
              icon={<CheckCircle />}
              label="Status"
              value={order?.status}
            />
          </div>

          {/* Order Actions */}
          {isViewMode && canManage && (
            <div className="mt-6 pt-6 border-t border-star-dust-700">
              {/* Invoice Upload Section (show for ORDERED status) or Display (show for RECEIVED status) */}
              {(order?.status === "ORDERED" ||
                order?.status === "RECEIVED") && (
                <div className="p-3 bg-card-sub rounded-lg">
                  <h4 className="text-md font-semibold text-stone-200 mb-3 flex items-center gap-2">
                    <FileText size={18} /> Invoice Document
                  </h4>

                  {/* Show existing invoice if available */}
                  {order?.invoice && !invoice && (
                    <div className="mb-4 p-3 bg-card-accent rounded-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-green-400" />
                        <span className="text-sm text-stone-300">
                          Current Invoice Uploaded
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={order.invoice}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors font-medium"
                        >
                          <FileText size={14} />
                          View
                        </a>
                        <a
                          href={order.invoice}
                          download
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                        >
                          <Download size={14} />
                          Download
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Upload new invoice (only for ORDERED status) */}
                  {order?.status === "ORDERED" && (
                    <div className="space-y-3">
                      <label className="block cursor-pointer">
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                            invoice
                              ? "border-green-500 bg-green-500/10"
                              : "border-stone-600 hover:border-stone-500 hover:bg-stone-800/50"
                          }`}
                        >
                          {invoice ? (
                            <div className="flex flex-col items-center gap-2">
                              <FileText size={32} className="text-green-400" />
                              <p className="text-sm font-medium text-stone-200">
                                {invoice.name}
                              </p>
                              <p className="text-xs text-stone-400">
                                {(invoice.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload size={32} className="text-stone-400" />
                              <p className="text-sm font-medium text-stone-300">
                                {order?.invoice
                                  ? "Upload New Invoice (Replace)"
                                  : "Upload Invoice PDF"}
                              </p>
                              <p className="text-xs text-stone-400">
                                Click to browse or drag & drop
                              </p>
                            </div>
                          )}
                        </div>
                        <input
                          id="invoice-input"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file && file.type === "application/pdf") {
                              setInvoice(file);
                            } else {
                              alert("Please select a valid PDF file.");
                            }
                          }}
                        />
                      </label>
                      {invoice && (
                        <button
                          onClick={() => setInvoice(null)}
                          className="w-full bg-red-600 hover:bg-red-800 text-red-200 font-medium py-2 px-3 rounded-md flex items-center justify-center gap-2 transition text-sm"
                        >
                          <X size={16} /> Clear Selected File
                        </button>
                      )}
                      {!order?.invoice && !invoice && (
                        <p className="text-xs text-yellow-400 flex items-center gap-1">
                          ⚠️ Invoice is required before marking order as
                          received
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Status Action Buttons */}
              <div
                className={`flex flex-wrap gap-3 items-center ${
                  order?.status === "ORDERED" ? "pt-4" : ""
                }`}
              >
                {order?.status === "DRAFT" && lineItems.length > 0 && (
                  <button
                    onClick={() => handleOrderStatusUpdate("ORDERED")}
                    disabled={loading.action}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 pl-2 rounded-lg flex items-center gap-2 transition text-[14px]"
                  >
                    <Send size={16} /> Mark as Ordered
                  </button>
                )}
                {order?.status === "ORDERED" && (
                  <button
                    onClick={() => handleOrderStatusUpdate("RECEIVED")}
                    disabled={loading.action || (!order?.invoice && !invoice)}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 pl-2 rounded-lg flex items-center gap-2 transition text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      !order?.invoice && !invoice
                        ? "Please upload an invoice first"
                        : "Mark order as received"
                    }
                  >
                    <CheckCircle size={16} /> Mark as Received
                  </button>
                )}
                {(order?.status === "DRAFT" || order?.status === "ORDERED") && (
                  <button
                    onClick={() => handleOrderStatusUpdate("CANCELLED")}
                    disabled={loading.action}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 pl-2 rounded-lg flex items-center gap-2 transition text-[14px]"
                  >
                    <XOctagon size={16} />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Line Items Section */}
          <div className="mt-6 pt-5 border-t border-star-dust-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-stone-200 flex items-center gap-3">
                <ListOrdered /> Order Items
              </h3>
              {isEditable && !showAddItemForm && !editingItem && (
                <button
                  onClick={() => setShowAddItemForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md flex items-center gap-2 transition text-[14px]"
                >
                  <PlusCircle size={18} /> Add Item
                </button>
              )}
            </div>

            {isEditable && (showAddItemForm || editingItem) && (
              <LineItemForm
                itemToEdit={editingItem}
                materials={materials}
                onSave={handleSaveLineItem}
                onCancel={() => {
                  setShowAddItemForm(false);
                  setEditingItem(null);
                }}
                loading={loading.action}
              />
            )}

            {lineItems.length > 0 ? (
              <div className="space-y-2">
                {lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-card-sub rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-2"
                  >
                    <div>
                      <p className="font-semibold text-stone-300">
                        {item.material_name}
                      </p>
                      <p className="text-sm text-stone-400">
                        {item.quantity} x $
                        {parseFloat(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-orange-400">
                        ${parseFloat(item.total_price).toFixed(2)}
                      </p>
                      {isEditable && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-lg"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteLineItem(item.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 italic text-center py-4">
                No items have been added to this order yet.
              </p>
            )}
          </div>
        </>
      )}
    </Form>
  );
};

export default OrderForm;
