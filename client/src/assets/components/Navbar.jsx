import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { logoutUser } from "../services/authService.js";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService.js";
import { getConversations } from "../services/chatService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";

function Navbar() {
  const navigate = useNavigate();
  const { cartCount, refreshCartCount } = useCart();
  const { user, setUser, loading, isAdmin } = useAuth();
  const { notify } = useNotification();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const fetchMessageUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const conversations = await getConversations();
      const totalUnread = (conversations || []).reduce(
        (sum, conversation) =>
          sum + (Number(conversation.unread_count || 0) > 0 ? 1 : 0),
        0
      );
      setMessageUnreadCount(totalUnread);
    } catch {
      setMessageUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const firstLoad = window.setTimeout(fetchNotifications, 0);
    const timer = window.setInterval(fetchNotifications, 5000);
    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(timer);
    };
  }, [fetchNotifications, user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const firstLoad = window.setTimeout(fetchMessageUnreadCount, 0);
    const timer = window.setInterval(fetchMessageUnreadCount, 3000);
    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(timer);
    };
  }, [fetchMessageUnreadCount, user]);

  const handleNotificationClick = async (notification) => {
    try {
      await markNotificationRead(notification.id);
      await fetchNotifications();
    } catch {
      // Keep navigation available even if read status update fails.
    }

    setNotificationsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead();
      await fetchNotifications();
    } catch {
      notify({
        type: "error",
        title: "Notification update failed",
        message: "Could not mark notifications as read.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      await refreshCartCount();
      notify({
        type: "success",
        title: "Logged Out",
        message: "You have been signed out successfully.",
      });
      navigate("/login");
    } catch {
      notify({
        type: "error",
        title: "Logout Failed",
        message: "We could not log you out right now.",
      });
      navigate("/login");
    }
    setDropdownOpen(false);
  };

  const closeMenus = () => {
    setDropdownOpen(false);
    setNotificationsOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-md h-16 border-b border-gray-200 shadow-sm"></div>
    );
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            to={isAdmin ? "/admin" : "/home"}
            onClick={closeMenus}
            className="text-2xl font-bold text-gray-900 hover:text-green-600 transition-colors"
          >
            Saba Chips
          </Link>

          <div className="flex items-center space-x-6">
            {!isAdmin && (
              <Link
                to="/home"
                onClick={closeMenus}
                className="text-lg font-medium text-gray-700 hover:text-green-600 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                title="Home"
              >
                Home
              </Link>
            )}

            {user && (
              <Link
                to="/messages"
                onClick={() => {
                  closeMenus();
                  setMessageUnreadCount(0);
                }}
                className="relative text-xl font-medium text-gray-700 hover:text-green-600 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                title="Messages"
              >
                💬
                {messageUnreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                    {messageUnreadCount > 9 ? "9+" : messageUnreadCount}
                  </span>
                )}
              </Link>
            )}

            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen((open) => !open);
                    setDropdownOpen(false);
                    void fetchNotifications();
                  }}
                  className="relative text-lg font-medium text-gray-700 hover:text-green-600 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                  title="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <p className="font-black text-gray-900">Notifications</p>
                      <button
                        onClick={handleReadAll}
                        className="text-xs font-bold text-green-700 hover:text-green-900"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                              notification.is_read ? "bg-white" : "bg-green-50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`mt-1 h-2 w-2 rounded-full ${
                                  notification.is_read ? "bg-gray-300" : "bg-green-600"
                                }`}
                              ></span>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isAdmin && (
              <Link
                to="/cart"
                onClick={closeMenus}
                className="relative text-xl font-medium text-gray-700 hover:text-green-600 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                title="Shopping Cart"
              >
                🛒

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
                  onClick={() => {
                    setDropdownOpen(!dropdownOpen);
                    setNotificationsOpen(false);
                  }}
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
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 z-50">
                    {isAdmin ? (
                      <>
                        <Link
                          to="/admin"
                          className="block px-6 py-3 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-t-lg font-semibold transition-colors border-l-4 border-blue-500"
                          onClick={closeMenus}
                        >
                          🏠 Admin Hub
                        </Link>

                        <Link
                          to="/admin-reports"
                          className="block px-6 py-3 text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold transition-colors border-l-4 border-amber-500"
                          onClick={closeMenus}
                        >
                          📊 Reports & Insights
                        </Link>

                        <Link
                          to="/admin-users"
                          className="block px-6 py-3 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold transition-colors border-l-4 border-indigo-500"
                          onClick={closeMenus}
                        >
                          👥 Manage Users
                        </Link>

                        <Link
                          to="/admin-orders"
                          className="block px-6 py-3 text-green-700 bg-green-50 hover:bg-green-100 font-semibold transition-colors border-l-4 border-green-500"
                          onClick={closeMenus}
                        >
                          📦 Manage Orders
                        </Link>

                        <Link
                          to="/admin-products"
                          className="block px-6 py-3 text-purple-700 bg-purple-50 hover:bg-purple-100 font-semibold transition-colors border-l-4 border-purple-500"
                          onClick={closeMenus}
                        >
                          🛍️ Manage Products
                        </Link>
                      </>
                    ) : (
                      <Link
                        to="/profile"
                        className="block px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-t-lg font-medium transition-colors"
                        onClick={closeMenus}
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
                  onClick={closeMenus}
                  className="text-lg font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenus}
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
