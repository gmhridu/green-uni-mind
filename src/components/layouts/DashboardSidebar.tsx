import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  DollarSign,
  Users,
  Settings,
} from "lucide-react";

const DashboardSidebar = () => {
  const navItems = [
    {
      path: "/teacher/dashboard",
      name: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      path: "/teacher/courses",
      name: "Courses",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      path: "/teacher/materials",
      name: "Materials",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      path: "/teacher/earnings",
      name: "Earnings",
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      path: "/teacher/students",
      name: "Students",
      icon: <Users className="w-5 h-5" />,
    },
    {
      path: "/teacher/settings",
      name: "Settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="bg-white border-r border-gray-200 w-64 h-screen fixed left-0 top-0 pt-20 z-20">
      <div className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive ? "bg-accent  font-medium " : "hover:bg-gray-100"
                }`
              }
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
