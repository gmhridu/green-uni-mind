import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav
      className="w-full bg-[#FFFFFFA3]
 backdrop-blur-md py-4 fixed top-0 left-0 right-0 z-50"
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="size-12 rounded-full cursor-pointer"
          />
          {/* <span className="font-display font-semibold text-xl">Gree</span> */}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a
            href="#"
            className="text-gray-800 hover:text-[#006400] font-medium"
          >
            Home
          </a>
          <a
            href="#"
            className="text-gray-800 hover:text-[#006400] font-medium"
          >
            About
          </a>
          <a
            href="#"
            className="text-gray-800 hover:text-[#006400] font-medium"
          >
            Courses
          </a>
          <a
            href="#"
            className="text-gray-800 hover:text-[#006400] font-medium"
          >
            Teachers
          </a>
          <Button variant="ghost" className="font-medium">
            Login
          </Button>
          <Button className="bg-[#1edb1e] hover:bg-[#036e03] text-white">
            Sign Up
          </Button>
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
              className="text-gray-800 hover:text-purple-400 px-4 py-2"
            >
              Home
            </a>
            <a
              href="#"
              className="text-gray-800 hover:text-purple-400 px-4 py-2"
            >
              About
            </a>
            <a
              href="#"
              className="text-gray-800 hover:text-purple-400 px-4 py-2"
            >
              Courses
            </a>
            <a
              href="#"
              className="text-gray-800 hover:text-purple-400 px-4 py-2"
            >
              Teachers
            </a>
            <div className="flex flex-col space-y-2 px-4">
              <Button variant="outline" className="w-full">
                Login
              </Button>
              <Button className="w-full bg-purple-500 hover:bg-purple-400">
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
