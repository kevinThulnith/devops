import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Form from "../components/Form";
import api from "../api";

import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  createElement,
} from "react";

import {
  Buttons,
  InfoItem,
  InputItem,
  SelectItem,
} from "../components/components";

import {
  Users,
  Info,
  Clock,
  Factory,
  Briefcase,
  ListChecks,
  UserCircle,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";

const LaborAllocationForm = () => {
  const { allocationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isViewMode = location.pathname.includes("/view/");
  const isCreateMode = location.pathname.includes("/add");

  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [allProjects, setAllProjects] = useState([]);
  const [allocation, setAllocation] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [allProductionLines, setAllProductionLines] = useState([]);

  const [formData, setFormData] = useState({
    task: "",
    project: "",
    employee: "",
    production_line: "",
    hours_allocated: "1.00",
    allocation_type: "project",
    date: new Date().toISOString().split("T")[0],
  });

  const canManage =
    user && ["ADMIN", "SUPERVISOR", "MANAGER"].includes(user.role);

  // Fetch dropdown data
  const fetchDropdownData = useCallback(async () => {
    try {
      const [employeesRes, projectsRes, linesRes] = await Promise.all([
        api.get("api/user/", {
          params: { role: "OPERATOR,TECHNICIAN,SUPERVISOR,MANAGER" },
        }),
        api.get("api/project/"),
        api.get("api/production-line/"),
      ]);

      setAllEmployees(employeesRes.data.results || employeesRes.data);
      setAllProjects(projectsRes.data.results || projectsRes.data);
      setAllProductionLines(linesRes.data.results || linesRes.data);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      setPageError("Could not load required data.");
    }
  }, []);

  // Fetch tasks for selected project
  const fetchTasksForProject = useCallback(async (projectId) => {
    if (!projectId) {
      setAllTasks([]);
      return;
    }
    try {
      const tasksRes = await api.get("api/task/", {
        params: { project: projectId },
      });
      setAllTasks(tasksRes.data.results || tasksRes.data);
    } catch (err) {
      console.error(`Error fetching tasks for project ${projectId}:`, err);
      setAllTasks([]);
    }
  }, []);

  // Fetch allocation details if editing or viewing
  const fetchAllocationData = useCallback(() => {
    if (!allocationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get(`api/allocation/${allocationId}/`)
      .then((response) => {
        const allocData = response.data;
        setAllocation(allocData);

        // Determine allocation type
        const allocationType = allocData.task
          ? "task"
          : allocData.production_line
            ? "production_line"
            : "project";

        setFormData({
          employee: allocData.employee || "",
          allocation_type: allocationType,
          project: allocData.project || "",
          task: allocData.task || "",
          production_line: allocData.production_line || "",
          hours_allocated: parseFloat(allocData.hours_allocated || 1).toFixed(
            2,
          ),
          date: allocData.date || new Date().toISOString().split("T")[0],
        });

        // Fetch tasks if needed
        if (allocationType === "task" && allocData.project) {
          fetchTasksForProject(allocData.project);
        }
      })
      .catch((error) => {
        console.error("Error fetching allocation:", error);
        setPageError("Failed to load allocation details.");
      })
      .finally(() => setLoading(false));
  }, [allocationId, fetchTasksForProject]);

  useEffect(() => {
    setLoading(true);
    fetchDropdownData().finally(() => {
      if (!allocationId) setLoading(false);
    });
  }, [allocationId, fetchDropdownData]);

  useEffect(() => {
    fetchAllocationData();
  }, [fetchAllocationData]);

  // Fetch tasks when project changes for task allocation
  useEffect(() => {
    if (formData.allocation_type === "task" && formData.project) {
      fetchTasksForProject(formData.project);
    } else setAllTasks([]);
  }, [formData.project, formData.allocation_type, fetchTasksForProject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };

      // Reset target fields when allocation type changes
      if (name === "allocation_type") {
        if (value === "project") {
          newState.task = "";
          newState.production_line = "";
        } else if (value === "task") {
          newState.production_line = "";
        } else if (value === "production_line") {
          newState.project = "";
          newState.task = "";
        }
      }

      // Reset task when project changes
      if (name === "project" && newState.allocation_type === "task") {
        newState.task = "";
      }

      return newState;
    });
  };

  const handleDecimalChange = (e) => {
    const { name, value } = e.target;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManage) {
      setPageError("You do not have permission to save this allocation.");
      return;
    }

    // Validation
    if (!formData.employee) {
      setPageError("Employee is required.");
      return;
    }
    if (!formData.date) {
      setPageError("Date is required.");
      return;
    }

    // Validate based on allocation type
    if (formData.allocation_type === "project" && !formData.project) {
      setPageError("Project is required for this allocation type.");
      return;
    }
    if (formData.allocation_type === "task") {
      if (!formData.project) {
        setPageError("Project is required to select a task.");
        return;
      }
      if (!formData.task) {
        setPageError("Task is required for this allocation type.");
        return;
      }
    }
    if (
      formData.allocation_type === "production_line" &&
      !formData.production_line
    ) {
      setPageError("Production Line is required for this allocation type.");
      return;
    }

    setLoading(true);
    setPageError("");

    try {
      const payload = {
        employee: parseInt(formData.employee),
        hours_allocated: parseFloat(formData.hours_allocated).toFixed(2),
        date: formData.date,
      };

      // Add target fields based on allocation type
      if (
        formData.allocation_type === "project" ||
        formData.allocation_type === "task"
      ) {
        if (formData.project) {
          payload.project = parseInt(formData.project);
        }
      }

      if (formData.allocation_type === "task" && formData.task) {
        payload.task = parseInt(formData.task);
      }

      if (
        formData.allocation_type === "production_line" &&
        formData.production_line
      ) {
        payload.production_line = parseInt(formData.production_line);
      }

      if (allocationId && !isCreateMode) {
        await api.patch(`api/allocation/${allocationId}/`, payload);
        alert("Labor Allocation updated successfully!");
      } else {
        await api.post("api/allocation/", payload);
        alert("Labor Allocation created successfully!");
      }

      navigate("/labor-allocation");
    } catch (error) {
      console.error("Error saving allocation:", error);
      setPageError(
        error.response?.data?.detail ||
          error.response?.data?.employee?.[0] ||
          error.response?.data?.hours_allocated?.[0] ||
          "Failed to save allocation. Please check your input.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/labor-allocation");
  };

  // Generate employee options
  const employeeOptions = useMemo(
    () =>
      allEmployees.map((emp) => ({
        value: emp.id,
        label:
          emp.first_name && emp.last_name
            ? `${emp.first_name} ${emp.last_name} (${emp.username}) - ${emp.role}`
            : `${emp.username} - ${emp.role}`,
      })),
    [allEmployees],
  );

  // Generate project options
  const projectOptions = useMemo(
    () =>
      allProjects.map((proj) => ({
        value: proj.id,
        label: proj.name,
      })),
    [allProjects],
  );

  // Generate task options
  const taskOptions = useMemo(
    () =>
      allTasks.map((task) => ({
        value: task.id,
        label: task.name,
      })),
    [allTasks],
  );

  // Generate production line options
  const productionLineOptions = useMemo(
    () =>
      allProductionLines.map((line) => ({
        value: line.id,
        label: line.name,
      })),
    [allProductionLines],
  );

  const allocationTypeOptions = [
    { value: "project", label: "Project" },
    { value: "task", label: "Task" },
    { value: "production_line", label: "Production Line" },
  ];

  const getTypeIconComponent = (type) => {
    switch (type) {
      case "task":
        return ListChecks;
      case "project":
        return Briefcase;
      case "production_line":
        return Factory;
      default:
        return AlertTriangle;
    }
  };

  const getTargetName = () => {
    if (allocation) {
      if (allocation.task_name) return allocation.task_name;
      if (allocation.project_name) return allocation.project_name;
      if (allocation.production_line_name)
        return allocation.production_line_name;
    }
    return "N/A";
  };

  return (
    <Form
      icon={<Users />}
      heading={
        isViewMode
          ? "Labor Allocation Details"
          : allocationId
            ? "Edit Labor Allocation"
            : "Create New Labor Allocation"
      }
      text_01={
        isViewMode
          ? "View allocation details"
          : allocationId
            ? "Update allocation information"
            : "Assign employee to project, task, or production line"
      }
      text_02="Allocations"
      onClick={handleCancel}
      fnction={() => navigate(`/labor-allocation/edit/${allocationId}`)}
      gradient="from-orange-600 to-amber-800"
      isViewMode={isViewMode}
      pageError={pageError}
      loading={loading}
    >
      {isViewMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee */}
          <InfoItem
            icon={<UserCircle />}
            label="Employee"
            value={
              allocation?.employee_name ||
              allocation?.employee_username ||
              "N/A"
            }
          />
          {/* Allocation Date */}
          <InfoItem
            icon={<CalendarDays />}
            label="Date"
            value={
              allocation?.date
                ? new Date(allocation.date + "T00:00:00Z").toLocaleDateString()
                : "N/A"
            }
          />

          {/* Hours Allocated */}
          <InfoItem
            icon={<Clock />}
            label="Hours Allocated"
            value={
              allocation?.hours_allocated
                ? `${parseFloat(allocation.hours_allocated).toFixed(2)} hours`
                : "N/A"
            }
          />

          {/* Allocation Type */}
          <InfoItem
            icon={<Info />}
            label="Allocation Type"
            value={
              allocation?.task
                ? "Task"
                : allocation?.production_line
                  ? "Production Line"
                  : "Project"
            }
          />

          {/* Target */}
          <InfoItem
            icon={createElement(
              getTypeIconComponent(
                allocation?.task
                  ? "task"
                  : allocation?.production_line
                    ? "production_line"
                    : "project",
              ),
            )}
            label="Target"
            value={getTargetName()}
          />

          {/* Show project separately if task allocation */}
          {allocation?.project_name && allocation?.task_name && (
            <InfoItem
              icon={<Briefcase />}
              label="Project"
              value={allocation.project_name}
            />
          )}

          <InfoItem
            icon={<Clock />}
            label="Created At"
            value={
              allocation?.created_at
                ? new Date(allocation.created_at).toLocaleString()
                : "N/A"
            }
          />
          <InfoItem
            icon={<Clock />}
            label="Last Updated"
            value={
              allocation?.updated_at
                ? new Date(allocation.updated_at).toLocaleString()
                : "N/A"
            }
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Selection */}
            <SelectItem
              icon={<UserCircle />}
              label="Employee"
              name="employee"
              value={formData.employee}
              onChange={handleChange}
              options={employeeOptions}
              required
            />

            {/* Allocation Date */}
            <InputItem
              icon={<CalendarDays />}
              label="Allocation Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />

            {/* Hours Allocated */}
            <InputItem
              icon={<Clock />}
              label="Hours Allocated"
              type="text"
              name="hours_allocated"
              value={formData.hours_allocated}
              onChange={handleDecimalChange}
              required
              placeholder="1.00"
              inputMode="decimal"
            />

            {/* Allocation Type */}
            <SelectItem
              icon={<Info />}
              label="Allocate To"
              name="allocation_type"
              value={formData.allocation_type}
              onChange={handleChange}
              options={allocationTypeOptions}
              required
            />

            {/* Project Allocation */}
            {formData.allocation_type === "project" && (
              <SelectItem
                icon={<Briefcase />}
                label="Project"
                name="project"
                value={formData.project}
                onChange={handleChange}
                options={projectOptions}
                required
              />
            )}

            {/* Task Allocation */}
            {formData.allocation_type === "task" && (
              <>
                <SelectItem
                  icon={<Briefcase />}
                  label="Project (for Task)"
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  options={projectOptions}
                  required
                />
                {formData.project && (
                  <SelectItem
                    icon={<ListChecks />}
                    label="Task"
                    name="task"
                    value={formData.task}
                    onChange={handleChange}
                    options={taskOptions}
                    required
                    disabled={allTasks.length === 0}
                  />
                )}
              </>
            )}

            {/* Production Line Allocation */}
            {formData.allocation_type === "production_line" && (
              <SelectItem
                icon={<Factory />}
                label="Production Line"
                name="production_line"
                value={formData.production_line}
                onChange={handleChange}
                options={productionLineOptions}
                required
              />
            )}
          </div>

          <Buttons
            onCancel={handleCancel}
            text_01={allocationId ? "Save Changes" : "Create Allocation"}
          />
        </form>
      )}
    </Form>
  );
};

export default LaborAllocationForm;
