
const Footer = () => {
  return (
    <footer className="bg-green-50 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between mb-10">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-full" />
              <span className="font-display font-semibold text-xl">GreenthyMind AI</span>
            </div>
            <p className="text-gray-600 max-w-xs">
              Connecting artists with the perfect teachers through AI-powered matching and personalized learning.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" aria-label="Facebook" className="text-gray-600 hover:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" aria-label="Twitter" className="text-gray-600 hover:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-600 hover:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-purple-400">About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-purple-400">Careers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-purple-400">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-purple-400">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-purple-400">Community</a></li>
                <li><a href="#" className="text-gray-600 hover:text-purple-400">Tutorials</a></li>
                <li><a href="#" className="text-gray-600 hover:text-purple-400">Free Classes</a></li>
                <li><a href="#" className="text-gray-600 hover:text-purple-400">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-purple-400">Contact Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-purple-400">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-purple-400">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-purple-400">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} GreenthyMind AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
