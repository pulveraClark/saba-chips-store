import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMe, logoutUser } from "../services/authService.js";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await getMe();
      setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      navigate("/login");
    } catch (err) {
      navigate("/login");
    }
    setDropdownOpen(false);
  };

  if (loading) {
    return <div className="bg-white/80 backdrop-blur-md h-16 border-b border-gray-200"></div>;
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/home" className="text-2xl font-bold text-gray-900 hover:text-green-600 transition-colors">
            Saba Chips
          </Link>

          {/* Right side: Home + Dropdown */}
          <div className="flex items-center space-x-6">
            
            {/* Home - Outside dropdown */}
            <Link 
              to="/home" 
              className="text-lg font-medium text-gray-700 hover:text-green-600 transition-colors px-3 py-1 rounded hover:bg-gray-100"
            >
              Home
            </Link>

            {user ? (
              /* Profile Dropdown */
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-lg font-medium text-gray-700 hover:text-gray-900 transition-colors p-2 -m-2 rounded hover:bg-gray-100"
                >
                  <span>{user.name || 'Profile'}</span>
                  <svg className={`w-5 h-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown: Admin + Profile + Logout */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 z-50 min-w-max animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Admin - Admin only */}
                    {user.email === 'admin@sabachips.com' && (
                      <Link 
                        to="/admin" 
                        className="block px-6 py-3 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg font-semibold transition-colors border-l-4 border-purple-500 first:rounded-t-xl"
                        onClick={() => setDropdownOpen(false)}
                      >
                        🛠️ Admin Panel
                      </Link>
                    )}
                    
                    {/* Profile */}
                    <Link 
                      to="/profile" 
                      className="block px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      👤 My Profile
                    </Link>
                    
                    {/* Divider */}
                    <div className="border-t border-gray-200 my-1"></div>
                    
                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-6 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors last:rounded-b-xl"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-lg font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  Login
                </Link>
                
                <Link
                  to="/register"
                  className="text-lg font-semibold text-green-600 bg-green-100 hover:bg-green-200 px-6 py-2 rounded-full transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;