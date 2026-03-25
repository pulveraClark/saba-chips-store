import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMe, logoutUser } from "../services/authService.js";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
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
  };

  // Show loading bar while checking auth
  if (loading) {
    return (
      <div className="bg-green-600 h-16 animate-pulse"></div>
    );
  }

  return (
    <nav className="bg-green-600 text-white p-4 flex justify-between items-center shadow-lg">
      {/* Logo */}
      <Link to="/home" className="text-2xl font-bold hover:text-yellow-300">
        Saba Chips 🍌
      </Link>

      {/* Right side - DYNAMIC based on login */}
      <div className="flex items-center space-x-4">
        
        {/* Always show Home */}
        <Link 
          to="/home" 
          className="hover:text-yellow-300 font-medium transition-colors"
        >
          Home
        </Link>

        {/* LOGGED IN = Profile + Logout */}
        {user ? (
          <>
            <Link 
              to="/profile" 
              className="hover:text-yellow-300 font-medium transition-colors"
            >
              Profile
            </Link>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Logout
            </button>
          </>
        ) : (
          /* NOT LOGGED IN = Login + Register */
          <>
            <Link 
              to="/login" 
              className="hover:text-yellow-300 font-medium transition-colors"
            >
              Login
            </Link>
            
            <Link
              to="/register"
              className="bg-yellow-400 text-green-900 px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;