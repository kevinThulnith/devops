import LoadingIndicator from "../components/LoadingIndicator";
import { useState, useMemo, useEffect } from "react";
import useWebSocket from "../hooks/useWebSocket";
import useFetchData from "../hooks/useFetchData";
import useDelete from "../hooks/useDelete";
import { useAuth } from "../hooks/useAuth";
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
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  ListChecks,
  PlayCircle,
  Briefcase,
  RotateCcw,
  XCircle,
  Target,
  Trash2,
  Filter,
  Edit3,
  Users,
  Eye,
} from "lucide-react";

const Tasks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: "",
    status: "all",
    project: "",
    assigned_to: "",
  });

  const fetchTasks = useFetchData("task", setLoading, setAllTasks);

  // Fetch projects and users for filters
  useEffect(() => {
    api
      .get("api/project/")
      .then((res) => setAllProjects(res.data.results || res.data))
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

  useWebSocket("tasks", setAllTasks, fetchTasks);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = useDelete("task", setLoading, "task", fetchTasks);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFiltersHandler = () => {
    setFilters({ searchTerm: "", status: "all", project: "", assigned_to: "" });
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to update this task to "${newStatus}"?`,
      )
    )
      return;

    setLoading(true);
    api
      .patch(`api/task/${taskId}/`, { status: newStatus })
      .then(() => {
        fetchTasks();
        alert("Task status updated successfully!");
      })
      .catch((error) => {
        console.error("Error updating task status:", error);
        alert(
          `Failed to update task status: ${
            error.response?.data?.detail ||
            error.response?.data?.status?.join(" ") ||
            "Server error"
          }`,
        );
      })
      .finally(() => setLoading(false));
  };

  const filteredTasks = useMemo(() => {
    return allTasks
      .filter((task) => {
        const searchTermLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          !filters.searchTerm ||
          task.name?.toLowerCase().includes(searchTermLower) ||
          task.description?.toLowerCase().includes(searchTermLower) ||
          task.project_name?.toLowerCase().includes(searchTermLower) ||
          task.assigned_to_name?.toLowerCase().includes(searchTermLower) ||
          task.id?.toString().includes(searchTermLower);

        const matchesStatus =
          filters.status === "all" || task.status === filters.status;

        const matchesProject =
          !filters.project || task.project?.toString() === filters.project;

        const matchesAssignedTo =
          !filters.assigned_to ||
          task.assigned_to?.toString() === filters.assigned_to;

        return (
          matchesSearch && matchesStatus && matchesProject && matchesAssignedTo
        );
      })
      .sort((a, b) => {
        // Sort by end_date, then by status priority
        const dateA = new Date(a.end_date || "9999-12-31");
        const dateB = new Date(b.end_date || "9999-12-31");
        return dateA - dateB;
      });
  }, [allTasks, filters]);

  const stats = useMemo(
    () => ({
      total: allTasks.length,
      pending: allTasks.filter((t) => t.status === "PENDING").length,
      inProgress: allTasks.filter((t) => t.status === "IN_PROGRESS").length,
      completed: allTasks.filter((t) => t.status === "COMPLETED").length,
      blocked: allTasks.filter((t) => t.status === "BLOCKED").length,
      overdue: allTasks.filter((t) => {
        const dueDate = new Date(t.end_date + "T00:00:00Z");
        return dueDate < new Date() && t.status !== "COMPLETED";
      }).length,
    }),
    [allTasks],
  );

  // Permission checks
  const canCreate =
    user && ["ADMIN", "SUPERVISOR", "MANAGER"].includes(user.role);
  const canEdit = (task) =>
    user &&
    (user.role === "ADMIN" ||
      user.role === "SUPERVISOR" ||
      (user.role === "MANAGER" && task.project_manager_id === user.id) ||
      task.assigned_to === user.id);
  const canDelete = (task) =>
    user &&
    (user.role === "ADMIN" ||
      user.role === "SUPERVISOR" ||
      (user.role === "MANAGER" && task.project_manager_id === user.id));

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: {
        color: "bg-yellow-200 text-yellow-800",
        icon: <Target size={14} />,
      },
      IN_PROGRESS: {
        color: "bg-blue-200 text-blue-800",
        icon: <PlayCircle size={14} />,
      },
      COMPLETED: {
        color: "bg-green-200 text-green-800",
        icon: <CheckCircle size={14} />,
      },
      BLOCKED: {
        color: "bg-red-200 text-red-800",
        icon: <AlertTriangle size={14} />,
      },
      CANCELLED: {
        color: "bg-gray-200 text-gray-800",
        icon: <XCircle size={14} />,
      },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
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
                <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-emerald-600 to-emerald-800 transform hover:scale-105 transition-all duration-300">
                  <ListChecks size={90} className="text-stone-200" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-medium mb-2 tracking-tight">
                    Task Management
                  </h1>
                  <p className="text-star-dust-400 text-1xl">
                    View, filter, and manage project tasks with enhanced
                    tracking.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start mt-3 gap-2">
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-emerald-600">
                      Total: <span className="font-medium">{stats.total}</span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-yellow-600">
                      Pending:{" "}
                      <span className="font-medium">{stats.pending}</span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-blue-600">
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
                {canCreate && <AddButton url="/task/add" text="New Task" />}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Total Tasks
                  </p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <ListChecks className="h-10 w-10 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Completed
                  </p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-xl text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">
                    In Progress
                  </p>
                  <p className="text-3xl font-bold">{stats.inProgress}</p>
                </div>
                <PlayCircle className="h-10 w-10 text-yellow-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Overdue</p>
                  <p className="text-3xl font-bold">{stats.overdue}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-200" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card-main rounded-xl p-6 mb-8 shadow-md">
            <h3 className="flex items-center text-slate-300 mb-4">
              <Filter size={15} className="mr-2" /> Search & Filters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <SearchInput
                  name="searchTerm"
                  text="Search by name, description, project..."
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
                  { value: "PENDING", label: "Pending" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "BLOCKED", label: "Blocked" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
              />
              <SearchSelect
                name="project"
                value={filters.project}
                onChange={handleFilterChange}
                list={[
                  { value: "", label: "All Projects" },
                  ...allProjects.map((p) => ({ value: p.id, label: p.name })),
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
          {filteredTasks.length === 0 && !loading ? (
            <NoItems
              icon={<ListChecks />}
              title="No Tasks Found"
              description="Try adjusting your filters or create your first task."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-card-main shadow-md rounded-xl p-6 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left Section - Main Info */}
                    <div className="flex-grow space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-medium text-stone-200 flex items-center gap-2 mb-4">
                            <ListChecks
                              size={28}
                              className="text-emerald-400"
                            />
                            {task.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(task.status)}
                          </div>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-sm text-stone-400 mt-2">
                          {task.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-stone-400">
                          <Briefcase
                            size={16}
                            className="mr-2 text-emerald-400"
                          />
                          <span className="mr-2">Project:</span>
                          <span className="text-stone-300 font-medium">
                            {task.project_name || (
                              <span className="italic text-gray-500">N/A</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center text-stone-400">
                          <Users size={16} className="mr-2 text-blue-400" />
                          <span className="mr-2">Assigned To:</span>
                          <span className="text-stone-300 font-medium">
                            {task.assigned_to_name || (
                              <span className="italic text-gray-500">
                                Unassigned
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center text-stone-400">
                          <CalendarDays
                            size={16}
                            className="mr-2 text-green-400"
                          />
                          <span className="mr-2">Start:</span>
                          <span className="text-stone-300 font-medium">
                            {task.start_date
                              ? new Date(
                                  task.start_date + "T00:00:00Z",
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        {task.end_date && (
                          <div className="flex items-center text-stone-400">
                            <CalendarDays
                              size={16}
                              className="mr-2 text-red-400"
                            />
                            <span className="mr-2">Due:</span>
                            <span className="text-stone-300 font-medium">
                              {new Date(
                                task.end_date + "T00:00:00Z",
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex lg:flex-col items-center gap-2 lg:border-l lg:border-stone-700 lg:pl-6">
                      <Link
                        to={`/task/view/${task.id}`}
                        className="text-cyan-200 hover:text-black transition duration-200 p-2 hover:bg-cyan-200 rounded-full shadow-sm"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </Link>

                      {canEdit(task) && (
                        <Link
                          to={`/task/edit/${task.id}`}
                          className="text-indigo-200 hover:text-indigo-800 transition duration-200 p-2 hover:bg-indigo-100 rounded-full shadow-sm"
                          title="Edit Task"
                        >
                          <Edit3 size={20} />
                        </Link>
                      )}

                      {canEdit(task) && task.status === "PENDING" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(task.id, "IN_PROGRESS")
                          }
                          className="text-blue-200 hover:text-blue-800 transition duration-200 p-2 hover:bg-blue-100 rounded-full shadow-sm"
                          title="Start Task"
                        >
                          <PlayCircle size={20} />
                        </button>
                      )}

                      {canEdit(task) && task.status === "IN_PROGRESS" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(task.id, "COMPLETED")
                            }
                            className="text-green-200 hover:text-green-800 transition duration-200 p-2 hover:bg-green-100 rounded-full shadow-sm"
                            title="Mark Completed"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(task.id, "BLOCKED")
                            }
                            className="text-red-200 hover:text-red-800 transition duration-200 p-2 hover:bg-red-100 rounded-full shadow-sm"
                            title="Mark Blocked"
                          >
                            <AlertTriangle size={20} />
                          </button>
                        </>
                      )}

                      {canEdit(task) && task.status === "BLOCKED" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(task.id, "IN_PROGRESS")
                          }
                          className="text-blue-200 hover:text-blue-800 transition duration-200 p-2 hover:bg-blue-100 rounded-full shadow-sm"
                          title="Resume Task"
                        >
                          <PlayCircle size={20} />
                        </button>
                      )}

                      {canEdit(task) &&
                        (task.status === "PENDING" ||
                          task.status === "IN_PROGRESS" ||
                          task.status === "BLOCKED") && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(task.id, "CANCELLED")
                            }
                            className="text-orange-200 hover:text-orange-800 transition duration-200 p-2 hover:bg-orange-100 rounded-full shadow-sm"
                            title="Cancel Task"
                          >
                            <XCircle size={20} />
                          </button>
                        )}

                      {canDelete(task) &&
                        (task.status === "PENDING" ||
                          task.status === "CANCELLED") && (
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-red-200 hover:text-red-800 transition duration-200 p-2 hover:bg-red-100 rounded-full shadow-sm"
                            title="Delete Task"
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

export default Tasks;
