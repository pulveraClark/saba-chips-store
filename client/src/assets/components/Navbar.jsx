import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMe, logoutUser } from "../services/authService.js";
import { useCart } from "../../context/CartContext.jsx";

function Navbar() {
  const navigate = useNavigate();
  const { cartCount, refreshCartCount } = useCart();

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

      if (data.user) {
        await refreshCartCount();
      }
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
      window.location.reload();
    } catch (err) {
      navigate("/login");
    }
    setDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-md h-16 border-b border-gray-200 shadow-sm"></div>
    );
  }

  const isAdmin = user?.email === "admin@sabachips.com";

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/home"
            className="text-2xl font-bold text-gray-900 hover:text-green-600 transition-colors"
          >
            Saba Chips
          </Link>

          <div className="flex items-center space-x-6">
            {!isAdmin && (
              <Link
                to="/home"
                className="text-lg font-medium text-gray-700 hover:text-green-600 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                Home
              </Link>
            )}

            {!isAdmin && (
              <Link
                to="/cart"
                className="relative text-lg font-medium text-gray-700 hover:text-green-600 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                title="Shopping Cart"
              >
                🛒 Cart

                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-lg font-medium text-gray-700 hover:text-gray-900 p-2 -m-2 rounded hover:bg-gray-100 transition-colors"
                >
                  <span>
                    {isAdmin
                      ? "Admin"
                      : user.name?.split(" ")[0] || "Profile"}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 z-50">
                    {isAdmin ? (
                      <>
                        <Link
                          to="/admin"
                          className="block px-6 py-3 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-t-lg font-semibold transition-colors border-l-4 border-blue-500"
                          onClick={() => setDropdownOpen(false)}
                        >
                          👥 Manage Users
                        </Link>

                        <Link
                          to="/admin-products"
                          className="block px-6 py-3 text-purple-700 bg-purple-50 hover:bg-purple-100 font-semibold transition-colors border-l-4 border-purple-500"
                          onClick={() => setDropdownOpen(false)}
                        >
                          🛍️ Manage Products
                        </Link>

                        <Link
                          to="/admin-orders"
                          className="block px-6 py-3 text-green-700 bg-green-50 hover:bg-green-100 font-semibold transition-colors border-l-4 border-green-500"
                          onClick={() => setDropdownOpen(false)}
                        >
                          📦 Manage Orders
                        </Link>
                      </>
                    ) : (
                      <Link
                        to="/profile"
                        className="block px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-t-lg font-medium transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        👤 My Profile
                      </Link>
                    )}

                    <div className="border-t border-gray-200 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-6 py-3 text-red-600 hover:bg-red-50 rounded-b-lg font-medium transition-colors"
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