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
  CheckCircle2,
  RotateCcw,
  Activity,
  Factory,
  XCircle,
  Trash2,
  Filter,
  Wrench,
  Edit3,
  Star,
  Cog,
  Eye,
} from "lucide-react";

const ProductionLine = () => {
  const { user } = useAuth();
  const [allLines, setAllLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ searchTerm: "", status: "all" });

  const fetchProductionLines = useFetchData(
    "production-line",
    setLoading,
    setAllLines,
  );

  useWebSocket("production-lines", setAllLines, fetchProductionLines);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProductionLines();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = useDelete(
    "production-line",
    setLoading,
    "production line",
    fetchProductionLines,
  );

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFiltersHandler = () => {
    setFilters({ searchTerm: "", status: "all" });
  };

  const filteredLines = useMemo(() => {
    return allLines.filter((line) => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        !filters.searchTerm ||
        line.name.toLowerCase().includes(searchTermLower) ||
        line.workshop_name?.toLowerCase().includes(searchTermLower);

      const matchesStatus =
        filters.status === "all" || line.operational_status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [allLines, filters]);

  const stats = useMemo(
    () => ({
      total: allLines.length,
      active: allLines.filter((line) => line.operational_status === "ACTIVE")
        .length,
      inactive: allLines.filter(
        (line) => line.operational_status === "INACTIVE",
      ).length,
      maintenance: allLines.filter(
        (line) => line.operational_status === "MAINTENANCE",
      ).length,
    }),
    [allLines],
  );

  const getStatusPill = (status) => {
    const config = {
      ACTIVE: {
        style: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle2 size={14} />,
      },
      INACTIVE: {
        style: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle size={14} />,
      },
      MAINTENANCE: {
        style: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Wrench size={14} />,
      },
    };

    const statusConfig = config[status] || {
      style: "bg-gray-100 text-gray-800 border-gray-200",
      icon: null,
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 border ${statusConfig.style}`}
      >
        {statusConfig.icon}
        {status}
      </span>
    );
  };

  const canManage = user && ["ADMIN", "SUPERVISOR"].includes(user.role);

  return (
    <div className="min-h-screen py-6">
      <div className="w-full">
        {/* Header Section */}
        <div className="rounded-2xl p-8 shadow-md mb-8 bg-card-main">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-amber-600 to-amber-800 transform hover:scale-105 transition-all duration-300">
                <Factory size={90} className="text-stone-200" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-medium mb-2 tracking-tight">
                  Production Lines
                </h1>
                <p className="text-star-dust-400 text-1xl">
                  Manage and monitor all assembly and production lines.
                </p>
                <div className="flex items-center flex-wrap justify-center sm:justify-start mt-3 gap-2">
                  <span className="text-sm px-3 py-1 rounded-2xl bg-orange-600">
                    Total: <span className="font-medium">{stats.total}</span>
                  </span>
                  <span className="text-sm px-3 py-1 rounded-2xl bg-green-600">
                    Active: <span className="font-medium">{stats.active}</span>
                  </span>
                  <span className="text-sm px-3 py-1 rounded-2xl bg-red-600">
                    Inactive:{" "}
                    <span className="font-medium">{stats.inactive}</span>
                  </span>
                  <span className="text-sm px-3 py-1 rounded-2xl bg-yellow-600">
                    Maintenance:{" "}
                    <span className="font-medium">{stats.maintenance}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 lg:mt-0">
              <RefreshButton
                handleRefresh={handleRefresh}
                refreshing={refreshing}
              />
              {canManage && (
                <AddButton url="/production-line/add" text="Add Line" />
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card-main rounded-xl p-6 mb-8 shadow-md">
          <h3 className="flex items-center text-slate-300 mb-4">
            <Filter size={15} className="mr-2" /> Search & Filter Lines
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <SearchInput
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                text="Search by name or workshop..."
              />
            </div>
            <SearchSelect
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              list={[
                { value: "all", label: "All Statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "MAINTENANCE", label: "Maintenance" },
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

        {/* Content Area */}
        {filteredLines.length === 0 && !loading ? (
          <NoItems
            icon={<Factory />}
            title="No Production Lines Found"
            description="Try adjusting your filters or add your first production line."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLines.map((line) => (
              <div
                key={line.id}
                className="bg-card-main rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2
                      className="text-xl font-medium text-stone-300 flex items-center truncate"
                      title={line.name}
                    >
                      <Activity
                        size={24}
                        className="mr-3 text-orange-500 flex-shrink-0"
                      />
                      <span className="truncate">{line.name}</span>
                    </h2>
                    {getStatusPill(line.operational_status)}
                  </div>

                  <p
                    className="text-sm text-gray-400 mb-4 h-10 overflow-hidden line-clamp-2"
                    title={line.description}
                  >
                    {line.description || (
                      <span className="italic text-gray-400">
                        No description provided.
                      </span>
                    )}
                  </p>

                  <div className="space-y-3 text-sm mb-4">
                    <div className="flex items-center text-white">
                      <Factory
                        size={16}
                        className="mr-3 text-gray-400 flex-shrink-0"
                      />
                      <span
                        className="truncate"
                        title={line.workshop_name || "Not specified"}
                      >
                        {line.workshop_name || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center text-white">
                      <Star
                        size={16}
                        className="mr-3 text-gray-400 flex-shrink-0"
                      />
                      <span className="truncate">
                        Capacity: {line.production_capacity || "N/A"} units/hr
                      </span>
                    </div>
                    <div className="flex items-center text-white">
                      <Cog
                        size={16}
                        className="mr-3 text-gray-400 flex-shrink-0"
                      />
                      <span className="truncate">
                        {line.machines.length + " machines" || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto px-6 py-2 bg-card-sub">
                  <div className="flex items-center justify-end">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/production-line/view/${line.id}`}
                        className="text-purple-200 hover:text-black transition duration-200 p-2 hover:bg-purple-200 rounded-full shadow-sm"
                        title="View Production Line Details"
                      >
                        <Eye size={20} />
                      </Link>
                      {canManage && (
                        <>
                          <Link
                            to={`/production-line/edit/${line.id}`}
                            className="text-indigo-200 hover:text-indigo-800 transition duration-200 p-2 hover:bg-indigo-100 rounded-full shadow-sm"
                            title="Edit Production Line"
                          >
                            <Edit3 size={20} />
                          </Link>
                          <button
                            onClick={() => handleDelete(line.id)}
                            className="text-red-200 hover:text-red-800 transition duration-200 p-2 hover:bg-red-100 rounded-full shadow-sm"
                            title="Delete Production Line"
                          >
                            <Trash2 size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {loading && !refreshing && <LoadingIndicator />}
    </div>
  );
};

export default ProductionLine;
