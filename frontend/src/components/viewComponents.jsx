import { Search, RefreshCw, PlusCircle, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { cloneElement } from "react";

export const RefreshButton = ({ handleRefresh, refreshing }) => (
  <button
    onClick={handleRefresh}
    disabled={refreshing}
    className="px-3 py-2 rounded-md font-medium transition-all duration-200 inline-flex items-center shadow-lg hover:shadow-xl text-[14px] bg-yellow-500 hover:scale-105 text-stone-700"
  >
    <RefreshCw
      size={18}
      className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
    />
    {refreshing ? "Refreshing..." : "Refresh"}
  </button>
);

export const ExportCsvButton = ({ handleExport, term }) => (
  <button
    onClick={handleExport}
    disabled={term}
    className="px-3 py-2 text-[14px] rounded-md font-medium transition-all duration-200 inline-flex items-center shadow-lg hover:shadow-xl disabled:opacity-50 hover:scale-105 bg-blue-700 text-stone-200"
  >
    <Download size={18} className="mr-2" />
    Export CSV
  </button>
);

export const AddButton = ({ url, text }) => (
  <Link
    to={url}
    className="px-3 py-2 text-[14px] rounded-md font-medium transition-all duration-200 inline-flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 bg-green-600 text-stone-200"
  >
    <PlusCircle size={20} className="mr-2" />
    {text}
  </Link>
);

export const SearchInput = ({ value, onChange, text, ...props }) => (
  <div className="relative">
    <Search size={18} className="absolute left-3 top-3 text-gray-400" />
    <input
      type="text"
      placeholder={text}
      value={value}
      onChange={onChange}
      className="w-full pl-10 pr-4 py-2 border-none outline-none rounded-lg bg-card-sub h-[40px]"
      {...props}
    />
  </div>
);

export const SearchSelect = ({ value, onChange, list, ...props }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full px-4 text-slate-400 border-none outline-none rounded-lg bg-card-sub appearance-none h-[40px]"
    {...props}
  >
    {list.map((li) => (
      <option key={li.value} value={li.value}>
        {li.label}
      </option>
    ))}
  </select>
);

export const NoItems = ({
  icon,
  title,
  button,
  onClick,
  description,
  state = true,
}) => (
  <div className="bg-card-main rounded-xl p-12 text-center shadow-lg">
    <span className="mx-auto text-gray-400 mb-4 flex items-center justify-center">
      {icon && cloneElement(icon, { size: 64 })}
    </span>
    <h3 className="text-xl font-semibold text-stone-300 mb-2">{title}</h3>
    <p className="text-gray-500">{description}</p>
    {onClick && state && (
      <button
        onClick={onClick}
        className="mt-4 px-6 py-2 bg-gray-400 text-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
      >
        {button}
      </button>
    )}
  </div>
);
