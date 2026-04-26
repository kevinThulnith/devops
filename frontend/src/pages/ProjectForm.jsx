import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import Form from "../components/Form";
import api from "../api";

import {
  Buttons,
  InfoItem,
  InputItem,
  SelectItem,
  TextareaItem,
} from "../components/components";

import {
  AlertTriangle,
  CalendarDays,
  FolderKanban,
  CheckCircle,
  PlayCircle,
  Activity,
  XCircle,
  Target,
  Users,
  Clock,
  Info,
} from "lucide-react";

const ProjectsForm = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isViewMode = location.pathname.includes("/view/");
  const isCreateMode = location.pathname.includes("/add");

  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [allManagers, setAllManagers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    project_status: "PLANNING",
    project_manager: "",
  });
  const [originalProjectManager, setOriginalProjectManager] = useState(null);

  // Permissions
  const canAlwaysManage = user && ["ADMIN", "SUPERVISOR"].includes(user.role);
  const isOriginalPM = user && originalProjectManager === user?.id;
  const canCreate =
    user && ["ADMIN", "SUPERVISOR", "MANAGER"].includes(user.role);

  const canSubmitForm = useMemo(
    () =>
      (isCreateMode && canCreate) ||
      (!isCreateMode && (canAlwaysManage || isOriginalPM)),
    [isCreateMode, canCreate, canAlwaysManage, isOriginalPM],
  );

  // Data Fetching
  useEffect(() => {
    setLoading(true);
    api
      .get("api/user/", { params: { role: "MANAGER" } })
      .then((res) => setAllManagers(res.data.results || res.data))
      .catch((err) => console.error("Error fetching managers:", err))
      .finally(() => setLoading(false));
  }, []);

  const fetchProjectData = useCallback(() => {
    if (!projectId) {
      // Set default start date for new projects
      setFormData((prev) => ({
        ...prev,
        start_date: new Date().toISOString().split("T")[0],
        project_manager: user?.role === "MANAGER" ? user.id : "",
      }));
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`api/project/${projectId}/`)
      .then((res) => {
        setProject(res.data);
        setOriginalProjectManager(res.data.project_manager);
        setFormData({
          name: res.data.name || "",
          description: res.data.description || "",
          start_date: res.data.start_date
            ? res.data.start_date.split("T")[0]
            : "",
          end_date: res.data.end_date ? res.data.end_date.split("T")[0] : "",
          project_status: res.data.project_status || "PLANNING",
          project_manager: res.data.project_manager || "",
        });

        // Check permissions for managers
        if (
          user &&
          user.role === "MANAGER" &&
          res.data.project_manager !== user.id &&
          !canAlwaysManage
        ) {
          setPageError(
            "You can only edit projects you manage. This form is read-only.",
          );
        }
      })
      .catch((error) => {
        console.error("Failed to load project details:", error);
        setPageError("Failed to load project details.");
      })
      .finally(() => setLoading(false));
  }, [projectId, user, canAlwaysManage]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Event Handlers
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitForm) {
      setPageError("You do not have permission to save this project.");
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      setPageError("Project name is required.");
      return;
    }
    if (!formData.project_manager) {
      setPageError("Project manager is required.");
      return;
    }
    if (!formData.start_date) {
      setPageError("Start date is required.");
      return;
    }
    if (
      formData.end_date &&
      formData.start_date &&
      new Date(formData.end_date) < new Date(formData.start_date)
    ) {
      setPageError("End date cannot be before start date.");
      return;
    }

    setLoading(true);
    setPageError("");

    const payload = {
      name: formData.name,
      description: formData.description || null,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      project_status: formData.project_status,
      project_manager: parseInt(formData.project_manager),
    };

    try {
      if (isCreateMode) {
        await api.post("api/project/", payload);
      } else {
        await api.patch(`api/project/${projectId}/`, payload);
      }
      alert("Project saved successfully!");
      navigate("/project");
    } catch (err) {
      console.error("Error saving project:", err);
      setPageError(
        err.response?.data?.detail ||
          err.response?.data?.name?.[0] ||
          "Failed to save project.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      PLANNING: {
        color: "bg-gray-200 text-gray-800",
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
      ON_HOLD: {
        color: "bg-yellow-200 text-yellow-800",
        icon: <Clock size={14} />,
      },
      CANCELLED: {
        color: "bg-red-200 text-red-800",
        icon: <XCircle size={14} />,
      },
    }[status];
    if (!config) return null;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${config.color}`}
      >
        {config.icon} {status}
      </span>
    );
  };

  const isFieldDisabled = (fieldName) => {
    const formDisabled = !isCreateMode && !canSubmitForm;
    if (formDisabled) return true;

    // Special cases
    if (fieldName === "start_date" && !isCreateMode && !canAlwaysManage) {
      return true; // Only Admin/Supervisor can change start_date of existing project
    }
    if (
      fieldName === "project_manager" &&
      !isCreateMode &&
      !canAlwaysManage &&
      user?.role === "MANAGER"
    ) {
      return true; // Manager cannot change PM of existing project
    }
    return false;
  };

  return (
    <Form
      icon={<FolderKanban />}
      heading={
        isViewMode
          ? "View Project"
          : isCreateMode
            ? "Add New Project"
            : "Edit Project"
      }
      text_01={
        isViewMode
          ? "View details of the project."
          : isCreateMode
            ? "Fill in the details to add a new project."
            : "Modify the details of the project."
      }
      text_02={"Projects"}
      onClick={() => navigate("/project")}
      fnction={() => navigate("/project/edit/" + projectId)}
      gradient={"from-indigo-600 to-indigo-800"}
      isViewMode={isViewMode}
      pageError={pageError}
      loading={loading}
    >
      {isViewMode ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoItem
              icon={<FolderKanban />}
              label="Project Name"
              value={project?.name}
            />
            <InfoItem
              icon={<Users />}
              label="Project Manager"
              value={project?.project_manager_name || "Unassigned"}
            />
            <div className="flex flex-col">
              <label className="flex items-center gap-2 text-sm text-stone-400 mb-2">
                <Activity size={16} /> Status
              </label>
              {project?.project_status &&
                getStatusBadge(project.project_status)}
            </div>
            <InfoItem
              icon={<CalendarDays />}
              label="Start Date"
              value={
                project?.start_date
                  ? new Date(
                      project.start_date + "T00:00:00Z",
                    ).toLocaleDateString()
                  : "N/A"
              }
            />
            <InfoItem
              icon={<CalendarDays />}
              label="End Date"
              value={
                project?.end_date
                  ? new Date(
                      project.end_date + "T00:00:00Z",
                    ).toLocaleDateString()
                  : "Not set"
              }
            />
            <InfoItem
              icon={<Activity />}
              label="Tasks"
              value={`${project?.tasks_count || 0} total`}
            />
          </div>
          <InfoItem
            icon={<Info />}
            label="Description"
            value={project?.description || "No description provided."}
          />

          {/* Recent Tasks */}
          {project?.recent_tasks && project.recent_tasks.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-stone-300 mb-3 border-b border-stone-700 pb-2 flex items-center gap-2">
                <Activity /> Recent Tasks
              </h3>
              <div className="space-y-2">
                {project.recent_tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-card-sub rounded-md flex items-center justify-between"
                  >
                    <span className="text-stone-300">{task.name}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        task.status === "COMPLETED"
                          ? "bg-green-200 text-green-800"
                          : task.status === "IN_PROGRESS"
                            ? "bg-blue-200 text-blue-800"
                            : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputItem
                label="Project Name"
                name="name"
                icon={<FolderKanban />}
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isFieldDisabled("name")}
              />
            </div>
            <SelectItem
              label="Project Manager"
              name="project_manager"
              icon={<Users />}
              value={formData.project_manager}
              onChange={handleChange}
              options={allManagers.map((mgr) => ({
                value: mgr.id,
                label: `${mgr.first_name} ${mgr.last_name} (${mgr.username})`,
              }))}
              required
              disabled={isFieldDisabled("project_manager")}
            />
            <SelectItem
              label="Status"
              name="project_status"
              icon={<Activity />}
              value={formData.project_status}
              onChange={handleChange}
              options={[
                { value: "PLANNING", label: "Planning" },
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "COMPLETED", label: "Completed" },
                { value: "ON_HOLD", label: "On Hold" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
              required
              disabled={isFieldDisabled("project_status")}
            />
            <InputItem
              label="Start Date"
              name="start_date"
              icon={<CalendarDays />}
              value={formData.start_date}
              onChange={handleChange}
              type="date"
              required
              disabled={isFieldDisabled("start_date")}
            />
            <InputItem
              label="End Date"
              name="end_date"
              icon={<CalendarDays />}
              value={formData.end_date}
              onChange={handleChange}
              type="date"
              disabled={isFieldDisabled("end_date")}
            />
            <div className="md:col-span-2">
              <TextareaItem
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                disabled={isFieldDisabled("description")}
              />
            </div>
          </div>

          {!canSubmitForm && !loading && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <p className="text-xs text-yellow-300 flex items-center gap-2">
                <AlertTriangle size={14} />
                You are viewing this project in read-only mode.
              </p>
            </div>
          )}

          <Buttons
            onCancel={() => navigate("/project")}
            text_01={isCreateMode ? "Create Project" : "Save Changes"}
            disabled={loading || !canSubmitForm}
          />
        </form>
      )}
    </Form>
  );
};

export default ProjectsForm;
