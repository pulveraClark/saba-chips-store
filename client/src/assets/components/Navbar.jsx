import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
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

const iconPaths = {
  bell: "M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0",
  cart: "M6 6h15l-2 8H8L6 3H3m6 15a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  chevron: "m6 9 6 6 6-6",
  home: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z",
  logout: "M10 17l5-5-5-5m5 5H3m7-9h8a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-8",
  messages: "M21 12a8 8 0 0 1-8 8H6l-3 2 1.2-4A8 8 0 1 1 21 12Z",
  orders: "M6 3h12l2 5v13H4V8l2-5Zm-2 5h16M9 12h6",
  products: "M4 7l8-4 8 4-8 4-8-4Zm0 5 8 4 8-4M4 17l8 4 8-4",
  profile: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  reports: "M5 19V5m0 14h14M9 16V9m4 7V6m4 10v-4",
  users: "M16 21a6 6 0 0 0-12 0m8-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm8 13a5 5 0 0 0-5-5m1-8a3 3 0 1 1-6 0",
};

function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

function Badge({ count, tone = "warm" }) {
  if (!count) return null;

  return (
    <span
      className={`absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-black leading-none text-white shadow-sm ${
        tone === "green" ? "bg-[#6f8f3d]" : "bg-[#c85f35]"
      }`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

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
    if (!user) return undefined;

    const firstLoad = window.setTimeout(fetchNotifications, 0);
    const timer = window.setInterval(fetchNotifications, 5000);
    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(timer);
    };
  }, [fetchNotifications, user]);

  useEffect(() => {
    if (!user) return undefined;

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
      <div className="h-20 border-b border-[#ead7b8] bg-[#fffaf2]/90 shadow-sm backdrop-blur-md"></div>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[#ead7b8] bg-[#fffaf2]/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link
            to={isAdmin ? "/admin" : "/home"}
            onClick={closeMenus}
            className="group inline-flex items-center gap-3 self-start rounded-full pr-4 transition"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8b5e34] text-sm font-black tracking-wide text-white shadow-md transition group-hover:bg-[#714a28]">
              SC
            </span>
            <span>
              <span className="block text-xl font-black leading-tight text-[#5f432c]">
                Saba Chips
              </span>
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[#9a7654]">
                Fresh Chips
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {!isAdmin && (
              <NavLink
                to="/home"
                onClick={closeMenus}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                    isActive
                      ? "bg-[#8b5e34] text-white shadow-md"
                      : "text-[#6d4c2f] hover:bg-[#f3e3c9] hover:text-[#5f432c]"
                  }`
                }
                title="Home"
              >
                <Icon name="home" className="h-4 w-4" />
                Home
              </NavLink>
            )}

            {user && (
              <Link
                to="/messages"
                onClick={() => {
                  closeMenus();
                  setMessageUnreadCount(0);
                }}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ead7b8] bg-white text-[#6d4c2f] shadow-sm transition hover:border-[#d6b585] hover:bg-[#fff4df] hover:text-[#5f432c]"
                title="Messages"
                aria-label="Messages"
              >
                <Icon name="messages" />
                <Badge count={messageUnreadCount} />
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
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ead7b8] bg-white text-[#6d4c2f] shadow-sm transition hover:border-[#d6b585] hover:bg-[#fff4df] hover:text-[#5f432c]"
                  title="Notifications"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                >
                  <Icon name="bell" />
                  <Badge count={unreadCount} />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-[#ead7b8] bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[#f1dfc2] bg-[#fffaf2] px-4 py-3">
                      <p className="font-black text-[#5f432c]">Notifications</p>
                      <button
                        onClick={handleReadAll}
                        className="rounded-full px-3 py-1 text-xs font-bold text-[#8b5e34] hover:bg-[#f3e3c9]"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-[#9a7654]">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full border-b border-[#f4e8d4] px-4 py-3 text-left transition hover:bg-[#fff7eb] ${
                              notification.is_read ? "bg-white" : "bg-[#fdf0d6]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`mt-1 h-2 w-2 rounded-full ${
                                  notification.is_read
                                    ? "bg-[#d8be96]"
                                    : "bg-[#8b5e34]"
                                }`}
                              ></span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[#5f432c]">
                                  {notification.title}
                                </p>
                                <p className="line-clamp-2 text-sm text-[#7a5331]">
                                  {notification.message}
                                </p>
                                <p className="mt-1 text-xs text-[#a58462]">
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
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ead7b8] bg-white text-[#6d4c2f] shadow-sm transition hover:border-[#d6b585] hover:bg-[#fff4df] hover:text-[#5f432c]"
                title="Shopping Cart"
                aria-label="Shopping cart"
              >
                <Icon name="cart" />
                <Badge count={cartCount} tone="green" />
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setDropdownOpen(!dropdownOpen);
                    setNotificationsOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-[#ead7b8] bg-white py-1.5 pl-2 pr-3 text-sm font-bold text-[#5f432c] shadow-sm transition hover:border-[#d6b585] hover:bg-[#fff4df]"
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1dfc2] text-xs font-black uppercase text-[#8b5e34]">
                    {isAdmin ? "A" : user.name?.charAt(0) || "P"}
                  </span>
                  <span className="max-w-28 truncate">
                    {isAdmin
                      ? "Admin"
                      : user.name?.split(" ")[0] || "Profile"}
                  </span>
                  <Icon
                    name="chevron"
                    className={`h-4 w-4 transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-[#ead7b8] bg-white p-2 shadow-2xl">
                    {isAdmin ? (
                      <>
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[#5f432c] transition hover:bg-[#fff7eb]"
                          onClick={closeMenus}
                        >
                          <Icon name="home" className="h-5 w-5 text-[#8b5e34]" />
                          Admin Hub
                        </Link>

                        <Link
                          to="/admin-reports"
                          className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[#5f432c] transition hover:bg-[#fff7eb]"
                          onClick={closeMenus}
                        >
                          <Icon name="reports" className="h-5 w-5 text-[#8b5e34]" />
                          Reports & Insights
                        </Link>

                        <Link
                          to="/admin-users"
                          className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[#5f432c] transition hover:bg-[#fff7eb]"
                          onClick={closeMenus}
                        >
                          <Icon name="users" className="h-5 w-5 text-[#8b5e34]" />
                          Manage Users
                        </Link>

                        <Link
                          to="/admin-orders"
                          className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[#5f432c] transition hover:bg-[#fff7eb]"
                          onClick={closeMenus}
                        >
                          <Icon name="orders" className="h-5 w-5 text-[#8b5e34]" />
                          Manage Orders
                        </Link>

                        <Link
                          to="/admin-products"
                          className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[#5f432c] transition hover:bg-[#fff7eb]"
                          onClick={closeMenus}
                        >
                          <Icon
                            name="products"
                            className="h-5 w-5 text-[#8b5e34]"
                          />
                          Manage Products
                        </Link>
                      </>
                    ) : (
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[#5f432c] transition hover:bg-[#fff7eb]"
                        onClick={closeMenus}
                      >
                        <Icon name="profile" className="h-5 w-5 text-[#8b5e34]" />
                        My Profile
                      </Link>
                    )}

                    <div className="my-2 border-t border-[#f1dfc2]"></div>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold text-[#b6402e] transition hover:bg-[#fff0ec]"
                    >
                      <Icon name="logout" className="h-5 w-5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenus}
                  className="rounded-full px-4 py-2 text-sm font-bold text-[#6d4c2f] transition hover:bg-[#f3e3c9] hover:text-[#5f432c]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenus}
                  className="rounded-full bg-[#8b5e34] px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#714a28]"
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
