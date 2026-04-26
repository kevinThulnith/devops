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
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  Package,
  Trash2,
  Filter,
  Edit3,
  Box,
  Eye,
} from "lucide-react";

const MaterialListPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allMaterials, setAllMaterials] = useState([]);

  const [filters, setFilters] = useState({
    searchTerm: "",
    status: "all",
  });

  const fetchMaterials = useFetchData("material", setLoading, setAllMaterials);

  useWebSocket("materials", setAllMaterials, fetchMaterials);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMaterials();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = useDelete(
    "material",
    setLoading,
    "material",
    fetchMaterials,
  );

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFiltersHandler = () => {
    setFilters({ searchTerm: "", status: "all" });
  };

  const applyFilters = () => fetchMaterials();

  const getStatusIcon = (isLowStock) => {
    return isLowStock ? (
      <AlertTriangle size={14} className="text-red-600" />
    ) : (
      <TrendingUp size={14} className="text-green-600" />
    );
  };

  const getStatusPill = (isLowStock) => {
    const colors = isLowStock
      ? "bg-red-100 text-red-800 border border-red-200"
      : "bg-green-100 text-green-800 border border-green-200";

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${colors}`}
      >
        {getStatusIcon(isLowStock)}
        {isLowStock ? "Low Stock" : "In Stock"}
      </span>
    );
  };

  const filteredMaterials = useMemo(() => {
    return allMaterials.filter((material) => {
      const matchesSearch =
        !filters.searchTerm ||
        material.name
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        material.unit_of_measurement
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase());

      const isLowStock =
        parseFloat(material.quantity) <= parseFloat(material.reorder_level);
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "low-stock" && isLowStock) ||
        (filters.status === "in-stock" && !isLowStock);

      return matchesSearch && matchesStatus;
    });
  }, [allMaterials, filters]);

  // Statistics
  const stats = useMemo(() => {
    const totalMaterials = allMaterials.length;
    const lowStockMaterials = allMaterials.filter(
      (m) => parseFloat(m.quantity) <= parseFloat(m.reorder_level),
    ).length;
    const inStockMaterials = totalMaterials - lowStockMaterials;

    return { totalMaterials, lowStockMaterials, inStockMaterials };
  }, [allMaterials]);

  // Check permissions
  const canCreate = user?.role === "ADMIN";
  const canEdit =
    user && ["ADMIN", "SUPERVISOR", "MANAGER"].includes(user.role);

  return (
    <div>
      <div className="min-h-screen py-6">
        <div className="w-full">
          {/* Header Section */}
          <div className="rounded-2xl p-8 shadow-md mb-8 bg-card-main">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-sky-600 to-sky-800 transform hover:scale-105 transition-all duration-300">
                  <Box size={90} className="text-stone-200" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-medium mb-2 tracking-tight">
                    Materials Management
                  </h1>
                  <p className="text-star-dust-400 text-1xl">
                    Manage your inventory materials and stock levels with
                    advanced controls.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start mt-3 gap-2">
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-blue-600">
                      Total Materials:{" "}
                      <span className="font-medium">
                        {stats.totalMaterials}
                      </span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-green-600">
                      In Stock:{" "}
                      <span className="font-medium">
                        {stats.inStockMaterials}
                      </span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-red-600">
                      Low Stock:{" "}
                      <span className="font-medium">
                        {stats.lowStockMaterials}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 lg:mt-0">
                <RefreshButton
                  handleRefresh={handleRefresh}
                  refreshing={refreshing}
                />
                {canCreate && (
                  <AddButton url="/material/add" text="Add New Material" />
                )}
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="bg-card-main rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-center mb-4 text-slate-300">
              <Filter size={15} className="mx-2" />
              <h3>Search & Filters</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <SearchInput
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                text="Search materials..."
                style={{ height: "40px" }}
              />
              <SearchSelect
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                style={{ height: "40px" }}
                list={[
                  { value: "all", label: "All Status" },
                  { value: "in-stock", label: "In Stock" },
                  { value: "low-stock", label: "Low Stock" },
                ]}
              />
              <button
                onClick={resetFiltersHandler}
                className="flex-1 px-4 py-3 duration-200 font-medium bg-blue-600 rounded-lg hover:scale-105"
                style={{ height: "40px", lineHeight: "16px" }}
              >
                <RotateCcw size={16} className="mr-2 inline" />
                Reset Filters
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-all bg-yellow-600 hover:scale-105 inline-flex items-center justify-center"
                style={{ height: "40px", lineHeight: "16px" }}
              >
                <Filter size={16} className="mr-2" />
                Apply Filters
              </button>
            </div>
          </div>

          {/* Materials Table */}
          {filteredMaterials.length === 0 && !loading ? (
            <NoItems
              icon={<Box />}
              title="No Materials Found"
              description="No materials match your current filters or there are no materials in the system."
              onClick={resetFiltersHandler}
              button="Clear Filters"
            />
          ) : (
            <div className="shadow-xl rounded-2xl bg-[#2a2a2a] overflow-hidden">
              <div className="px-4 py-4 border-b border-stone-500">
                <h3 className="text-xl font-medium flex items-center">
                  <Package size={20} className="mr-2" />
                  Materials
                  <span className="text-slate-400 ml-4">
                    {filteredMaterials.length}
                  </span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-500">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Material Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Stock Level
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Reorder Level
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#2f2f2f] backdrop-blur-sm divide-y divide-gray-200">
                    {filteredMaterials.map((material) => {
                      const isLowStock =
                        parseFloat(material.quantity) <=
                        parseFloat(material.reorder_level);
                      const stockPercentage =
                        (parseFloat(material.quantity) /
                          parseFloat(material.reorder_level)) *
                        100;

                      return (
                        <tr
                          key={material.id}
                          className="hover:bg-slate-500 transition-all duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold mr-3">
                                {(material.name || "M").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-200">
                                  {material.name || "N/A"}
                                </div>
                                <div className="text-xs text-slate-400">
                                  ID: {material.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-200">
                                  {parseFloat(material.quantity).toFixed(2)}
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      isLowStock
                                        ? "bg-red-500"
                                        : stockPercentage > 150
                                          ? "bg-green-500"
                                          : "bg-yellow-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        stockPercentage,
                                        100,
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-slate-200">
                              {material.unit_of_measurement || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-300 font-medium">
                              {parseFloat(material.reorder_level).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getStatusPill(isLowStock)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                to={`/material/view/${material.id}`}
                                className="p-2 text-blue-400 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors duration-200"
                                title="View Material"
                              >
                                <Eye size={18} />
                              </Link>
                              {canEdit && (
                                <Link
                                  to={`/material/edit/${material.id}`}
                                  className="p-2 text-indigo-200 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg transition-colors duration-200"
                                  title="Edit Material"
                                >
                                  <Edit3 size={18} />
                                </Link>
                              )}
                              {canCreate && (
                                <button
                                  onClick={() => handleDelete(material.id)}
                                  className="p-2 text-red-400 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                  title="Delete Material"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && <LoadingIndicator />}
    </div>
  );
};

export default MaterialListPage;
