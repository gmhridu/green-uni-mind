import { useState, useRef, FormEvent } from "react";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  logout,
  selectAuthLoading,
  selectCurrentUser,
} from "@/redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useLogoutMutation } from "@/redux/features/auth/authApi";
import { toast } from "sonner";
import UserProfile from "./UserProfile";
import { cn } from "@/lib/utils";
import { baseApi } from "@/redux/api/baseApi";
import { USER_ROLE } from "@/constants/global";
import CartSheet from "./CartSheet";
import { setCart } from "@/redux/features/cart/cartSlice";
import { useSearchCoursesQuery } from "@/redux/features/course/course.api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const navbarMenu = [
  { label: "Home", path: "/" },
  { label: "Courses", path: "/courses" },
  { label: "Create Course", path: "/teacher/courses/create" },
  { label: "About", path: "/about" },
  {
    label: "Contact Us",
    path: "/contact",
  },
  {
    label: "Become a Teacher",
    path: { pathname: "/sign-up", search: "?becomeTeacher=true" },
  },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthLoading = useAppSelector(selectAuthLoading);
  const [signOut] = useLogoutMutation(undefined);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  console.log(user);

  // Skip the query if searchTerm is empty
  const { data: searchResults } = useSearchCoursesQuery(searchTerm, {
    skip: !searchTerm,
  });

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(undefined).unwrap();
      dispatch(logout());
      dispatch(setCart({ items: [], userId: null }));
      dispatch(baseApi.util.resetApiState());
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const userName =
    `${user?.name?.firstName || ""} ${user?.name?.middleName || ""} ${
      user?.name?.lastName || ""
    }`.trim() || "User";

  const photoUrl: string | undefined = user?.photoUrl || user?.profileImg;

  return (
    <nav
      className="w-full bg-[#FFFFFFA3] backdrop-blur-md py-3 fixed top-0 left-0 right-0 z-50 shadow-md"
      style={{ backgroundImage: "url('/images/grid-bg.png')" }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to={"/"}>
            <div>
              <img
                src="/images/logo.png"
                alt="Logo"
                className="size-14 rounded-full cursor-pointer"
              />
            </div>
          </Link>

          <form onSubmit={handleSearch} className="relative  hidden md:flex">
            <Input
              placeholder="Search..."
              className="w-[300px] pl-3 pr-10 py-2 rounded-md border border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <Search size={18} />
            </button>
          </form>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <ul className="flex items-center space-x-6">
            {navbarMenu
              .filter((item) => {
                // Filter out "Create Course" if user is not a teacher
                // Check all possible locations for the role
                const isTeacher =
                  user?.role === USER_ROLE.TEACHER ||
                  user?.user?.role === USER_ROLE.TEACHER ||
                  localStorage.getItem("userRole") === USER_ROLE.TEACHER;

                if (
                  typeof item.path === "string" &&
                  item.path === "/teacher/courses/create" &&
                  !isTeacher
                ) {
                  return false;
                }

                // Filter out "Become a Teacher" if user is already logged in
                if (
                  typeof item.path !== "string" &&
                  item.path.pathname === "/sign-up" &&
                  user
                ) {
                  return false;
                }

                return true;
              })
              .map((item) => (
                <li
                  key={
                    typeof item.path === "string"
                      ? item.path
                      : item.path.pathname
                  }
                >
                  <Link
                    to={item.path}
                    className={cn(
                      "font-medium",
                      isActive(
                        typeof item.path === "string"
                          ? item.path
                          : item.path.pathname
                      )
                        ? "text-[#006400]"
                        : "text-gray-800 hover:text-[#006400]"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>

          <div className="flex items-center justify-center gap-2">
            <CartSheet />
            <UserProfile
              user={user || null}
              isAuthLoading={isAuthLoading}
              open={open}
              setOpen={setOpen}
              hoverTimeout={hoverTimeout}
              handleLogout={handleLogout}
            />
          </div>
          {!user && (
            <div className="flex px-4 items-center space-x-3">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button className="w-full bg-[#4CAF50] hover:bg-[#3e8e41] text-white">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle Menu">
                <Menu size={24} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[250px] mr-4">
              <div className="flex items-center gap-x-2 px-2 py-2">
                <Avatar>
                  <AvatarImage src={photoUrl} />
                  <AvatarFallback>
                    {(userName?.slice(0, 2) || "US").toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800">
                    {userName}
                  </span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </div>

              <DropdownMenuSeparator />

              <form onSubmit={handleSearch} className="relative">
                <Input
                  placeholder="Search courses..."
                  className="w-full pl-3 pr-10 py-2 rounded-md border border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Search size={18} />
                </button>
              </form>

              <DropdownMenuSeparator />

              {navbarMenu
                .filter((item) => {
                  // Filter out "Create Course" if user is not a teacher
                  // Check all possible locations for the role
                  const isTeacher =
                    user?.role === USER_ROLE.TEACHER ||
                    user?.user?.role === USER_ROLE.TEACHER ||
                    localStorage.getItem("userRole") === USER_ROLE.TEACHER;

                  if (
                    typeof item.path === "string" &&
                    item.path === "/teacher/courses/create" &&
                    !isTeacher
                  ) {
                    return false;
                  }

                  // Filter out "Become a Teacher" if user is already logged in
                  if (
                    typeof item.path !== "string" &&
                    item.path.pathname === "/sign-up" &&
                    user
                  ) {
                    return false;
                  }

                  return true;
                })
                .map((item) => (
                  <DropdownMenuItem
                    key={
                      typeof item.path === "string"
                        ? item.path
                        : item.path.pathname
                    }
                    asChild
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        "w-full",
                        isActive(
                          typeof item.path === "string"
                            ? item.path
                            : item.path.pathname
                        )
                          ? "text-[#006400] font-medium"
                          : "text-gray-800"
                      )}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}

              <DropdownMenuSeparator />

              {!user && (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/login" className="w-full">
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/sign-up" className="w-full">
                      <Button className="w-full bg-[#4CAF50] hover:bg-[#3e8e41] text-white">
                        Sign Up
                      </Button>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {user && (
                <DropdownMenuItem asChild>
                  <Button
                    variant="outline"
                    className="w-full text-red-500 border-red-500 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
