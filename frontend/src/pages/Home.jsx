import React, { useEffect, useState, useMemo } from "react";
import { MdDashboard } from "react-icons/md";
import { Link } from "react-router-dom";
import api from "../api";

import {
  AlertTriangle,
  UserRoundPlus,
  CheckCircle,
  ListChecks,
  BarChart3,
  Calendar,
  Activity,
  UserStar,
  Factory,
  Package,
  Wrench,
  Target,
  Clock,
  Award,
  Users,
  Bell,
} from "lucide-react";

function Home() {
  const [userInfo, setUserInfo] = useState({ username: "", email: "" });
  const [dashboardData, setDashboardData] = useState({
    departments: [],
    workshops: [],
    projects: [],
    machines: [],
    products: [],
    orders: [],
    tasks: [],
    users: [],
  });

  // TODO: Refresh the page when the page is loaded for the first time
  if (!localStorage.getItem("refreshed")) {
    localStorage.setItem("refreshed", "true");
    window.location.reload();
  }

  // TODO: Fetch data
  useEffect(() => {
    if (localStorage.getItem("refreshed") === "true") {
      api
        .get("api/user/me/")
        .then((res) => setUserInfo(res.data))
        .catch((error) => alert(error));
    }
    api
      .get("api/user/")
      .then((res) => {
        setDashboardData((prevData) => ({
          ...prevData,
          users: res.data,
        }));
      })
      .catch(() => console.error("Error fetching users:"));

    api
      .get("api/department/")
      .then((res) => {
        setDashboardData((prevData) => ({
          ...prevData,
          departments: res.data,
        }));
      })
      .catch(() => console.error("Error fetching departments:"));

    api
      .get("api/workshop/")
      .then((res) => {
        setDashboardData((prevData) => ({
          ...prevData,
          workshops: res.data,
        }));
      })
      .catch(() => console.error("Error fetching workshops:"));

    api
      .get("api/machine/")
      .then((res) => {
        setDashboardData((prevData) => ({
          ...prevData,
          machines: res.data,
        }));
      })
      .catch(() => console.error("Error fetching machines:"));

    api
      .get("api/project/")
      .then((res) => {
        setDashboardData((prevData) => ({
          ...prevData,
          projects: res.data,
        }));
      })
      .catch(() => console.error("Error fetching projects:"));

    api
      .get("api/task/")
      .then((res) => {
        setDashboardData((prevData) => ({
          ...prevData,
          tasks: res.data,
        }));
      })
      .catch(() => console.error("Error fetching tasks:"));

    api
      .get("api/product/")
      .then((res) => {
        setDashboardData((prevData) => ({
          ...prevData,
          products: res.data,
        }));
      })
      .catch(() => console.error("Error fetching products:"));

    api
      .get("api/order/")
      .then((res) => {
        setDashboardData((prevData) => ({
          ...prevData,
          orders: res.data,
        }));
      })
      .catch(() => console.error("Error fetching orders:"));
  }, []);

  // !Render quick stats cards based on user role
  const renderQuickStats = () => {
    const stats = [];

    if (["ADMIN", "SUPERVISOR"].includes(userInfo.role)) {
      stats.push(
        {
          title: "Departments",
          value: dashboardData.departments.length,
          icon: <Factory size={28} />,
          color: "green",
          link: "/department",
        },
        {
          title: "Workshops",
          value: dashboardData.workshops.length,
          icon: <Wrench size={28} />,
          color: "yellow",
          link: "/workshop",
        },
        {
          title: "Machines",
          value: dashboardData.machines.length,
          icon: <Activity size={28} />,
          color: "red",
          link: "/machine",
        },
      );
    }

    if (["ADMIN", "SUPERVISOR", "MANAGER"].includes(userInfo.role)) {
      stats.push(
        {
          title: "Total Users",
          value: dashboardData.users.length,
          icon: <Users size={28} />,
          color: "blue",
          link: "/user",
        },
        {
          title: "Active Projects",
          value: dashboardData.projects.length,
          icon: <Target size={28} />,
          color: "indigo",
          link: "/project",
        },
        {
          title: "Total Tasks",
          value: dashboardData.tasks.length,
          icon: <ListChecks size={28} />,
          color: "yellow",
          link: "/task",
        },
      );
    }

    if (
      ["ADMIN", "SUPERVISOR", "MANAGER", "PURCHASING"].includes(userInfo.role)
    ) {
      stats.push(
        {
          title: "Products",
          value: dashboardData.products.length,
          icon: <Package size={24} />,
          color: "pink",
          link: "/products",
        },
        {
          title: "Orders",
          value: dashboardData.orders.length,
          icon: <Calendar size={24} />,
          color: "yellow",
          link: "/orders",
        },
      );
    }

    return stats.slice(0, 6); // Limit to 6 cards for better layout
  };

  // Calculate user-specific statistics and data
  const userStats = useMemo(() => {
    const myTasks = dashboardData.tasks.filter(
      (task) =>
        task.assigned_to === userInfo.id ||
        (userInfo.role === "MANAGER" &&
          task.project_manager_id === userInfo.id),
    );

    const myMachine = dashboardData.machines.find(
      (machine) => machine.operator === userInfo.id,
    );

    const myDepartment = dashboardData.departments.find(
      (dept) => dept.manager === userInfo.id,
    );

    const myWorkshop = dashboardData.workshops.find(
      (workshop) => workshop.supervisor === userInfo.id,
    );

    const myProjects = dashboardData.projects.filter(
      (project) =>
        project.manager === userInfo.id ||
        project.project_manager_id === userInfo.id,
    );

    return {
      myTasks,
      myMachine,
      myDepartment,
      myWorkshop,
      myProjects,
      completedTasks: myTasks.filter((task) => task.status === "COMPLETED")
        .length,
      pendingTasks: myTasks.filter((task) => task.status === "PENDING").length,
      inProgressTasks: myTasks.filter((task) => task.status === "IN_PROGRESS")
        .length,
      overdueTasks: myTasks.filter((task) => {
        const dueDate = new Date(task.end_date);
        return dueDate < new Date() && task.status !== "COMPLETED";
      }).length,
    };
  }, [dashboardData, userInfo]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 bg-card-main sm:p-8 p-6 rounded-lg shadow-lg flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="flex items-center justify-center mb-4 sm:mb-0">
          <div className="p-2 sm:rounded-2xl rounded-xl sm:ml-2 shadow-lg transform hover:scale-105 transition-all duration-300 bg-star-dust-800">
            <MdDashboard className="text-stone-200 w-[50px] h-[50px] sm:w-[95px] sm:h-[95px]" />
          </div>
          <h1 className="text-[42px] sm:text-4xl sm:font-bold font-medium text-stone-200 ml-4 tracking-wide sm:hidden">
            Dashboard
          </h1>
        </div>
        <div className="flex-1 sm:ml-6">
          <h1 className="hidden sm:block text-4xl font-bold text-stone-200 mb-1 tracking-wide">
            Dashboard
          </h1>
          <p className="text-1xl font-medium text-stone-400">
            Welcome back {userInfo.name}!
          </p>
          <div className="flex sm:items-center mt-3 text-star-dust-300">
            <span className="mr-2">Current role :</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm ${
                userInfo.role == "ADMIN"
                  ? "bg-gradient-to-r from-orange-700 to-purple-700 text-stone-200"
                  : "bg-gradient-to-r from-yellow-600 to-blue-700 text-stone-100"
              }`}
            >
              {userInfo.role}
            </span>
          </div>
        </div>

        {/* Admin quick actions */}
        {userInfo.role == "ADMIN" && (
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/user"
              className="p-4 bg-orange-600 rounded-xl text-stone-200 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
            >
              <Users
                size={32}
                className="mx-auto mb-2 group-hover:animate-pulse"
              />
              <div className="text-sm font-medium">Manage Users</div>
            </Link>
            <Link
              to="/register"
              className="p-4 bg-purple-600 rounded-xl text-stone-200 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
            >
              <UserRoundPlus
                size={32}
                className="mx-auto mb-2 group-hover:animate-pulse"
              />
              <div className="text-sm font-medium mx-5">Add User</div>
            </Link>
          </div>
        )}
        {/* Non-admin user actions */}
        {userInfo.role != "ADMIN" && (
          <div className="hidden lg:block">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white text-center shadow-lg">
              <BarChart3 size={32} className="mx-auto mb-2 text-white" />
              <div className="text-sm font-medium">My Performance</div>
            </div>
          </div>
        )}
      </div>

      {/* admin management panel */}
      {userInfo.role == "ADMIN" && (
        <div className="mb-8 shadow-lg bg-card-main sm:p-8 p-6 rounded-lg">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-md mr-3 shadow-md bg-star-dust-700">
              <UserStar size={28} className="text-stone-200" />
            </div>
            <h3 className="sm:text-3xl text-xl font-medium text-star-dust-200">
              Admin Control Panel
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* User Management */}
            <Link
              to="/user"
              className="group p-6 rounded-xl bg-card-sub shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                  <Users size={28} className="text-white" />
                </div>
                <span className="text-2xl font-bold text-purple-500">
                  {dashboardData.users.length}
                </span>
              </div>
              <h4 className={`font-medium mb-1 text-stone-200`}>
                User Management
              </h4>
              <p className={`text-sm text-gray-400`}>
                Manage user accounts, roles, and permissions
              </p>
            </Link>

            {/* Department Management */}
            <Link
              to="/department"
              className="group p-6 rounded-xl bg-card-sub shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <Factory size={28} className="text-white" />
                </div>
                <span className="text-2xl font-bold text-blue-500">
                  {dashboardData.departments.length}
                </span>
              </div>
              <h4 className={`font-medium mb-1 text-stone-200`}>Departments</h4>
              <p className={`text-sm text-gray-400`}>
                Organize and manage department structures
              </p>
            </Link>

            {/* Workshop Management */}
            <Link
              to="/workshop"
              className="group p-6 rounded-xl bg-card-sub shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                  <Wrench size={28} className="text-white" />
                </div>
                <span className="text-2xl font-bold text-green-500">
                  {dashboardData.workshops.length}
                </span>
              </div>
              <h4 className={`font-medium mb-1 text-stone-200`}>Workshops</h4>
              <p className={`text-sm text-gray-400`}>
                Monitor workshop operations and productivity
              </p>
            </Link>

            {/* System Status */}
            <div className="group p-6 rounded-xl bg-card-sub shadow-lg transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                  <Activity size={28} className="text-white" />
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  {
                    dashboardData.machines.filter(
                      (m) => m.status === "IDLE" || m.status === "OPERATIONAL",
                    ).length
                  }
                </span>
              </div>
              <h4 className={`font-medium mb-1 text-stone-200`}>
                System Status
              </h4>
              <p className={`text-sm text-gray-400`}>
                Active machines and system health monitoring
              </p>
            </div>
          </div>

          {/* Admin Quick Actions */}
          <div className="mt-5 pt-5 border-t border-star-dust-600">
            <button
              className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-stone-200 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
              onClick={() => window.location.reload()}
            >
              <Activity size={18} className="mr-2 inline" />
              Refresh Data
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats Grid with Enhanced Styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {renderQuickStats().map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="bg-card-main rounded-lg sm:p-6 p-4 shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1 group sm:block flex gap-4 items-center"
          >
            <div className="flex  sm:mb-4">
              <div className="p-2 bg-star-dust-700 rounded-md text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                {React.cloneElement(stat.icon, {
                  className: "mx-auto text-white",
                })}
              </div>
            </div>
            <div className="text-stone-400">
              {stat.title}:
              <div className={`text-1xl font-medium inline-block ml-2`}>
                {stat.value}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Tasks */}
        <div className="bg-card-main rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-star-dust-700 rounded-lg mr-3">
                <Clock size={20} className="text-white" />
              </div>
              <h3 className="text-xl sm:font-bold font-medium text-stone-200">
                Recent Tasks
              </h3>
            </div>
            <div className="text-xs text-gray-500 bg-[#3a3a3a] px-2 py-1 rounded-full">
              Last {userStats.myTasks?.length || 0} tasks
            </div>
          </div>
          <div className="space-y-3">
            {userStats.myTasks?.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-[#3a3a3a] rounded-xl hover:shadow-md transition-all duration-200 border border-gray-800"
              >
                <div className="flex-1">
                  <div className="font-semibold text-stone-200 mb-1">
                    {task.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {task.project_name}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      task.status === "COMPLETED"
                        ? "bg-green-900 text-green-100"
                        : task.status === "IN_PROGRESS"
                          ? "bg-blue-900 text-blue-100"
                          : task.status === "PENDING"
                            ? "bg-yellow-900 text-yellow-100"
                            : "bg-red-900 text-red-100"
                    }`}
                  >
                    {task.status?.replace("_", " ")}
                  </span>
                  <div className="text-xs text-gray-500 mt-1 font-medium">
                    Due: {new Date(task.end_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {(!userStats.myTasks || userStats.myTasks.length === 0) && (
              <div className="text-center py-12">
                <div className="bg-[#3a3a3a] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <ListChecks size={32} className="text-gray-500" />
                </div>
                <p className="text-gray-400 font-medium">
                  No tasks assigned yet
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Tasks will appear here when assigned
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-card-main rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-star-dust-700 rounded-lg mr-3">
                <Bell size={20} className="text-white" />
              </div>
              <h3 className="sm:text-xl sm:font-bold font-medium text-stone-200">
                Alerts & Notifications
              </h3>
            </div>
            <div className="text-xs text-gray-400 bg-[#3a3a3a] px-2 py-1 rounded-full">
              Live updates
            </div>
          </div>
          <div className="space-y-4">
            {/* Overdue tasks alert */}
            {userStats.overdueTasks > 0 && (
              <div className="flex items-start p-4 bg-[#3a3a3a] border-l-4 border-red-600 rounded-lg shadow-sm">
                <div className="p-2 bg-red-600 rounded-lg mr-3 flex-shrink-0">
                  <AlertTriangle size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-red-400 mb-1">
                    Overdue Tasks Alert
                  </div>
                  <div className="text-sm text-gray-300">
                    You have {userStats.overdueTasks} overdue task
                    {userStats.overdueTasks > 1 ? "s" : ""} requiring immediate
                    attention
                  </div>
                </div>
              </div>
            )}

            {/* Machine status alert for operators */}
            {userStats.myMachine &&
              userStats.myMachine.status !== "OPERATIONAL" && (
                <div className="flex items-start p-4 bg-[#3a3a3a] border-l-4 border-yellow-600 rounded-lg shadow-sm">
                  <div className="p-2 bg-yellow-600 rounded-lg mr-3 flex-shrink-0">
                    <Activity size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-yellow-400 mb-1">
                      Machine Status Update
                    </div>
                    <div className="text-sm text-gray-300">
                      {userStats.myMachine.name} is currently{" "}
                      {userStats.myMachine.status.toLowerCase()}
                    </div>
                  </div>
                </div>
              )}

            {/* Welcome message */}
            <div className="flex items-start p-4 bg-[#3a3a3a] border-l-4 border-green-600 rounded-lg shadow-sm">
              <div className="p-2 bg-green-600 rounded-lg mr-3 flex-shrink-0">
                <CheckCircle size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-green-400 mb-1">
                  Welcome to Factory OS
                </div>
                <div className="text-sm text-gray-300">
                  Your personalized dashboard is ready with role-based features
                </div>
              </div>
            </div>

            {/* Performance insight */}
            <div className="flex items-start p-4 bg-[#3a3a3a] border-l-4 border-blue-600 rounded-lg shadow-sm">
              <div className="p-2 bg-blue-600 rounded-lg mr-3 flex-shrink-0">
                <Award size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-blue-400 mb-1">
                  Performance Insight
                </div>
                <div className="text-sm text-gray-300">
                  {userStats.completedTasks > 0
                    ? `Great job! You've completed ${
                        userStats.completedTasks
                      } task${
                        userStats.completedTasks > 1 ? "s" : ""
                      } this period`
                    : "Ready to start your tasks and track your progress"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
