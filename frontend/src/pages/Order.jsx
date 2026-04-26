import LoadingIndicator from "../components/LoadingIndicator";
import useWebSocket from "../hooks/useWebSocket";
import useFetchData from "../hooks/useFetchData";
import useDelete from "../hooks/useDelete";
import { useAuth } from "../hooks/useAuth";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

import {
  RefreshButton,
  SearchSelect,
  SearchInput,
  AddButton,
  NoItems,
} from "../components/viewComponents";

import {
  PackageCheck,
  ShoppingCart,
  RotateCcw,
  SortDesc,
  FileText,
  Building,
  SortAsc,
  Filter,
  Trash2,
  Edit3,
  Clock,
  Eye,
} from "lucide-react";

const Order = () => {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ searchTerm: "", status: "all" });
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });

  const fetchOrders = useFetchData("order", setLoading, setAllOrders);

  useWebSocket("orders", setAllOrders, fetchOrders);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = useDelete("order", setLoading, "order", fetchOrders);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFiltersHandler = () =>
    setFilters({ searchTerm: "", status: "all" });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredAndSortedOrders = useMemo(() => {
    const filtered = allOrders.filter((order) => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        !filters.searchTerm ||
        order.id.toString().includes(searchTermLower) ||
        order.supplier_name?.toLowerCase().includes(searchTermLower);

      const matchesStatus =
        filters.status === "all" || order.status === filters.status;
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [allOrders, filters, sortConfig]);

  const stats = useMemo(
    () => ({
      total: allOrders.length,
      draft: allOrders.filter((o) => o.status === "DRAFT").length,
      ordered: allOrders.filter((o) => o.status === "ORDERED").length,
      received: allOrders.filter((o) => o.status === "RECEIVED").length,
    }),
    [allOrders],
  );

  const getStatusPill = (status) => {
    const styles = {
      DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200",
      ORDERED: "bg-blue-100 text-blue-800 border-blue-200",
      RECEIVED: "bg-green-100 text-green-800 border-green-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200",
    };
    const icons = {
      DRAFT: <FileText size={14} />,
      ORDERED: <Clock size={14} />,
      RECEIVED: <PackageCheck size={14} />,
      CANCELLED: <Trash2 size={14} />,
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 border ${
          styles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {icons[status]}
        {status}
      </span>
    );
  };

  const canManage =
    user && ["ADMIN", "SUPERVISOR", "PURCHASING"].includes(user.role);

  return (
    <div className="min-h-screen py-6">
      <div className="w-full">
        {/* Header Section */}
        <div className="rounded-2xl p-8 shadow-md mb-8 bg-card-main">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-violet-600 to-violet-800 transform hover:scale-105 transition-all duration-300">
                <ShoppingCart size={90} className="text-stone-200" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-medium mb-2 tracking-tight">
                  Purchase Orders
                </h1>
                <p className="text-star-dust-400 text-1xl">
                  Create, track, and manage all purchase orders.
                </p>
                <div className="flex items-center flex-wrap justify-center sm:justify-start mt-3 gap-2">
                  <span className="text-sm px-3 py-1 rounded-2xl bg-orange-600">
                    Total: <span className="font-medium">{stats.total}</span>
                  </span>
                  <span className="text-sm px-3 py-1 rounded-2xl bg-yellow-600">
                    Draft: <span className="font-medium">{stats.draft}</span>
                  </span>
                  <span className="text-sm px-3 py-1 rounded-2xl bg-blue-600">
                    Ordered:{" "}
                    <span className="font-medium">{stats.ordered}</span>
                  </span>
                  <span className="text-sm px-3 py-1 rounded-2xl bg-green-600">
                    Received:{" "}
                    <span className="font-medium">{stats.received}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 lg:mt-0">
              <RefreshButton
                handleRefresh={handleRefresh}
                refreshing={refreshing}
              />
              {canManage && <AddButton url="/order/add" text="New Order" />}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card-main rounded-xl p-6 mb-8 shadow-lg">
          <h3 className="flex items-center text-slate-300 mb-4">
            <Filter size={15} className="mr-2" /> Search & Filter Orders
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <SearchInput
                name="searchTerm"
                text="Search by Order ID or Supplier..."
                value={filters.searchTerm}
                onChange={handleFilterChange}
              />
            </div>
            <SearchSelect
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              list={[
                { value: "all", label: "All Statuses" },
                { value: "DRAFT", label: "Draft" },
                { value: "ORDERED", label: "Ordered" },
                { value: "RECEIVED", label: "Received" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
            />
            <button
              onClick={resetFiltersHandler}
              className="px-4 py-2 duration-200 font-medium bg-blue-600 rounded-lg hover:scale-105 inline-flex items-center justify-center"
            >
              <RotateCcw size={16} className="mr-2" /> Reset
            </button>
          </div>
        </div>

        {/* Table */}
        {filteredAndSortedOrders.length === 0 && !loading ? (
          <NoItems
            icon={<ShoppingCart />}
            title="No Orders Found"
            description="Try adjusting your filters or create your first purchase order."
          />
        ) : (
          <div className="shadow-xl rounded-2xl bg-card-main overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-500">
                <thead className="bg-[#2f2f2f]">
                  <tr>
                    <th
                      onClick={() => handleSort("id")}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-stone-700"
                    >
                      <div className="flex items-center gap-2 w-[90px]">
                        Order Id{" "}
                        {sortConfig.key === "id" &&
                          (sortConfig.direction === "asc" ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("supplier_name")}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-stone-700"
                    >
                      <div className="flex items-center">
                        Supplier{" "}
                        {sortConfig.key === "supplier_name" &&
                          (sortConfig.direction === "asc" ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th
                      onClick={() => handleSort("total")}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-stone-700"
                    >
                      <div className="flex items-center">
                        Total{" "}
                        {sortConfig.key === "total" &&
                          (sortConfig.direction === "asc" ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("order_date")}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-stone-700"
                    >
                      <div className="flex items-center">
                        Order Date{" "}
                        {sortConfig.key === "order_date" &&
                          (sortConfig.direction === "asc" ? (
                            <SortAsc size={14} />
                          ) : (
                            <SortDesc size={14} />
                          ))}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#2f2f2f] divide-y divide-stone-600">
                  {filteredAndSortedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-star-dust-800 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-orange-400">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building size={16} className="mr-2 text-slate-400" />
                          {order.supplier_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusPill(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-stone-300">
                        ${parseFloat(order.total || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-stone-400">
                        {new Date(
                          order.order_date + "T00:00:00Z",
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/order/view/${order.id}`}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </Link>
                          {canManage && order.status === "DRAFT" && (
                            <>
                              <Link
                                to={`/order/edit/${order.id}`}
                                className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-lg"
                                title="Edit Order"
                              >
                                <Edit3 size={18} />
                              </Link>
                              <button
                                onClick={() => handleDelete(order.id)}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                                title="Delete Order"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {loading && !refreshing && <LoadingIndicator />}
    </div>
  );
};

export default Order;
