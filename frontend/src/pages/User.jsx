import { useEffect, useState, useMemo, useCallback } from "react";
import LoadingIndicator from "../components/LoadingIndicator";
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
  ShieldCheck,
  UsersRound,
  UserCheck,
  RotateCcw,
  Activity,
  Package,
  Filter,
  Trash2,
  Edit3,
  UserX,
  Crown,
  Eye,
  Cog,
} from "lucide-react";

function User() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState({
    isActive: "all",
    searchTerm: "",
    role: "all",
  });

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api
      .get("api/user/")
      .then((res) => setAllUsers(res.data))
      .catch((error) =>
        alert("Failed to fetch users. Please try again.", error),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
    setTimeout(() => setRefreshing(false), 1000); // Simulate a short delay for better UX
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      api
        .delete(`api/user/${userId}/`)
        .then(() => {
          setAllUsers((prevUsers) =>
            prevUsers.filter((user) => user.id !== userId),
          );
          alert(`User "${userName}" has been deleted.`);
        })
        .catch((error) =>
          alert("Failed to delete user. Please try again.", error),
        );
    }
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyFilters = () => fetchUsers();

  const resetFiltersHandler = () => {
    setFilters({ searchTerm: "", role: "all", isActive: "all" });
  };

  const userRoles = [
    "ADMIN",
    "MANAGER",
    "OPERATOR",
    "SUPERVISOR",
    "TECHNICIAN",
    "PURCHASING",
  ];

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMIN":
        return <Crown size={14} className="text-purple-600" />;
      case "MANAGER":
        return <ShieldCheck size={14} className="text-blue-600" />;
      case "SUPERVISOR":
        return <Eye size={14} className="text-green-600" />;
      case "OPERATOR":
        return <Cog size={14} className="text-orange-600" />;
      case "TECHNICIAN":
        return <Activity size={14} className="text-red-600" />;
      case "PURCHASING":
        return <Package size={14} className="text-indigo-600" />;
      default:
        return <UserCheck size={14} className="text-gray-600" />;
    }
  };

  const getRolePill = (role) => {
    const colors = {
      ADMIN: "bg-purple-100 text-purple-800 border border-purple-200",
      MANAGER: "bg-blue-100 text-blue-800 border border-blue-200",
      SUPERVISOR: "bg-green-100 text-green-800 border border-green-200",
      OPERATOR: "bg-orange-100 text-orange-800 border border-orange-200",
      TECHNICIAN: "bg-red-100 text-red-800 border border-red-200",
      PURCHASING: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${
          colors[role] || "bg-gray-100 text-gray-800"
        }`}
      >
        {getRoleIcon(role)}
        {role}
      </span>
    );
  };

  const getActivePill = (isActive) => (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${
        isActive
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200"
      }`}
    >
      {isActive ? <UserCheck size={12} /> : <UserX size={12} />}
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const matchesSearch =
        !filters.searchTerm ||
        user.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        user.username
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesRole = filters.role === "all" || user.role === filters.role;
      const matchesActive =
        filters.isActive === "all" ||
        (filters.isActive === "true" ? user.is_active : !user.is_active);
      return matchesSearch && matchesRole && matchesActive;
    });
  }, [allUsers, filters]);

  return (
    <>
      <div className="min-h-screen py-6">
        <div className="w-full">
          {/* Header Section with Modern Design */}
          <div className="rounded-2xl p-8 shadow-md mb-8 bg-card-main">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-blue-600 to-blue-800 transform hover:scale-105 transition-all duration-300">
                  <UsersRound size={90} className="text-stone-200" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-medium mb-2 tracking-tight">
                    User Management
                  </h1>
                  <p className="text-star-dust-400 text-1xl">
                    Manage system users, roles, and permissions with advanced
                    controls.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start mt-3 gap-2">
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-orange-600">
                      Total Users:{" "}
                      <span className="font-medium">{allUsers.length}</span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-orange-600">
                      Active:{" "}
                      <span className="font-medium">
                        {allUsers.filter((u) => u.is_active).length}
                      </span>
                    </span>
                    <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-orange-600">
                      Filtered:{" "}
                      <span className="font-medium">
                        {filteredUsers.length}
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
                <AddButton url="/register" text="Add New User" />
              </div>
            </div>
          </div>

          {/* Advanced Filters with Modern Design */}
          <div className="bg-card-main rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-center mb-4 text-slate-300">
              <Filter size={15} className="mx-2" />
              <h3>Search & Filters</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <SearchInput
                name="searchTerm"
                text="Search users..."
                value={filters.searchTerm}
                onChange={handleFilterChange}
                style={{ height: "40px" }}
              />
              <SearchSelect
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                style={{ height: "40px" }}
                list={[
                  { value: "all", label: "All Roles" },
                  ...userRoles.map((r) => ({
                    value: r,
                    label: r.charAt(0) + r.slice(1).toLowerCase(),
                  })),
                ]}
              />
              <SearchSelect
                name="isActive"
                value={filters.isActive}
                onChange={handleFilterChange}
                style={{ height: "40px" }}
                list={[
                  { value: "all", label: "All Status" },
                  { value: "true", label: "Active Users" },
                  { value: "false", label: "Inactive Users" },
                ]}
              />
              <button
                onClick={resetFiltersHandler}
                className=" flex-1 px-4 py-3 duration-200 font-medium bg-blue-600 rounded-lg hover:scale-105"
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

          {/* Users Table with Modern Design */}
          {filteredUsers.length === 0 && !loading ? (
            <NoItems
              icon={<UsersRound />}
              title="No Users Found"
              description="No users match your current filters or there are no users in the system."
              onClick={resetFiltersHandler}
              button="Clear Filters"
            />
          ) : (
            <div className="shadow-lg rounded-2xl bg-card-main overflow-hidden">
              <div className="px-4 py-4 border-b border-stone-500">
                <h3 className="text-xl font-medium flex items-center">
                  <UsersRound size={20} className="mr-2" />
                  Users
                  <span className="text-slate-400 ml-4">
                    {filteredUsers.length}
                  </span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-500">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Department
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
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-500 transition-all duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold mr-3">
                              {(u.name || u.username || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>{u.name || "N/A"}</div>
                          </div>
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap">
                          <div className="text-sm font-mono text-slate-300">
                            @{u.username}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-300">
                            {u.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRolePill(u.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {u.department_name || (
                              <span className="italic text-gray-400">
                                No Department
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getActivePill(u.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/user/edit/${u.id}`}
                              className="p-2 text-indigo-200 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg transition-colors duration-200"
                              title="Edit User"
                            >
                              <Edit3 size={18} />
                            </Link>
                            {u.id !== user.id && u.role !== "ADMIN" && (
                              <button
                                onClick={() =>
                                  handleDeleteUser(u.id, u.username)
                                }
                                className="p-2 text-red-400 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                title="Delete User"
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

export default User;
