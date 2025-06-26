import { useState, useEffect, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  DollarSign,
  Users,
  Settings,
  Menu,
  LogOut,
  User,
  ChevronsUpDown,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  GraduationCap,
  MessageSquare,
  HelpCircle,
  Star,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/features/auth/authSlice";
import {
  useGetMeQuery,
  useLogoutMutation,
} from "@/redux/features/auth/authApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  badge?: number;
  description?: string;
  group: 'main' | 'content' | 'analytics' | 'settings';
}

const DashboardSidebar = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const [signOut] = useLogoutMutation();

  // Close popover when sheet is closed
  useEffect(() => {
    if (!open) {
      setPopoverOpen(false);
    }
  }, [open]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed) {
      setCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
  };

  const handleLogout = async () => {
    try {
      await signOut(undefined).unwrap();
      dispatch(logout());
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed");
    }
  };

  const navItems: NavItem[] = useMemo(() => [
    // Main Navigation
    {
      path: "/teacher/dashboard",
      name: "Dashboard",
      icon: <LayoutDashboard className="sidebar-nav-icon" />,
      description: "Overview and analytics",
      group: 'main'
    },
    {
      path: "/teacher/analytics",
      name: "Analytics",
      icon: <BarChart3 className="sidebar-nav-icon" />,
      description: "Performance insights",
      group: 'analytics'
    },

    // Content Management
    {
      path: "/teacher/courses",
      name: "Courses",
      icon: <BookOpen className="sidebar-nav-icon" />,
      description: "Manage your courses",
      group: 'content'
    },
    {
      path: "/teacher/lectures",
      name: "Lectures",
      icon: <GraduationCap className="sidebar-nav-icon" />,
      description: "Course content",
      group: 'content'
    },

    // Student Management
    {
      path: "/teacher/students",
      name: "Students",
      icon: <Users className="sidebar-nav-icon" />,
      description: "Student management",
      group: 'main'
    },
    {
      path: "/teacher/reviews",
      name: "Reviews",
      icon: <Star className="sidebar-nav-icon" />,
      description: "Course reviews",
      group: 'analytics'
    },

    // Financial
    {
      path: "/teacher/earnings",
      name: "Earnings",
      icon: <DollarSign className="sidebar-nav-icon" />,
      description: "Revenue and payouts",
      group: 'analytics'
    },

    // Communication
    {
      path: "/teacher/messages",
      name: "Messages",
      icon: <MessageSquare className="sidebar-nav-icon" />,
      badge: 3,
      description: "Student communications",
      group: 'main'
    },

    // Settings
    {
      path: "/teacher/settings",
      name: "Settings",
      icon: <Settings className="sidebar-nav-icon" />,
      description: "Account settings",
      group: 'settings'
    },
    {
      path: "/teacher/help-support",
      name: "Help & Support",
      icon: <HelpCircle className="sidebar-nav-icon" />,
      description: "Get assistance",
      group: 'settings'
    },
  ], []);

  // Filter navigation items based on search
  const filteredNavItems = useMemo(() => {
    if (!searchQuery) return navItems;
    return navItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, navItems]);

  // Group navigation items
  const groupedNavItems = useMemo(() => {
    const groups = {
      main: filteredNavItems.filter(item => item.group === 'main'),
      content: filteredNavItems.filter(item => item.group === 'content'),
      analytics: filteredNavItems.filter(item => item.group === 'analytics'),
      settings: filteredNavItems.filter(item => item.group === 'settings'),
    };
    return groups;
  }, [filteredNavItems]);

  const renderNavGroup = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        {!collapsed && (
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
        )}
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  // Provide immediate visual feedback
                  const target = e.currentTarget;
                  target.style.transform = 'scale(0.98)';
                  setTimeout(() => {
                    target.style.transform = '';
                  }, 100);

                  // Close mobile menu
                  if (isMobile) {
                    setOpen(false);
                  }
                }}
                className={cn(
                  "sidebar-nav-item group relative transition-all duration-200",
                  isActive && "active",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.name : undefined}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && !collapsed && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                    {item.description && (
                      <div className="text-gray-300 text-xs">{item.description}</div>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header with improved responsive design */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 min-h-[73px]">
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-brand-text-primary leading-tight">
                GreenUniMind
              </h2>
              <p className="text-xs text-brand-primary font-medium">
                Learn Green. Live Better.
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-full">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="p-1.5 h-auto hover:bg-brand-accent transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-brand-text-secondary" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-brand-text-secondary" />
            )}
          </Button>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderNavGroup("Main", groupedNavItems.main)}
        {renderNavGroup("Content", groupedNavItems.content)}
        {renderNavGroup("Analytics", groupedNavItems.analytics)}
        {renderNavGroup("Settings", groupedNavItems.settings)}
      </div>
      {/* User Profile Section */}
      <div className="border-t border-gray-200 p-4">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start p-2 h-auto hover:bg-gray-50",
                collapsed && "justify-center"
              )}
            >
              <div className="flex items-center gap-3">
                {isUserLoading ? (
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                ) : (
                  <Avatar className="h-8 w-8 border-2 border-lms-primary">
                    <AvatarImage
                      src={userData?.data?.profileImg || userData?.data?.photoUrl}
                      alt={userData?.data?.name?.firstName || "User"}
                    />
                    <AvatarFallback className="bg-lms-primary text-white text-sm font-semibold">
                      {userData?.data?.name?.firstName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 text-sm">
                      {userData?.data?.name?.firstName || "User"}{" "}
                      {userData?.data?.name?.lastName || ""}
                    </div>
                    <div className="text-xs text-gray-500">Teacher</div>
                  </div>
                )}
                {!collapsed && (
                  <div className="flex items-center gap-1">
                    <Bell className="w-4 h-4 text-gray-400" />
                    <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start" side="top">
            <Command>
              <CommandList>
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={userData?.data?.profileImg || userData?.data?.photoUrl}
                        alt={userData?.data?.name?.firstName || "User"}
                      />
                      <AvatarFallback className="bg-lms-primary text-white">
                        {userData?.data?.name?.firstName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">
                        {userData?.data?.name?.firstName || "User"}{" "}
                        {userData?.data?.name?.lastName || ""}
                      </div>
                      <div className="text-sm text-gray-500">
                        {userData?.data?.email || "teacher@example.com"}
                      </div>
                    </div>
                  </div>
                </div>

                <CommandGroup heading="Account">
                  <CommandItem
                    onSelect={() => {
                      navigate("/teacher/settings");
                      setPopoverOpen(false);
                      if (isMobile) setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      navigate("/teacher/notifications");
                      setPopoverOpen(false);
                      if (isMobile) setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      handleLogout();
                      if (isMobile) setOpen(false);
                    }}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  // Mobile sidebar with enhanced responsiveness
  if (isMobile) {
    return (
      <>
        {/* Mobile menu button - positioned for better accessibility */}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <Sheet
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                setPopoverOpen(false);
                setSearchQuery("");
              }
            }}
          >
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-white shadow-lg border-gray-200 hover:bg-brand-accent hover:border-brand-primary transition-all duration-200"
              >
                <Menu className="h-5 w-5 text-brand-text-primary" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-[280px] sm:w-[320px] border-r-brand-primary/20"
            >
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
  }

  // Desktop sidebar with improved responsiveness
  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-20 transition-all duration-300 ease-in-out",
        "hidden md:block", // Hidden on mobile, visible on tablet and desktop
        collapsed ? "w-16" : "w-64",
        // Ensure proper z-index and positioning
        "overflow-hidden"
      )}
    >
      <SidebarContent />
    </aside>
  );
};

export default DashboardSidebar;
