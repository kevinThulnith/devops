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
  UserCircle,
  RotateCcw,
  UserRound,
  MapPin,
  Filter,
  Trash2,
  Edit3,
  Truck,
  Phone,
  Mail,
  Eye,
} from "lucide-react";

const Supplier = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: "",
    sortBy: "name-asc",
  });

  const fetchSuppliers = useFetchData("supplier", setLoading, setAllSuppliers);

  useWebSocket("suppliers", setAllSuppliers, fetchSuppliers);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = useDelete(
    "supplier",
    setLoading,
    "supplier",
    fetchSuppliers,
  );

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFiltersHandler = () => {
    setFilters({ searchTerm: "", sortBy: "name-asc" });
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Supplier Name,Contact Person,Email,Phone,Address,Website\n" +
      filteredAndSortedSuppliers
        .map(
          (s) =>
            `"${s.name}","${s.contact_person || ""}","${s.email || ""}","${
              s.phone || ""
            }","${s.address || ""}","${s.website || ""}"`,
        )
        .join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `suppliers_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const filteredAndSortedSuppliers = useMemo(() => {
    const filtered = allSuppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (s.contact_person &&
          s.contact_person
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase())) ||
        (s.email &&
          s.email.toLowerCase().includes(filters.searchTerm.toLowerCase())),
    );

    const [field, direction] = filters.sortBy.split("-");
    return [...filtered].sort((a, b) => {
      const aVal = a[field] || "";
      const bVal = b[field] || "";
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [allSuppliers, filters]);

  const stats = useMemo(() => ({ total: allSuppliers.length }), [allSuppliers]);
  const canManage = user?.role === "ADMIN";

  return (
    <div className="min-h-screen py-6">
      <div className="w-full text-star-dust-200">
        {/* Header Section */}
        <div className="rounded-2xl p-8 shadow-md mb-8 bg-card-main">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-lime-600 to-lime-800 transform hover:scale-105 transition-all duration-300">
                <Truck size={90} className="text-stone-200" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-medium mb-2 tracking-tight">
                  Supplier Management
                </h1>
                <p className="text-star-dust-400 text-1xl">
                  Manage and monitor your vendor relationships and supply chain.
                </p>
                <div className="flex items-center justify-center sm:justify-start mt-3">
                  <span className="text-sm text-gray-200 px-3 py-1 rounded-2xl bg-orange-600">
                    Total Suppliers:{" "}
                    <span className="font-medium">{stats.total}</span>
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
                term={filteredAndSortedSuppliers.length === 0}
              />
              {canManage && (
                <AddButton url="/supplier/add" text="Add Supplier" />
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card-main rounded-xl p-6 mb-8 shadow-md">
          <h3 className="flex items-center text-slate-300 mb-4">
            <Filter size={15} className="mr-2" /> Search & Sort
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <SearchInput
                name="searchTerm"
                text="Search suppliers..."
                value={filters.searchTerm}
                onChange={handleFilterChange}
              />
            </div>
            <SearchSelect
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              list={[
                { value: "name-asc", label: "Sort by Name (A-Z)" },
                { value: "name-desc", label: "Sort by Name (Z-A)" },
                { value: "contact_person-asc", label: "Sort by Contact (A-Z)" },
                {
                  value: "contact_person-desc",
                  label: "Sort by Contact (Z-A)",
                },
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
        {filteredAndSortedSuppliers.length === 0 && !loading ? (
          <NoItems
            icon={<Truck />}
            title="No Suppliers Found"
            description="Try adjusting your filters or add your first supplier."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-card-main shadow-md rounded-xl flex flex-col transition-all duration-300  hover:-translate-y-1"
              >
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2
                      className="text-lg font-bold text-stone-200 truncate mb-2"
                      title={supplier.name}
                    >
                      <UserRound
                        size={24}
                        className="inline-block mr-2 text-purple-300"
                      />
                      {supplier.name}
                    </h2>
                  </div>
                  {supplier.contact_person && (
                    <p className="flex items-center text-sm text-stone-300 mb-3">
                      <UserCircle size={16} className="mr-2 text-stone-400" />
                      {supplier.contact_person}
                    </p>
                  )}
                  <div className="space-y-2 text-sm text-stone-400">
                    {supplier.email && (
                      <p className="flex items-center">
                        <Mail size={15} className="mr-2 flex-shrink-0" />
                        <a
                          href={`mailto:${supplier.email}`}
                          className="truncate hover:text-orange-400"
                        >
                          {supplier.email}
                        </a>
                      </p>
                    )}
                    {supplier.phone && (
                      <p className="flex items-center">
                        <Phone size={15} className="mr-2 flex-shrink-0" />
                        <a
                          href={`tel:${supplier.phone}`}
                          className="truncate hover:text-orange-400"
                        >
                          {supplier.phone}
                        </a>
                      </p>
                    )}
                    {supplier.address && (
                      <p className="flex items-start">
                        <MapPin
                          size={15}
                          className="mr-2 mt-0.5 flex-shrink-0"
                        />
                        <span>{supplier.address}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-auto px-6 py-2 bg-card-sub rounded-b-xl">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      to={`/supplier/view/${supplier.id}`}
                      className="text-purple-200 hover:text-black transition duration-200 p-2 hover:bg-purple-200 rounded-full shadow-sm"
                      title="View Details"
                    >
                      <Eye size={20} />
                    </Link>
                    {canManage && (
                      <>
                        <Link
                          to={`/supplier/edit/${supplier.id}`}
                          className="text-indigo-200 hover:text-indigo-800 transition duration-200 p-2 hover:bg-indigo-100 rounded-full shadow-sm"
                          title="Edit Supplier"
                        >
                          <Edit3 size={20} />
                        </Link>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-200 hover:text-red-800 transition duration-200 p-2 hover:bg-red-100 rounded-full shadow-sm"
                          title="Delete Supplier"
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
      {loading && !refreshing && <LoadingIndicator />}
    </div>
  );
};

export default Supplier;
