import LoadingIndicator from "../components/LoadingIndicator";
import useWebSocket from "../hooks/useWebSocket";
import useFetchData from "../hooks/useFetchData";
import useDelete from "../hooks/useDelete";
import { useAuth } from "../hooks/useAuth";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api";

import {
  RefreshButton,
  SearchSelect,
  SearchInput,
  AddButton,
  NoItems,
} from "../components/viewComponents";

import {
  CalendarClock,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Activity,
  XCircle,
  Factory,
  Package,
  Trash2,
  Filter,
  Edit3,
  Clock,
  Eye,
} from "lucide-react";

const ProductionSchedule = () => {
  const { user } = useAuth();
  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ searchTerm: "", status: "all" });

  const fetchSchedules = useFetchData(
    "production-schedule",
    setLoading,
    setAllSchedules,
  );

  useWebSocket("production-schedules", setAllSchedules, fetchSchedules);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSchedules();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = useDelete(
    "production-schedule",
    setLoading,
    "production schedule",
    fetchSchedules,
  );

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFiltersHandler = () => {
    setFilters({ searchTerm: "", status: "all" });
  };

  // Handle status updates
  const handleStatusUpdate = async (scheduleId, newStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to update this schedule to "${newStatus}"?`,
      )
    )
      return;

    setLoading(true);
    try {
      await api.patch(`api/production-schedule/${scheduleId}/`, {
        status: newStatus,
      });
      await fetchSchedules();
      alert("Schedule status updated successfully!");
    } catch (error) {
      console.error("Error updating schedule status:", error);
      alert(
        `Failed to update schedule status: ${
          error.response?.data?.detail ||
          error.response?.data?.status?.join(" ") ||
          "Server error"
        }`,
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = useMemo(() => {
    return allSchedules
      .filter((schedule) => {
        const searchTermLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          !filters.searchTerm ||
          schedule.product_name?.toLowerCase().includes(searchTermLower) ||
          schedule.production_line_name
            ?.toLowerCase()
            .includes(searchTermLower) ||
          schedule.id?.toString().includes(searchTermLower);

        const matchesStatus =
          filters.status === "all" || schedule.status === filters.status;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  }, [allSchedules, filters]);

  const stats = useMemo(
    () => ({
      total: allSchedules.length,
      scheduled: allSchedules.filter((s) => s.status === "SCHEDULED").length,
      inProgress: allSchedules.filter((s) => s.status === "IN_PROGRESS").length,
      completed: allSchedules.filter((s) => s.status === "COMPLETED").length,
      cancelled: allSchedules.filter((s) => s.status === "CANCELLED").length,
    }),
    [allSchedules],
  );

  // Permissions check
  const canCreate =
    user && ["ADMIN", "SUPERVISOR", "MANAGER"].includes(user.role);

  const canDelete = user?.role === "ADMIN";

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
        className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${config.color}`}
      >
        {config.icon}
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="min-h-screen py-6">
        <div className="w-full">
          {/* Header Section */}
          <div className="rounded-2xl p-8 shadow-md mb-8 bg-card-main">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-cyan-600 to-cyan-800 transform hover:scale-105 transition-all duration-300">
                  <CalendarClock size={90} className="text-stone-200" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-medium mb-2 tracking-tight">
                    Production Schedules
                  </h1>
                  <p className="text-star-dust-400 text-1xl">
                    Monitor and manage production workflows.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start mt-3 gap-2">
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-cyan-600">
                      Total: <span className="font-medium">{stats.total}</span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-blue-600">
                      Scheduled:{" "}
                      <span className="font-medium">{stats.scheduled}</span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-yellow-600">
                      In Progress:{" "}
                      <span className="font-medium">{stats.inProgress}</span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-green-600">
                      Completed:{" "}
                      <span className="font-medium">{stats.completed}</span>
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
                  <AddButton
                    url="/production-schedule/new"
                    text="New Schedule"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card-main rounded-xl p-6 mb-8 shadow-md">
            <h3 className="flex items-center text-slate-300 mb-4">
              <Filter size={15} className="mr-2" /> Search & Filters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <SearchInput
                  name="searchTerm"
                  text="Search by product, line, or ID..."
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
                  { value: "SCHEDULED", label: "Scheduled" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "COMPLETED", label: "Completed" },
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

          {/* Content Area */}
          {filteredSchedules.length === 0 && !loading ? (
            <NoItems
              icon={<CalendarClock />}
              title="No Production Schedules Found"
              description="Try adjusting your filters or create your first production schedule."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-card-main shadow-md rounded-xl p-6 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left Section - Main Info */}
                    <div className="flex-grow space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-2xl font-medium text-stone-200 flex items-center gap-2 mb-4">
                          <CalendarClock size={28} className="text-cyan-400" />
                          Schedule {schedule.id}
                        </h3>
                        <div>{getStatusBadge(schedule.status)}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-stone-400">
                          <Package size={16} className="mr-2 text-cyan-400" />
                          <span className="mr-2">Product:</span>
                          <span className="text-stone-300 font-medium">
                            {schedule.product_name || (
                              <span className="italic text-gray-500">N/A</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center text-stone-400">
                          <Factory size={16} className="mr-2 text-cyan-400" />
                          <span className="mr-2">Line:</span>
                          <span className="text-stone-300 font-medium">
                            {schedule.production_line_name}
                          </span>
                        </div>
                        <div className="flex items-center text-stone-400">
                          <Activity size={16} className="mr-2 text-cyan-400" />
                          <span className="mr-2">Quantity:</span>
                          <span className="text-stone-300 font-medium">
                            {parseFloat(schedule.quantity).toFixed(2)} units
                          </span>
                        </div>
                        <div className="flex items-center text-stone-400">
                          <Clock size={16} className="mr-2 text-cyan-400" />
                          <span className="mr-2">Start:</span>
                          <span className="text-stone-300 font-medium">
                            {new Date(schedule.start_time).toLocaleString()}
                          </span>
                        </div>
                        {schedule.end_time && (
                          <div className="flex items-center text-stone-400">
                            <CheckCircle
                              size={16}
                              className="mr-2 text-green-400"
                            />
                            <span className="mr-2">End:</span>
                            <span className="text-stone-300 font-medium">
                              {new Date(schedule.end_time).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex lg:flex-col items-center gap-2 lg:border-l lg:border-stone-700 lg:pl-6">
                      <Link
                        to={`/production-schedule/view/${schedule.id}`}
                        className="text-cyan-200 hover:text-black transition duration-200 p-2 hover:bg-cyan-200 rounded-full shadow-sm"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </Link>

                      {canCreate && (
                        <Link
                          to={`/production-schedule/edit/${schedule.id}`}
                          className="text-indigo-200 hover:text-indigo-800 transition duration-200 p-2 hover:bg-indigo-100 rounded-full shadow-sm"
                          title="Edit Schedule"
                        >
                          <Edit3 size={20} />
                        </Link>
                      )}

                      {canCreate && schedule.status === "SCHEDULED" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(schedule.id, "IN_PROGRESS")
                          }
                          className="text-yellow-200 hover:text-yellow-800 transition duration-200 p-2 hover:bg-yellow-100 rounded-full shadow-sm"
                          title="Start Progress"
                        >
                          <PlayCircle size={20} />
                        </button>
                      )}

                      {canCreate && schedule.status === "IN_PROGRESS" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(schedule.id, "COMPLETED")
                            }
                            className="text-green-200 hover:text-green-800 transition duration-200 p-2 hover:bg-green-100 rounded-full shadow-sm"
                            title="Mark Completed"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(schedule.id, "SCHEDULED")
                            }
                            className="text-blue-200 hover:text-blue-800 transition duration-200 p-2 hover:bg-blue-100 rounded-full shadow-sm"
                            title="Pause"
                          >
                            <PauseCircle size={20} />
                          </button>
                        </>
                      )}

                      {canCreate &&
                        (schedule.status === "SCHEDULED" ||
                          schedule.status === "IN_PROGRESS") && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(schedule.id, "CANCELLED")
                            }
                            className="text-orange-200 hover:text-orange-800 transition duration-200 p-2 hover:bg-orange-100 rounded-full shadow-sm"
                            title="Cancel Schedule"
                          >
                            <XCircle size={20} />
                          </button>
                        )}

                      {canDelete &&
                        (schedule.status === "SCHEDULED" ||
                          schedule.status === "CANCELLED") && (
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="text-red-200 hover:text-red-800 transition duration-200 p-2 hover:bg-red-100 rounded-full shadow-sm"
                            title="Delete Schedule"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && <LoadingIndicator />}
    </>
  );
};

export default ProductionSchedule;
