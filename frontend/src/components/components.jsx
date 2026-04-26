import { cloneElement } from "react";
import { Save } from "lucide-react";

// !Input component for forms
export const InputItem = ({ label, name, icon, error, ...props }) => (
  <div className="flex flex-col">
    <label
      htmlFor={name}
      className="mb-2 text-sm text-stone-400 ml-1 flex items-center gap-2"
    >
      {icon && cloneElement(icon, { size: 16 })}
      {label}
    </label>
    <input
      id={name}
      name={name}
      className="bg-card-sub outline-none border-none rounded-lg p-2 text-stone-300 disabled:bg-card-accent disabled:text-stone-400"
      {...props}
    />
    {error && <small className="text-red-500 mt-1 text-xs">{error}</small>}
  </div>
);

// !Textarea component
export const TextareaItem = ({ label, name, icon, error, ...props }) => (
  <div className="flex flex-col">
    <label
      htmlFor={name}
      className="mb-2 text-sm font-medium text-stone-400 flex items-center gap-2"
    >
      {icon && cloneElement(icon, { size: 16 })}
      {label}
    </label>
    <textarea
      id={name}
      name={name}
      className="bg-card-sub rounded-lg p-2 resize-none text-stone-300 outline-none disabled:bg-card-accent disabled:text-stone-400"
      {...props}
    />
    {error && <small className="text-red-500 mt-1 text-xs">{error}</small>}
  </div>
);

// !Select component
export const SelectItem = ({
  label,
  name,
  icon,
  options,
  error,
  loading,
  ...props
}) => (
  <div className="flex flex-col">
    <label
      htmlFor={name}
      className="mb-2 text-sm font-medium text-stone-400 flex items-center gap-2"
    >
      {icon && cloneElement(icon, { size: 16 })}
      {label}
    </label>
    {loading ? (
      <div className="bg-card-sub border border-stone-600 rounded-lg p-2 text-stone-400">
        Loading...
      </div>
    ) : (
      <select
        id={name}
        name={name}
        className={`bg-card-sub rounded-lg p-2 text-stone-300 outline-none disabled:bg-card-accent disabled:text-stone-300 disabled:cursor-not-allowed appearance-none`}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )}
    {error && <small className="text-red-500 mt-1 text-xs">{error}</small>}
  </div>
);

// !Info display component for view mode
export const InfoItem = ({ icon, label, value }) => (
  <div className="bg-card-sub p-2 pl-3 rounded-lg border-l-4 border-orange-600">
    <label className="flex items-center gap-2 text-sm text-stone-400 mb-2">
      {icon && cloneElement(icon, { size: 16 })}
      {label}
    </label>
    <p className="text-base font-medium text-stone-300 truncate">
      {value === null || value === undefined || value === "" ? (
        <span className="text-stone-500">N/A</span>
      ) : (
        value
      )}
    </p>
  </div>
);

// !Buttons component for form actions
export const Buttons = ({
  onCancel,
  text_01 = "Save Changes",
  disabled = false,
}) => (
  <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-star-dust-600">
    <button
      type="button"
      onClick={onCancel}
      className="bg-gray-600 hover:bg-gray-500 text-stone-200 font-medium duration-100 py-2 px-3 rounded-lg text-sm"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={disabled}
      className="bg-orange-500 hover:bg-orange-400 text-stone-800 font-medium duration-100 py-2 px-3 rounded-lg text-sm"
    >
      {text_01} <Save className="inline ml-1" size={16} />
    </button>
  </div>
);
