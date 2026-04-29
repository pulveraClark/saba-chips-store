import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMe } from "../assets/services/authService.js";
import { getAllUsers, getAdminSummary } from "../assets/services/adminService.js";
import { useProducts } from "../context/ProductContext.jsx";

const iconPaths = {
  alert: "M12 9v4m0 4h.01M10.3 4.3 2 19h20L13.7 4.3a2 2 0 0 0-3.4 0Z",
  box: "M4 7l8-4 8 4-8 4-8-4Zm0 5 8 4 8-4M4 17l8 4 8-4",
  chart: "M5 19V5m0 14h14M9 16V9m4 7V6m4 10v-4",
  home: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z",
  orders: "M6 3h12l2 5v13H4V8l2-5Zm-2 5h16M9 12h6",
  refresh: "M20 11a8 8 0 0 0-14.9-4M4 5v5h5m-5 3a8 8 0 0 0 14.9 4M20 19v-5h-5",
  sales: "M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
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

function Admin() {
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  });
  const [adminName, setAdminName] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const { refreshProducts } = useProducts();

  useEffect(() => {
    loadAdminData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAdminData = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const me = await getMe();
      if (me?.user?.name) {
        setAdminName(me.user.name);
      }

      const [, summaryData] = await Promise.all([
        getAllUsers(),
        getAdminSummary(),
      ]);

      setSummary(summaryData || {});
      await refreshProducts();

      if (!isInitialLoad) {
        setMessage("Dashboard refreshed successfully.");
        setTimeout(() => setMessage(""), 2500);
      } else {
        setMessage("");
      }
    } catch {
      setMessage("Admin access required. Please login as admin@sabachips.com");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const stockRisk =
    Number(summary.lowStockProducts || 0) + Number(summary.outOfStockProducts || 0);
  const activeOrders =
    Number(summary.paymentVerificationOrders || 0) +
    Number(summary.pendingOrders || 0) +
    Number(summary.confirmedOrders || 0) +
    Number(summary.preparingOrders || 0) +
    Number(summary.outForDeliveryOrders || 0);

  const metrics = [
    ["Pending Orders", summary.pendingOrders, "orders", "orders"],
    ["Active Orders", activeOrders, "need attention", "alert"],
    ["Stock Alerts", stockRisk, "low or out", "box"],
    [
      "Delivered Sales",
      `PHP ${Number(summary.totalSales || 0).toLocaleString()}`,
      "completed orders",
      "sales",
    ],
  ];

  const quickActions = [
    {
      to: "/admin-orders",
      icon: "orders",
      title: "Process Orders",
      text: "Confirm pending orders and update delivery status.",
      highlight: Number(summary.pendingOrders || 0) > 0,
    },
    {
      to: "/admin-products",
      icon: "box",
      title: "Update Products",
      text: "Adjust stock, prices, descriptions, and product photos.",
      highlight: stockRisk > 0,
    },
    {
      to: "/admin-reports",
      icon: "chart",
      title: "Review Reports",
      text: "Check sales, transactions, and top product performance.",
    },
    {
      to: "/admin-users",
      icon: "users",
      title: "Manage Customers",
      text: "Review user accounts and customer information.",
    },
    {
      to: "/home",
      icon: "home",
      title: "View Storefront",
      text: "Open the customer-facing shopping experience.",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8]">
        <div className="rounded-2xl border border-[#ead7b8] bg-white px-6 py-4 text-xl font-black text-[#8b5e34] shadow-sm">
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-[2rem] border border-[#d8be96] bg-[#5f432c] p-8 text-white shadow-xl md:p-10">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-[#ffe2ad]">
              Store Operations
            </p>
            <h1 className="mb-3 text-4xl font-black md:text-5xl">
              Welcome back, {adminName}
            </h1>
            <p className="max-w-2xl text-[#fff1df]">
              Start with orders, stock, and sales. These are the daily signals
              that keep the store ready for real customers.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#ead7b8] bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#9a7654]">
              Today first
            </p>
            <h2 className="mb-4 text-2xl font-black text-[#5f432c]">
              Operations queue
            </h2>
            <div className="space-y-3 text-sm text-[#6d4c2f]">
              <p>
                <span className="font-black text-[#8b5e34]">
                  {summary.pendingOrders || 0}
                </span>{" "}
                pending order(s) to confirm.
              </p>
              <p>
                <span className="font-black text-[#8b5e34]">{stockRisk}</span>{" "}
                product stock alert(s).
              </p>
              <button
                onClick={() => loadAdminData(false)}
                disabled={refreshing}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#8b5e34] px-5 py-3 font-black text-white transition hover:bg-[#714a28] disabled:opacity-60"
              >
                <Icon
                  name="refresh"
                  className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mx-auto mb-8 max-w-3xl rounded-2xl p-4 text-center font-black shadow-sm ${
              message.includes("successfully")
                ? "border border-green-300 bg-green-100 text-green-800"
                : "border border-red-300 bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value, helper, icon]) => (
            <div
              key={label}
              className="rounded-[1.5rem] border border-[#ead7b8] bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1dfc2] text-[#8b5e34]">
                <Icon name={icon} />
              </div>
              <p className="mb-2 text-sm font-bold text-[#7a5331]">{label}</p>
              <h2 className="text-4xl font-black text-[#5f432c]">{value}</h2>
              <p className="mt-2 text-sm text-[#9a7654]">{helper}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2rem] border border-[#ead7b8] bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-[#9a7654]">
                  Daily actions
                </p>
                <h2 className="text-3xl font-black text-[#5f432c]">
                  Run the store
                </h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className={`rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-md ${
                    action.highlight
                      ? "border-[#e8c475] bg-[#fff6da]"
                      : "border-[#ead7b8] bg-[#fff7eb]"
                  }`}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#8b5e34] shadow-sm">
                    <Icon name={action.icon} />
                  </div>
                  <h3 className="mb-2 text-xl font-black text-[#5f432c]">
                    {action.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#6d4c2f]">
                    {action.text}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#ead7b8] bg-white p-6 shadow-sm md:p-8">
            <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-[#9a7654]">
              Status overview
            </p>
            <h2 className="mb-6 text-3xl font-black text-[#5f432c]">
              Orders by stage
            </h2>

            <div className="space-y-4">
              {[
                ["Payment Check", summary.paymentVerificationOrders || 0, "bg-orange-50", "text-orange-700"],
                ["Pending", summary.pendingOrders || 0, "bg-[#fff6da]", "text-[#8b5e34]"],
                ["Confirmed", summary.confirmedOrders || 0, "bg-blue-50", "text-blue-700"],
                ["Preparing", summary.preparingOrders || 0, "bg-cyan-50", "text-cyan-700"],
                ["Out for Delivery", summary.outForDeliveryOrders || 0, "bg-indigo-50", "text-indigo-700"],
                ["Delivered", summary.deliveredOrders || 0, "bg-green-50", "text-green-700"],
                ["Cancelled", summary.cancelledOrders || 0, "bg-red-50", "text-red-700"],
              ].map(([label, value, bg, text]) => (
                <div
                  key={label}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 ${bg}`}
                >
                  <span className={`font-black ${text}`}>{label}</span>
                  <span className={`text-2xl font-black ${text}`}>{value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="mt-12 text-center text-[#7a5331]">
          <p>Admin Panel - Saba Chips</p>
        </div>
      </div>
    </div>
  );
}

export default Admin;
