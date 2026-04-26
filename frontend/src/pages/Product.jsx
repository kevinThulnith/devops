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
  ClipboardList,
  CheckCircle,
  RotateCcw,
  XCircle,
  Package,
  Activity,
  Trash2,
  Filter,
  Edit3,
  Eye,
  Tag,
} from "lucide-react";

const Product = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ searchTerm: "", status: "all" });

  const fetchProducts = useFetchData("product", setLoading, setAllProducts);

  useWebSocket("products", setAllProducts, fetchProducts);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = useDelete(
    "product",
    setLoading,
    "product",
    fetchProducts,
  );

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFiltersHandler = () => {
    setFilters({ searchTerm: "", status: "all" });
  };

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        !filters.searchTerm ||
        p.name.toLowerCase().includes(searchTermLower) ||
        p.code.toLowerCase().includes(searchTermLower);

      const matchesStatus =
        filters.status === "all" || p.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [allProducts, filters]);

  const stats = useMemo(
    () => ({
      total: allProducts.length,
      active: allProducts.filter((p) => p.status === "ACTIVE").length,
      inactive: allProducts.filter((p) => p.status === "INACTIVE").length,
      discontinued: allProducts.filter((p) => p.status === "DISCONTINUED")
        .length,
    }),
    [allProducts],
  );

  const getStatusPill = (status) => {
    const styles = {
      ACTIVE: "bg-green-200 text-green-800",
      INACTIVE: "bg-yellow-200 text-yellow-800",
      DISCONTINUED: "bg-red-200 text-red-800",
    };
    return (
      <span
        className={`absolute top-4 right-4 px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${
          styles[status] || "bg-stone-700 text-stone-300 border-stone-600"
        }`}
      >
        {status === "ACTIVE" && <CheckCircle size={12} />}
        {status === "INACTIVE" && <Activity size={12} />}
        {status === "DISCONTINUED" && <XCircle size={12} />}
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen py-6">
      <div className="w-full">
        {/* Header Section */}
        <div className="rounded-2xl p-8 shadow-md mb-8 bg-card-main">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-amber-600 to-amber-800 transform hover:scale-105 transition-all duration-300">
                <Package size={90} className="text-stone-200" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-medium mb-2 tracking-tight">
                  Product Catalog
                </h1>
                <p className="text-star-dust-400 text-1xl">
                  Manage and organize your company's products.
                </p>
                <div className="flex items-center flex-wrap justify-center sm:justify-start mt-3 gap-2">
                  <span className="text-sm px-3 py-1 rounded-2xl bg-orange-600">
                    Total: <span className="font-medium">{stats.total}</span>
                  </span>
                  <span className="text-sm px-3 py-1 rounded-2xl bg-green-600">
                    Active: <span className="font-medium">{stats.active}</span>
                  </span>
                  <span className="text-sm px-3 py-1 rounded-2xl bg-yellow-600">
                    Inactive:{" "}
                    <span className="font-medium">{stats.inactive}</span>
                  </span>
                  <span className="text-sm px-3 py-1 rounded-2xl bg-red-600">
                    Discontinued:{" "}
                    <span className="font-medium">{stats.discontinued}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 lg:mt-0">
              <RefreshButton
                handleRefresh={handleRefresh}
                refreshing={refreshing}
              />
              {user?.role === "ADMIN" && (
                <AddButton url="/product/add" text="Add Product" />
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card-main rounded-xl p-6 mb-8 shadow-md">
          <h3 className="flex items-center text-slate-300 mb-4">
            <Filter size={15} className="mr-2" /> Search & Filter
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <SearchInput
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                text="Search by name or code..."
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
                { value: "DISCONTINUED", label: "Discontinued" },
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
        {filteredProducts.length === 0 && !loading ? (
          <NoItems
            icon={<Package />}
            title="No Products Found"
            description="Try adjusting your filters or add your first product."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="relative bg-card-main shadow-md rounded-xl flex flex-col transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-5 flex-grow">
                  {getStatusPill(product.status)}
                  <h2
                    className="text-lg font-bold text-orange-200 truncate mt-8 mb-2 flex gap-2 items-center"
                    title={product.name}
                  >
                    <Package size={25} />
                    {product.name}
                  </h2>
                  <div className="space-y-2 text-sm text-stone-400">
                    <p className="flex items-center">
                      <Tag size={15} className="mr-2 flex-shrink-0" /> Code:{" "}
                      <span className="font-medium text-stone-300 ml-1">
                        {product.code}
                      </span>
                    </p>
                    <p className="flex items-center">
                      <ClipboardList size={15} className="mr-2 flex-shrink-0" />{" "}
                      Unit:{" "}
                      <span className="font-medium text-stone-300 ml-1">
                        {product.unit_of_measurement || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="bg-card-accent px-6 py-2 border-t border-stone-700/50 mt-auto rounded-b-xl">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      to={`/product/view/${product.id}`}
                      className="text-purple-200 hover:text-black transition duration-200 p-2 hover:bg-purple-200 rounded-full shadow-sm"
                      title="View Details"
                    >
                      <Eye size={20} />
                    </Link>
                    {user?.role === "ADMIN" && (
                      <>
                        <Link
                          to={`/product/edit/${product.id}`}
                          className="text-indigo-200 hover:text-indigo-800 transition duration-200 p-2 hover:bg-indigo-100 rounded-full shadow-sm"
                          title="Edit Product"
                        >
                          <Edit3 size={20} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-200 hover:text-red-800 transition duration-200 p-2 hover:bg-red-100 rounded-full shadow-sm"
                          title="Delete Product"
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

export default Product;
