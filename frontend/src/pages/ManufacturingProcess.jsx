import LoadingIndicator from "../components/LoadingIndicator";
import useWebSocket from "../hooks/useWebSocket";
import useFetchData from "../hooks/useFetchData";
import useDelete from "../hooks/useDelete";
import { useAuth } from "../hooks/useAuth";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

import {
  ExportCsvButton,
  RefreshButton,
  SearchSelect,
  SearchInput,
  AddButton,
  NoItems,
} from "../components/viewComponents";

import {
  SlidersHorizontal,
  ListChecks,
  RotateCcw,
  FileText,
  Filter,
  Trash2,
  Clock,
  Edit3,
  Eye,
} from "lucide-react";

function ManufacturingProcessList() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allProcesses, setAllProcesses] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: "",
    hasParams: "all",
  });

  const fetchProcesses = useFetchData(
    "manufacturing-process",
    setLoading,
    setAllProcesses,
  );

  useWebSocket("manufacturing-processes", setAllProcesses, fetchProcesses);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProcesses();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDeleteProcess = useDelete(
    "manufacturing-process",
    setLoading,
    "manufacturing process",
    fetchProcesses,
  );

  const handleFilterChange = (e) =>
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const resetFiltersHandler = () =>
    setFilters({ searchTerm: "", hasParams: "all" });

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Description,Standard Time,Quality Params Count\n" +
      filteredProcesses
        .map(
          (p) =>
            `"${p.name}","${p.description || ""}","${p.standard_time}","${
              Object.keys(p.quality_parameters || {}).length
            }"`,
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `processes_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Memos ---
  const filteredProcesses = useMemo(() => {
    return allProcesses.filter((proc) => {
      const term = filters.searchTerm.toLowerCase();

      const matchesSearch =
        !term ||
        proc.name?.toLowerCase().includes(term) ||
        proc.description?.toLowerCase().includes(term);

      const matchesParams =
        filters.hasParams === "all" ||
        (filters.hasParams === "yes" &&
          Object.keys(proc.quality_parameters || {}).length > 0) ||
        (filters.hasParams === "no" &&
          Object.keys(proc.quality_parameters || {}).length === 0);

      return matchesSearch && matchesParams;
    });
  }, [allProcesses, filters]);

  const stats = useMemo(() => {
    return {
      total: allProcesses.length,
      withParams: allProcesses.filter(
        (p) => Object.keys(p.quality_parameters || {}).length > 0,
      ).length,
      avgDuration: "N/A",
    };
  }, [allProcesses]);

  // Helper to render JSON count/badge
  const renderQualityBadge = (params) => {
    const count = Object.keys(params || {}).length;
    if (count === 0) {
      return (
        <span className="text-slate-500 text-xs italic">None defined</span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800 inline-flex items-center gap-1">
        <SlidersHorizontal size={12} />
        {count} Parameter{count !== 1 ? "s" : ""}
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
                <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-purple-600 to-purple-800 transform hover:scale-105 transition-all duration-300">
                  <ListChecks size={90} className="text-stone-200" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-medium mb-2 tracking-tight">
                    Manufacturing Processes
                  </h1>
                  <p className="text-star-dust-400 text-1xl">
                    Define standard operating procedures and quality parameters.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start mt-3 gap-2">
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-purple-600">
                      Total Processes:{" "}
                      <span className="font-medium">{stats.total}</span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-indigo-600">
                      With Quality Checks:{" "}
                      <span className="font-medium">{stats.withParams}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 lg:mt-0">
                <RefreshButton
                  handleRefresh={handleRefresh}
                  refreshing={refreshing}
                />
                <ExportCsvButton
                  handleExport={handleExport}
                  term={filteredProcesses.length === 0}
                />
                {user?.role === "ADMIN" && (
                  <AddButton
                    url="/manufacturing-process/new"
                    text="New Process"
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
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  text="Search processes..."
                />
              </div>
              <SearchSelect
                name="hasParams"
                value={filters.hasParams}
                onChange={handleFilterChange}
                list={[
                  { value: "all", label: "All Types" },
                  { value: "yes", label: "With Parameters" },
                  { value: "no", label: "No Parameters" },
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
          {filteredProcesses.length === 0 && !loading ? (
            <NoItems
              icon={<ListChecks />}
              title="No Processes Found"
              description="Try adjusting your filters or add your first manufacturing process."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProcesses.map((proc) => (
                <div
                  key={proc.id}
                  className="bg-card-main shadow-md rounded-xl flex flex-col transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="p-5 flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <h2
                        className="text-2xl font-medium text-stone-200 truncate"
                        title={proc.name}
                      >
                        <ListChecks
                          size={28}
                          className="inline-block mr-2 text-purple-300"
                        />
                        {proc.name || "N/A"}
                      </h2>
                    </div>
                    <div className="space-y-2 text-sm text-stone-400">
                      <p className="flex items-center my-5">
                        <Clock size={15} className="mr-2 flex-shrink-0" />
                        <span className="text-stone-300 mr-4 ">
                          {proc.standard_time}
                        </span>
                        <div>{renderQualityBadge(proc.quality_parameters)}</div>
                      </p>
                      {proc.description && (
                        <p className="flex items-start mt-3 pt-3 border-t border-stone-600">
                          <FileText
                            size={15}
                            className="mr-2 mt-0.5 flex-shrink-0"
                          />
                          <span className="text-stone-400 line-clamp-2">
                            {proc.description}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto px-6 py-2 bg-card-sub rounded-b-xl">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/manufacturing-process/view/${proc.id}`}
                        className="text-purple-200 hover:text-black transition duration-200 p-2 hover:bg-purple-200 rounded-full shadow-sm"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </Link>
                      {user?.role === "ADMIN" && (
                        <>
                          <Link
                            to={`/manufacturing-process/edit/${proc.id}`}
                            className="text-indigo-200 hover:text-indigo-800 transition duration-200 p-2 hover:bg-indigo-100 rounded-full shadow-sm"
                            title="Edit Process"
                          >
                            <Edit3 size={20} />
                          </Link>
                          <button
                            onClick={() => handleDeleteProcess(proc.id)}
                            className="text-red-200 hover:text-red-800 transition duration-200 p-2 hover:bg-red-100 rounded-full shadow-sm"
                            title="Delete Process"
                          >
                            <Trash2 size={20} />
                          </button>
                        </>
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
}

export default ManufacturingProcessList;
