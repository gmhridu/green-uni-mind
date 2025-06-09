import { Phone, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#B7CAB7] py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Logo and Brand Section */}
        <div className="px-4 sm:px-6 lg:px-8 mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="GreenUniMind Logo"
              className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover"
            />
            <span className="font-display font-semibold text-white text-lg md:text-xl">
              GreenUniMind AI.
            </span>
          </div>
        </div>

        {/* Horizontal separator */}
        <div className="w-full h-px bg-white/40"></div>

        {/* Main Footer Content */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap gap-8 md:gap-10 lg:gap-16">
            {/* Left Column - Description */}
            <div className="w-full md:w-5/12 lg:w-5/12">
              <p className="text-white text-sm leading-relaxed max-w-md">
                Unlock limitless opportunities by learning directly from globally
                acclaimed experts, and take your skills, knowledge, and career to
                extraordinary new heights with our premium online courses.
              </p>

              {/* Social Media Icons */}
              <div className="flex gap-5 mt-5">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Twitter"
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
              </div>
            </div>

            {/* Middle Column - Service Links */}
            <div className="w-full md:w-3/12 lg:w-3/12">
              <h3 className="text-white font-medium text-lg mb-4">Service</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-white hover:opacity-80 text-sm transition-opacity">
                    HOME
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white hover:opacity-80 text-sm transition-opacity">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white hover:opacity-80 text-sm transition-opacity">
                    Courses
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white hover:opacity-80 text-sm transition-opacity">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Right Column - Contact Information */}
            <div className="w-full md:w-4/12 lg:w-4/12">
              <h3 className="text-white font-medium text-lg mb-4">Contact</h3>
              <ul className="space-y-3">
                <li>
                  <span className="text-white text-sm">takshadweek</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-white" />
                  <a href="tel:+4560032367843" className="text-white text-sm hover:opacity-80 transition-opacity">4560032367843</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-white" />
                  <a href="mailto:gmcfffd@gmail.com" className="text-white text-sm hover:opacity-80 transition-opacity">gmcfffd@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
