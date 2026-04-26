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
  CheckCircle,
  RotateCcw,
  Building2,
  Activity,
  Factory,
  XCircle,
  Trash2,
  Filter,
  Wrench,
  Edit3,
  Cog,
  Eye,
  User,
} from "lucide-react";

function Machine() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [allMachines, setAllMachines] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState({
    searchTerm: "",
    status: "all",
    workshop: "all",
  });

  const fetchMachines = useFetchData("machine", setLoading, setAllMachines);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMachines();
    setTimeout(() => setRefreshing(false), 1000);
  };

  useWebSocket("machines", setAllMachines, fetchMachines);

  const handleDeleteMachine = useDelete(
    "machine",
    setLoading,
    "machine",
    fetchMachines,
  );

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFiltersHandler = () => {
    setFilters({ searchTerm: "", status: "all", workshop: "all" });
  };

  const applyFilters = () => fetchMachines();

  // Machine statuses
  const machineStatuses = ["OPERATIONAL", "IDLE", "MAINTENANCE", "BROKEN"];

  const getStatusIcon = (status) => {
    switch (status) {
      case "OPERATIONAL":
        return <CheckCircle size={14} className="text-green-600" />;
      case "IDLE":
        return <Activity size={14} className="text-yellow-600" />;
      case "MAINTENANCE":
        return <Wrench size={14} className="text-blue-600" />;
      case "BROKEN":
        return <AlertTriangle size={14} className="text-red-600" />;
      default:
        return <XCircle size={14} className="text-gray-600" />;
    }
  };

  const getStatusPill = (status) => {
    const colors = {
      OPERATIONAL: "bg-green-100 text-green-800 border border-green-200",
      IDLE: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      MAINTENANCE: "bg-blue-100 text-blue-800 border border-blue-200",
      BROKEN: "bg-red-100 text-red-800 border border-red-200",
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${
          colors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  // Get unique workshops for filter
  const uniqueWorkshops = useMemo(() => {
    const workshops = new Set();
    allMachines.forEach((machine) => {
      if (machine.workshop_name) workshops.add(machine.workshop_name);
    });
    return Array.from(workshops).sort();
  }, [allMachines]);

  const filteredMachines = useMemo(() => {
    return allMachines.filter((machine) => {
      const matchesSearch =
        !filters.searchTerm ||
        machine.name
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        machine.workshop_name
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        machine.operator_name
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        machine.department_name
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase());

      const matchesStatus =
        filters.status === "all" || machine.status === filters.status;

      const matchesWorkshop =
        filters.workshop === "all" ||
        machine.workshop_name === filters.workshop;

      return matchesSearch && matchesStatus && matchesWorkshop;
    });
  }, [allMachines, filters]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: allMachines.length,
      operational: allMachines.filter((m) => m.status === "OPERATIONAL").length,
      maintenance: allMachines.filter((m) => m.status === "MAINTENANCE").length,
      broken: allMachines.filter((m) => m.status === "BROKEN").length,
      idle: allMachines.filter((m) => m.status === "IDLE").length,
    };
  }, [allMachines]);

  // Check permissions
  const canCreate = user?.role === "ADMIN";
  const canEdit =
    user &&
    ["ADMIN", "SUPERVISOR", "TECHNICIAN", "MANAGER"].includes(user.role);

  return (
    <>
      <div className="min-h-screen py-6">
        <div className="w-full">
          {/* Header Section */}
          <div className="rounded-2xl p-8 shadow-md mb-8 bg-card-main">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-yellow-600 to-yellow-800 transform hover:scale-105 transition-all duration-300">
                  <Cog size={90} className="text-stone-200" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-medium mb-2 tracking-tight">
                    Machine Management
                  </h1>
                  <p className="text-star-dust-400 text-1xl">
                    Monitor and manage your factory machines with advanced
                    controls.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start mt-3 gap-2">
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-orange-600">
                      Total Machines:{" "}
                      <span className="font-medium">{stats.total}</span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-green-600">
                      Operational:{" "}
                      <span className="font-medium">{stats.operational}</span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-blue-600">
                      Maintenance:{" "}
                      <span className="font-medium">{stats.maintenance}</span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-red-600">
                      Broken:{" "}
                      <span className="font-medium">{stats.broken}</span>
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
                  <AddButton url="/machine/add" text="Add New Machine" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <SearchInput
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                text="Search machines..."
                style={{ height: "40px" }}
              />
              <SearchSelect
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                style={{ height: "40px" }}
                list={[
                  { value: "all", label: "All Status" },
                  ...machineStatuses.map((s) => ({
                    value: s,
                    label: s.charAt(0) + s.slice(1).toLowerCase(),
                  })),
                ]}
              />
              <SearchSelect
                name="workshop"
                value={filters.workshop}
                onChange={handleFilterChange}
                style={{ height: "40px" }}
                list={[
                  { value: "all", label: "All Workshops" },
                  ...uniqueWorkshops.map((w) => ({ value: w, label: w })),
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

          {/* Machines Table */}
          {filteredMachines.length === 0 && !loading ? (
            <NoItems
              icon={<Cog />}
              title="No Machines Found"
              description="No machines match your current filters or there are no machines in the system."
              onClick={resetFiltersHandler}
              button="Clear Filters"
            />
          ) : (
            <div className="shadow-xl rounded-2xl bg-[#2a2a2a] overflow-hidden">
              <div className="px-4 py-4 border-b border-stone-500">
                <h3 className="text-xl font-medium flex items-center">
                  <Cog size={20} className="mr-2" />
                  Machines
                  <span className="text-slate-400 ml-4">
                    {filteredMachines.length}
                  </span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-500">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Machine Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Workshop
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Operator
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
                    {filteredMachines.map((machine) => (
                      <tr
                        key={machine.id}
                        className="hover:bg-slate-500 transition-all duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold mr-3">
                              {(machine.name || "M").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-200">
                                {machine.name || "N/A"}
                              </div>
                              <div className="text-xs text-slate-400">
                                ID: {machine.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Factory
                              size={16}
                              className="text-slate-400 mr-2"
                            />
                            <div className="text-sm text-slate-300">
                              {machine.workshop_name || (
                                <span className="italic text-gray-400">
                                  No Workshop
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2
                              size={16}
                              className="text-slate-400 mr-2"
                            />
                            <div className="text-sm text-slate-300">
                              {machine.department_name || (
                                <span className="italic text-gray-400">
                                  No Department
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User size={16} className="text-slate-400 mr-2" />
                            <div className="text-sm text-slate-300">
                              {machine.operator_name || (
                                <span className="italic text-gray-400">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusPill(machine.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/machine/view/${machine.id}`}
                              className="p-2 text-blue-400 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors duration-200"
                              title="View Machine"
                            >
                              <Eye size={18} />
                            </Link>
                            {canEdit && (
                              <Link
                                to={`/machine/edit/${machine.id}`}
                                className="p-2 text-indigo-200 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg transition-colors duration-200"
                                title="Edit Machine"
                              >
                                <Edit3 size={18} />
                              </Link>
                            )}
                            {canCreate && (
                              <button
                                onClick={() => handleDeleteMachine(machine.id)}
                                className="p-2 text-red-400 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                title="Delete Machine"
                              >
                                <Trash2 size={18} />
                              </button>
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
      </div>

      {loading && <LoadingIndicator />}
    </>
  );
}

export default Machine;
