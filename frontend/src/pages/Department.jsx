import LoadingIndicator from "../components/LoadingIndicator";
import { useState, useMemo, useCallback } from "react";
import useWebSocket from "../hooks/useWebSocket";
import useFetchData from "../hooks/useFetchData";
import useDelete from "../hooks/useDelete";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";

import {
  ExportCsvButton,
  RefreshButton,
  SearchSelect,
  SearchInput,
  AddButton,
  NoItems,
} from "../components/viewComponents";

import {
  ChevronRight,
  PlusCircle,
  Building2,
  UserCheck,
  Calendar,
  Trash2,
  MapPin,
  Filter,
  Edit3,
  UserX,
  User,
  Eye,
} from "lucide-react";

function Department() {
  const [sortDirection, setSortDirection] = useState("asc");
  const [allDepartments, setAllDepartments] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchDepartments = useFetchData(
    "department",
    setLoading,
    setAllDepartments,
  );

  useWebSocket("departments", setAllDepartments, fetchDepartments);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDepartments();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = useDelete(
    "department",
    setLoading,
    "department",
    fetchDepartments,
  );

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }, []);

  const departmentsWithSupervisors = useMemo(() => {
    return allDepartments.filter((dept) => {
      return dept.supervisor_name !== null;
    });
  }, [allDepartments]);

  const filteredDepartments = useMemo(() => {
    let filtered = departmentsWithSupervisors;

    if (searchTerm) {
      filtered = filtered.filter(
        (department) =>
          department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (department.description &&
            department.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (department.location &&
            department.location
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (department.supervisor_name &&
            department.supervisor_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())),
      );
    }

    if (filterBy === "with-supervisor") {
      filtered = filtered.filter(
        (dept) => dept.supervisor_name && dept.supervisor_name.trim() !== "",
      );
    } else if (filterBy === "without-supervisor") {
      filtered = filtered.filter(
        (dept) => !dept.supervisor_name || dept.supervisor_name.trim() === "",
      );
    }
    return filtered;
  }, [departmentsWithSupervisors, searchTerm, filterBy]);

  const filteredAndSortedDepartments = useMemo(() => {
    const sorted = [...filteredDepartments].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "updated_at") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === "string" && aValue && bValue) {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (aValue === null || aValue === undefined)
        return sortDirection === "asc" ? -1 : 1;
      else if (bValue === null || bValue === undefined)
        return sortDirection === "asc" ? 1 : -1;

      if (sortDirection === "asc")
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      else return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    });

    return sorted;
  }, [filteredDepartments, sortField, sortDirection]);

  const totalPages = Math.ceil(
    filteredAndSortedDepartments.length / itemsPerPage,
  );

  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedDepartments.slice(
      startIndex,
      startIndex + itemsPerPage,
    );
  }, [filteredAndSortedDepartments, currentPage, itemsPerPage]);

  const handlePageChange = (page) => setCurrentPage(page);

  const stats = useMemo(() => {
    const totalDepartments = departmentsWithSupervisors.length;
    const withSupervisors = departmentsWithSupervisors.filter(
      (dept) => dept.supervisor_name && dept.supervisor_name.trim() !== "",
    ).length;
    const withoutSupervisors = totalDepartments - withSupervisors;
    const withLocations = departmentsWithSupervisors.filter(
      (dept) => dept.location && dept.location.trim() !== "",
    ).length;

    return {
      totalDepartments,
      withSupervisors,
      withoutSupervisors,
      withLocations,
    };
  }, [departmentsWithSupervisors]);

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Department Name,Description,Location,Supervisor,Last Updated\n" +
      filteredAndSortedDepartments
        .map(
          (dept) =>
            `"${dept.name}","${dept.description || "N/A"}","${
              dept.location || "N/A"
            }","${dept.supervisor_name || "Unassigned"}","${new Date(
              dept.updated_at,
            ).toLocaleDateString()}"`,
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `departments_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="min-h-screen py-6">
        <div className="w-full">
          {/* Header Section */}
          <div className="mb-8 bg-card-main p-6 rounded-lg shadow-md text-star-dust-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="p-3  rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-red-600 to-red-800">
                  <Building2 size={90} className="text-stone-200" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-medium mb-3 tracking-tight">
                    Department Management
                  </h1>
                  <p className="text-star-dust-500 text-1xl">
                    Organize and manage your company departments with
                    comprehensive tracking.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start mt-3 gap-2">
                    <span className="text-sm text-stone-200 px-3 py-1 rounded-2xl bg-orange-600">
                      Total Departments:{" "}
                      <span className="font-medium">
                        {stats.totalDepartments}
                      </span>
                    </span>
                    <span className="text-sm text-stone-200 px-3 py-1 rounded-2xl bg-orange-600">
                      With Supervisors:{" "}
                      <span className="font-medium">
                        {stats.withSupervisors}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                <RefreshButton
                  handleRefresh={handleRefresh}
                  refreshing={refreshing}
                />
                <ExportCsvButton
                  handleExport={handleExport}
                  term={searchTerm}
                />

                {user?.role === "ADMIN" && (
                  <AddButton url="/department/add" text="Add Department" />
                )}
              </div>
            </div>
          </div>

          {/* Advanced Filters and Search */}
          <div className="bg-card-main  rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-center mb-4">
              <Filter size={15} className="mx-2" />
              <h3>Search & Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                text="Search departments..."
              />
              <SearchSelect
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                list={[
                  { value: "all", label: "All Departments" },
                  { value: "with-supervisor", label: "With Supervisors" },
                  { value: "without-supervisor", label: "Need Supervisors" },
                ]}
              />
              <SearchSelect
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split("-");
                  setSortField(field);
                  setSortDirection(direction);
                }}
                list={[
                  { value: "name-asc", label: "Name (A-Z)" },
                  { value: "name-desc", label: "Name (Z-A)" },
                  { value: "location-asc", label: "Location (A-Z)" },
                  { value: "location-desc", label: "Location (Z-A)" },
                  { value: "supervisor_name-asc", label: "Supervisor (A-Z)" },
                  { value: "supervisor_name-desc", label: "Supervisor (Z-A)" },
                  { value: "updated_at-desc", label: "Recently Updated" },
                  { value: "updated_at-asc", label: "Oldest Updated" },
                ]}
              />
              <SearchSelect
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                list={[
                  { value: 10, label: "Show 10" },
                  { value: 25, label: "Show 25" },
                  { value: 50, label: "Show 50" },
                  { value: 100, label: "Show 100" },
                ]}
              />
            </div>
          </div>

          {/* Cards Display */}
          {filteredAndSortedDepartments.length === 0 && !loading.page ? (
            <NoItems
              icon={<Building2 />}
              title="No Departments Found"
              description={
                searchTerm || filterBy !== "all"
                  ? "Try adjusting your search criteria or filters."
                  : "Get started by adding your first department."
              }
              onClick={() => navigate("/department/add")}
              button="Add First Department"
              state={user?.role === "ADMIN"}
            />
          ) : (
            <>
              {/* Count display before the grid */}
              <div className="mb-6 px-1 flex items-center justify-between text-star-dust-200">
                <h3 className="font-medium">
                  Departments : {filteredAndSortedDepartments.length}
                </h3>
                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>
              </div>

              {/* Enhanced Department Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className="bg-card-main rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:scale-105"
                  >
                    <div className="p-5 flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h2
                          className="text-xl font-medium text-stone-300 flex items-center truncate"
                          title={dept.name}
                        >
                          <Building2
                            size={24}
                            className="mr-3 text-purple-500 flex-shrink-0"
                          />
                          <span className="truncate">{dept.name}</span>
                        </h2>
                        {dept.supervisor_name ? (
                          <span className="flex-shrink-0 ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-800 shadow-sm">
                            <UserCheck size={12} className="mr-1" /> Supervised
                          </span>
                        ) : (
                          <span className="flex-shrink-0 ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 shadow-sm">
                            <UserX size={12} className="mr-1" /> Needs
                            Supervisor
                          </span>
                        )}
                      </div>

                      <p
                        className="text-sm text-gray-400 mb-4 h-10 overflow-hidden line-clamp-2"
                        title={dept.description}
                      >
                        {dept.description || (
                          <span className="italic text-gray-400">
                            No description provided.
                          </span>
                        )}
                      </p>

                      <div className="space-y-3 text-sm mb-4">
                        <div className="flex items-center text-white">
                          <MapPin
                            size={16}
                            className="mr-3 text-gray-400 flex-shrink-0"
                          />
                          <span
                            className="truncate"
                            title={dept.location || "Not specified"}
                          >
                            {dept.location || "Not specified"}
                          </span>
                        </div>
                        <div className="flex items-center text-white">
                          <User
                            size={16}
                            className="mr-3 text-gray-400 flex-shrink-0"
                          />
                          <span
                            className="truncate"
                            title={dept.supervisor_name || "Unassigned"}
                          >
                            {dept.supervisor_name || "Unassigned"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto px-6 py-2 bg-card-sub">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-400 text-[14px] flex items-center">
                          <Calendar size={15} className="mr-2" />
                          Updated:{" "}
                          {new Date(dept.updated_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/department/view/${dept.id}`}
                            className="text-purple-200 hover:text-black transition duration-200 p-2 hover:bg-purple-200 rounded-full shadow-sm"
                            title="View Department Details"
                          >
                            <Eye size={20} />
                          </Link>
                          {user && user.role === "ADMIN" && (
                            <>
                              <Link
                                to={`/department/edit/${dept.id}`}
                                className="text-indigo-200 hover:text-indigo-800 transition duration-200 p-2 hover:bg-indigo-100 rounded-full shadow-sm"
                                title="Edit Department"
                              >
                                <Edit3 size={20} />
                              </Link>
                              <button
                                onClick={() => handleDelete(dept.id)}
                                className="text-red-200 hover:text-red-800 transition duration-200 p-2 hover:bg-red-100 rounded-full shadow-sm"
                                title="Delete Department"
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

              {/* Modern Pagination */}
              {totalPages > 1 && (
                <div className="bg-card-main border border-stone-700 rounded-xl shadow-lg backdrop-blur-sm">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() =>
                            handlePageChange(Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 bg-card-accent text-sm font-medium rounded-md disabled:opacity-50 transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            handlePageChange(
                              Math.min(totalPages, currentPage + 1),
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 bg-card-accent text-sm font-medium rounded-md disabled:opacity-50 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">
                            Showing{" "}
                            <span className="font-medium">
                              {(currentPage - 1) * itemsPerPage + 1}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium">
                              {Math.min(
                                currentPage * itemsPerPage,
                                filteredAndSortedDepartments.length,
                              )}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium">
                              {filteredAndSortedDepartments.length}
                            </span>{" "}
                            results
                          </p>
                        </div>
                        <div>
                          <nav
                            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                            aria-label="Pagination"
                          >
                            <button
                              onClick={() =>
                                handlePageChange(Math.max(1, currentPage - 1))
                              }
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md bg-card-accent text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            {Array.from(
                              { length: totalPages },
                              (_, i) => i + 1,
                            ).map((page) => {
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 2 &&
                                  page <= currentPage + 2)
                              ) {
                                return (
                                  <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                                      page === currentPage
                                        ? "bg-purple-600 z-10 text-white"
                                        : "bg-card-accent"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                );
                              } else if (
                                page === currentPage - 3 ||
                                page === currentPage + 3
                              ) {
                                return (
                                  <span
                                    key={page}
                                    className="relative inline-flex items-center px-4 py-2 border border-stone-700 bg-card-accent text-sm font-medium text-gray-400"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            })}
                            <button
                              onClick={() =>
                                handlePageChange(
                                  Math.min(totalPages, currentPage + 1),
                                )
                              }
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md bg-card-accent text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {loading && <LoadingIndicator />}
    </>
  );
}

export default Department;
