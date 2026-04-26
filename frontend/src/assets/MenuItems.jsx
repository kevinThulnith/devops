import { LuUsersRound, LuUserRound } from "react-icons/lu";
import { MdDashboard } from "react-icons/md";
import { GiFactory } from "react-icons/gi";
import { FiPackage } from "react-icons/fi";

import {
  FaClipboardCheck,
  FaShoppingCart,
  FaCalendarAlt,
  FaChartLine,
  FaBuilding,
  FaBullseye,
  FaWrench,
  FaTasks,
  FaTruck,
  FaUsers,
  FaStar,
  FaCog,
  FaBox,
} from "react-icons/fa";

// !Define menu items grouped by category
const menuItems = {
  // Core Navigation
  core: [
    {
      id: "dashboard",
      name: "Dashboard",
      path: "/",
      icon: <MdDashboard size={20} />,
      roles: [
        "ADMIN",
        "SUPERVISOR",
        "MANAGER",
        "OPERATOR",
        "TECHNICIAN",
        "PURCHASING",
      ],
    },
    {
      id: "profile",
      name: "My Profile",
      path: "/profile",
      icon: <LuUserRound size={20} />,
      roles: [
        "ADMIN",
        "SUPERVISOR",
        "MANAGER",
        "OPERATOR",
        "TECHNICIAN",
        "PURCHASING",
      ],
    },
    {
      id: "users",
      name: "User Management",
      path: "/user",
      icon: <LuUsersRound size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "MANAGER"],
    },
  ],

  // Organization Management
  organization: [
    {
      id: "departments",
      name: "Departments",
      path: "/department",
      icon: <FaBuilding size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "MANAGER", "OPERATOR"],
    },
    {
      id: "workshops",
      name: "Workshops",
      path: "/workshop",
      icon: <GiFactory size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "MANAGER", "TECHNICIAN", "OPERATOR"],
    },
  ],

  // Equipment & Skills
  equipment: [
    {
      id: "machines",
      name: "Machines",
      path: "/machine",
      icon: <FaCog size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "MANAGER", "OPERATOR", "TECHNICIAN"],
    },
    {
      id: "skills",
      name: "Skill Matrix",
      path: "/skill-matrix",
      icon: <FaStar size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "MANAGER"],
    },
    {
      id: "mySkills",
      name: "My Skills",
      path: "/my-skills",
      icon: <FaBullseye size={20} />,
      roles: ["SUPERVISOR", "MANAGER", "OPERATOR", "TECHNICIAN"],
    },
  ],

  // Supply Chain
  supply: [
    {
      id: "suppliers",
      name: "Suppliers",
      path: "/supplier",
      icon: <FaTruck size={20} />,
      roles: ["ADMIN", "PURCHASING", "SUPERVISOR"],
    },
    {
      id: "materials",
      name: "Materials",
      path: "/material",
      icon: <FaBox size={20} />,
      roles: ["ADMIN", "PURCHASING", "SUPERVISOR", "MANAGER", "OPERATOR"],
    },
    {
      id: "products",
      name: "Products",
      path: "/product",
      icon: <FiPackage size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "MANAGER", "OPERATOR"],
    },
    {
      id: "orders",
      name: "Purchase Orders",
      path: "/order",
      icon: <FaShoppingCart size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "PURCHASING"],
    },
  ],

  // Production
  production: [
    {
      id: "productionLines",
      name: "Production Lines",
      path: "/production-line",
      icon: <FaChartLine size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "MANAGER", "OPERATOR", "TECHNICIAN"],
    },
    {
      id: "manufacturingProcesses",
      name: "Processes",
      path: "/manufacturing-process",
      icon: <FaWrench size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "MANAGER", "TECHNICIAN"],
    },
    {
      id: "productionSchedules",
      name: "Schedules",
      path: "/production-schedule",
      icon: <FaCalendarAlt size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "MANAGER", "OPERATOR"],
    },
  ],

  // Project Management
  projects: [
    {
      id: "projects",
      name: "Projects",
      path: "/project",
      icon: <FaTasks size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "MANAGER"],
    },
    {
      id: "tasks",
      name: "Tasks",
      path: "/task",
      icon: <FaClipboardCheck size={20} />, // Changed from FaListCheck
      roles: ["ADMIN", "SUPERVISOR", "MANAGER", "OPERATOR", "TECHNICIAN"],
    },
    {
      id: "laborAllocations",
      name: "Labor Allocations",
      path: "/labor-allocation",
      icon: <FaUsers size={20} />,
      roles: ["ADMIN", "SUPERVISOR", "MANAGER"],
    },
  ],
};

export default menuItems;
