import { useState, useRef, FormEvent } from "react";
import { Menu, Search, X } from "lucide-react";
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

const navbarMenu = [
  { label: "HOME", path: "/" },
  { label: "About", path: "/about" },
  { label: "Courses", path: "/courses" },
  { label: "Create Course", path: "/teacher/courses/create" },
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

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

          <form onSubmit={handleSearch} className="relative">
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
                if (
                  typeof item.path === "string" &&
                  item.path === "/teacher/courses/create" &&
                  user?.role !== USER_ROLE.TEACHER
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

                // Show "Contact Us" only once in the main menu (we'll add the button separately)
                if (
                  typeof item.path === "string" &&
                  item.path === "/contact" &&
                  item.label === "Contact Us"
                ) {
                  return false;
                }

                return true;
              })
              .map((item) => (
                <li
                  key={typeof item.path === "string" ? item.path : item.path.pathname}
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

          {/* Contact Us Button */}
          <Link to="/contact">
            <Button className="bg-[#4CAF50] hover:bg-[#3e8e41] text-white rounded-md">
              Contact Us
            </Button>
          </Link>

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
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white absolute top-full left-0 w-full shadow-lg py-4">
          <div className="container mx-auto flex flex-col space-y-4">
            <form onSubmit={handleSearch} className="relative px-4 mb-2">
              <Input
                placeholder="Search courses..."
                className="w-full pl-3 pr-10 py-2 rounded-md border border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <Search size={18} />
              </button>
            </form>

            <Link to="/" className="text-gray-800 hover:text-[#006400] px-4 py-2">
              Home
            </Link>
            <Link to="/about" className="text-gray-800 hover:text-[#006400] px-4 py-2">
              About
            </Link>
            <Link to="/courses" className="text-gray-800 hover:text-[#006400] px-4 py-2">
              Courses
            </Link>
            <Link to="/contact" className="text-gray-800 hover:text-[#006400] px-4 py-2">
              Contact Us
            </Link>

            {!user && (
              <div className="flex flex-col space-y-2 px-4">
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

            {user && (
              <div className="px-4">
                <Button
                  variant="outline"
                  className="w-full text-red-500 border-red-500 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
