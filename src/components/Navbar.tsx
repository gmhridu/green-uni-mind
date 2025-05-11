import { useState, useRef } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
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

const navbarMenu = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Courses", path: "/courses" },
  { label: "Create Course", path: "/teacher/courses/create" },
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
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

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
      className="w-full bg-[#FFFFFFA3]
 backdrop-blur-md py-2 fixed top-0 left-0 right-0 z-50 shadow-md"
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to={"/"}>
            <div className="max-w-64">
              <img
                src="/images/logo.png"
                alt="Logo"
                className="size-16 rounded-full cursor-pointer"
              />
            </div>
          </Link>
          <div>
            <Input placeholder="Search..." />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
          <ul className="flex items-center space-x-4">
            {navbarMenu
              .filter((item) => {
                if (
                  typeof item.path !== "string" &&
                  (item.path.pathname === "/sign-up" ||
                    item.path.pathname === "/sign-up?becomeTeacher=true" ||
                    item.path.pathname === "/sign-in") &&
                  user
                ) {
                  return false;
                }
                if (
                  typeof item.path === "string" &&
                  item.path === "/teacher/courses/create" &&
                  user?.role !== USER_ROLE.TEACHER
                ) {
                  return false;
                }
                return true;
              })
              .map((item, idx) => (
                <>
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
                </>
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
            <a
              href="#"
              className="text-gray-800 hover:text-[#006400] px-4 py-2"
            >
              Home
            </a>
            <a
              href="#"
              className="text-gray-800 hover:text-[#006400] px-4 py-2"
            >
              About
            </a>
            <a
              href="#"
              className="text-gray-800 hover:text-[#006400] px-4 py-2"
            >
              Courses
            </a>
            <a
              href="#"
              className="text-gray-800 hover:text-[#006400] px-4 py-2"
            >
              Teachers
            </a>
            <div className="flex flex-col space-y-2 px-4">
              <Button variant="outline" className="w-full">
                Login
              </Button>
              <Button className="w-full bg-[#1edb1e] hover:bg-[#036e03] text-white">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
