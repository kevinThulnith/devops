import LoadingIndicator from "../components/LoadingIndicator";
import useWebSocket from "../hooks/useWebSocket";
import useFetchData from "../hooks/useFetchData";
import useDelete from "../hooks/useDelete";
import { useAuth } from "../hooks/useAuth";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

import {
  RefreshButton,
  SearchInput,
  AddButton,
  NoItems,
} from "../components/viewComponents";

import {
  AlertTriangle,
  CalendarDays,
  UserCircle,
  ListChecks,
  UsersRound,
  Briefcase,
  RotateCcw,
  Factory,
  Trash2,
  Filter,
  Users,
  Edit3,
  Clock,
  Eye,
} from "lucide-react";

const LaborAllocations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allAllocations, setAllAllocations] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: "",
    employeeId: "",
    dateFrom: "",
    dateTo: "",
  });

  const fetchAllocations = useFetchData(
    "allocation",
    setLoading,
    setAllAllocations,
  );

  useWebSocket("labor-allocation", setAllAllocations, fetchAllocations);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllocations();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = useDelete(
    "allocation",
    setLoading,
    "labor allocation",
    fetchAllocations,
  );

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFiltersHandler = () => {
    setFilters({
      searchTerm: "",
      employeeId: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const filteredAllocations = useMemo(() => {
    return allAllocations
      .filter((alloc) => {
        const searchTermLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          !filters.searchTerm ||
          alloc.employee_name?.toLowerCase().includes(searchTermLower) ||
          alloc.employee_username?.toLowerCase().includes(searchTermLower) ||
          alloc.project_name?.toLowerCase().includes(searchTermLower) ||
          alloc.task_name?.toLowerCase().includes(searchTermLower) ||
          alloc.production_line_name?.toLowerCase().includes(searchTermLower) ||
          alloc.target_name?.toLowerCase().includes(searchTermLower) ||
          alloc.id?.toString().includes(searchTermLower);

        const matchesEmployee =
          !filters.employeeId ||
          alloc.employee?.toString() === filters.employeeId;

        const matchesDateFrom =
          !filters.dateFrom ||
          new Date(alloc.date) >= new Date(filters.dateFrom);

        const matchesDateTo =
          !filters.dateTo || new Date(alloc.date) <= new Date(filters.dateTo);

        return (
          matchesSearch && matchesEmployee && matchesDateFrom && matchesDateTo
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allAllocations, filters]);

  const stats = useMemo(
    () => ({
      total: allAllocations.length,
      totalHours: allAllocations.reduce(
        (sum, alloc) => sum + parseFloat(alloc.hours_allocated || 0),
        0,
      ),
      taskAllocations: allAllocations.filter(
        (a) => a.allocation_type === "task",
      ).length,
      projectAllocations: allAllocations.filter(
        (a) => a.allocation_type === "project",
      ).length,
      productionLineAllocations: allAllocations.filter(
        (a) => a.allocation_type === "production_line",
      ).length,
    }),
    [allAllocations],
  );

  const canCreate =
    user && ["ADMIN", "SUPERVISOR", "MANAGER"].includes(user.role);

  const canEdit = () =>
    user && ["ADMIN", "SUPERVISOR", "MANAGER"].includes(user.role);

  const getAllocationType = (alloc) => {
    if (alloc.task) return "task";
    if (alloc.project) return "project";
    if (alloc.production_line) return "production_line";
    return "unknown";
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "task":
        return <ListChecks size={16} className="text-purple-400" />;
      case "project":
        return <Briefcase size={16} className="text-blue-400" />;
      case "production_line":
        return <Factory size={16} className="text-green-400" />;
      default:
        return <AlertTriangle size={16} className="text-gray-400" />;
    }
  };

  const getTargetName = (alloc) => {
    if (alloc.task_name) return alloc.task_name;
    if (alloc.project_name) return alloc.project_name;
    if (alloc.production_line_name) return alloc.production_line_name;
    return alloc.target_name || "N/A";
  };

  return (
    <>
      <div className="min-h-screen py-6">
        <div className="w-full">
          {/* Header Section */}
          <div className="rounded-2xl p-8 shadow-md mb-8 bg-card-main">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-orange-600 to-orange-800 transform hover:scale-105 transition-all duration-300">
                  <UsersRound size={90} className="text-stone-200" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-medium mb-2 tracking-tight">
                    Labor Allocations
                  </h1>
                  <p className="text-star-dust-400 text-1xl">
                    Track and manage employee work assignments with
                    comprehensive allocation tracking.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start mt-3 gap-2">
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-orange-600">
                      Total: <span className="font-medium">{stats.total}</span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-blue-600">
                      Hours:{" "}
                      <span className="font-medium">
                        {stats.totalHours.toFixed(1)}
                      </span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-purple-600">
                      Tasks:{" "}
                      <span className="font-medium">
                        {stats.taskAllocations}
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
                  <AddButton
                    url="/labor-allocation/add"
                    text="New Allocation"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">
                    Total Allocations
                  </p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-10 w-10 text-orange-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Total Hours
                  </p>
                  <p className="text-3xl font-bold">
                    {stats.totalHours.toFixed(1)}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    Task Allocations
                  </p>
                  <p className="text-3xl font-bold">{stats.taskAllocations}</p>
                </div>
                <ListChecks className="h-10 w-10 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Production Lines
                  </p>
                  <p className="text-3xl font-bold">
                    {stats.productionLineAllocations}
                  </p>
                </div>
                <Factory className="h-10 w-10 text-green-200" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card-main rounded-xl p-6 mb-8 shadow-md">
            <h3 className="flex items-center text-slate-300 mb-4">
              <Filter size={15} className="mr-2" /> Search & Filters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <SearchInput
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                text="Search employee, project, task..."
              />
              <input
                type="text"
                name="employeeId"
                placeholder="Employee ID"
                value={filters.employeeId}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border-none outline-none rounded-lg bg-card-sub"
              />
              <input
                type="date"
                name="dateFrom"
                placeholder="Date From"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border-none outline-none rounded-lg bg-card-sub text-slate-400"
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
          {filteredAllocations.length === 0 && !loading ? (
            <NoItems
              icon={<UsersRound/>}
              title="No Labor Allocations Found"
              description="Try adjusting your filters or create your first allocation."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredAllocations.map((alloc) => {
                const allocType = getAllocationType(alloc);
                return (
                  <div
                    key={alloc.id}
                    className="bg-card-main shadow-md rounded-xl p-6 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left Section - Main Info */}
                      <div className="flex-grow space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-2xl font-medium text-stone-200 flex items-center gap-2 mb-2">
                              <UserCircle
                                size={28}
                                className="text-orange-400"
                              />
                              {alloc.employee_name || alloc.employee_username}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm text-stone-400 flex items-center gap-1">
                                {getTypeIcon(allocType)}
                                {allocType.replace("_", " ").toUpperCase()}
                              </span>
                              <span className="text-sm font-bold text-orange-400">
                                {parseFloat(alloc.hours_allocated).toFixed(2)}{" "}
                                hrs
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-stone-400">
                            {getTypeIcon(allocType)}
                            <span className="ml-2 mr-2">Target:</span>
                            <span className="text-stone-300 font-medium">
                              {getTargetName(alloc)}
                            </span>
                          </div>
                          <div className="flex items-center text-stone-400">
                            <CalendarDays
                              size={16}
                              className="mr-2 text-blue-400"
                            />
                            <span className="mr-2">Date:</span>
                            <span className="text-stone-300 font-medium">
                              {new Date(
                                alloc.date + "T00:00:00Z",
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {alloc.project_name && (
                            <div className="flex items-center text-stone-400">
                              <Briefcase
                                size={16}
                                className="mr-2 text-indigo-400"
                              />
                              <span className="mr-2">Project:</span>
                              <span className="text-stone-300 font-medium">
                                {alloc.project_name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center text-stone-400">
                            <Clock size={16} className="mr-2 text-green-400" />
                            <span className="mr-2">Updated:</span>
                            <span className="text-stone-300 font-medium text-xs">
                              {new Date(alloc.updated_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex lg:flex-col items-center gap-2 lg:border-l lg:border-stone-700 lg:pl-6">
                        <Link
                          to={`/labor-allocation/view/${alloc.id}`}
                          className="text-cyan-200 hover:text-black transition duration-200 p-2 hover:bg-cyan-200 rounded-full shadow-sm"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </Link>

                        {canEdit(alloc) && (
                          <>
                            <Link
                              to={`/labor-allocation/edit/${alloc.id}`}
                              className="text-indigo-200 hover:text-indigo-800 transition duration-200 p-2 hover:bg-indigo-100 rounded-full shadow-sm"
                              title="Edit Allocation"
                            >
                              <Edit3 size={20} />
                            </Link>
                            <button
                              onClick={() => handleDelete(alloc.id)}
                              className="text-red-200 hover:text-red-800 transition duration-200 p-2 hover:bg-red-100 rounded-full shadow-sm"
                              title="Delete Allocation"
                            >
                              <Trash2 size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {loading && <LoadingIndicator />}
    </>
  );
};

export default LaborAllocations;
