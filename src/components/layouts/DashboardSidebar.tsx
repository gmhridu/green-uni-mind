import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  DollarSign,
  Users,
  Settings,
  Menu,
  LogOut,
  Loader2,
  User,
  ChevronsUpDown,
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
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/features/auth/authSlice";
import {
  useGetMeQuery,
  useLogoutMutation,
} from "@/redux/features/auth/authApi";
import { toast } from "sonner";

const DashboardSidebar = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
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

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">GreenUniMind</h2>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive ? "bg-accent font-medium" : "hover:bg-gray-100"
                }`
              }
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="pb-3 px-2">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2">
                {isUserLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={
                        userData?.data?.profileImg || userData?.data?.photoUrl
                      }
                      alt={userData?.data?.name?.firstName || "User"}
                    />
                    <AvatarFallback>
                      {userData?.data?.name?.firstName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="truncate">
                  {userData?.data?.name?.firstName || "User"}{" "}
                  {userData?.data?.name?.lastName || ""}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandList>
                <CommandGroup heading="My Account">
                  <CommandItem
                    onSelect={() => {
                      navigate("/teacher/settings");
                      setPopoverOpen(false);
                      if (isMobile) {
                        setOpen(false);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      handleLogout();
                      if (isMobile) {
                        setOpen(false);
                      }
                    }}
                    className="cursor-pointer text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  // Mobile sidebar with Sheet component
  if (isMobile) {
    return (
      <>
        {/* Mobile menu button */}
        <div className="fixed top-4 right-4 z-30">
          <Sheet
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                setPopoverOpen(false);
              }
            }}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className="bg-white border-r border-gray-200 w-64 h-screen fixed left-0 top-0 z-20 pt-5 hidden md:block">
      <SidebarContent />
    </aside>
  );
};

export default DashboardSidebar;
