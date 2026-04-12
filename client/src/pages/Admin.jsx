import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMe } from "../assets/services/authService.js";
import { getAllUsers, getAdminSummary } from "../assets/services/adminService.js";
import { useProducts } from "../context/ProductContext.jsx";

function Admin() {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
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

      const [{ users }, summaryData] = await Promise.all([
        getAllUsers(),
        getAdminSummary(),
      ]);

      setUsers(users || []);
      setSummary(summaryData || {});
      await refreshProducts();

      if (!isInitialLoad) {
        setMessage("✅ Dashboard refreshed successfully!");
        setTimeout(() => setMessage(""), 2500);
      } else {
        setMessage("");
      }
    } catch (err) {
      setMessage("❌ Admin access required. Please login as admin@sabachips.com");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f8f2e8]">
        <div className="text-2xl text-[#8b5e34] animate-pulse">
          Loading Admin Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] rounded-[2rem] p-8 md:p-10 shadow-xl text-white mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-[#f6e7d0] mb-3">
            Admin Dashboard
          </p>
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            Welcome back, {adminName}
          </h1>
          <p className="text-[#fff1df] text-lg max-w-2xl">
            Manage your store, monitor products and orders, and keep everything
            running smoothly from one place.
          </p>
        </div>

        {message && (
          <div
            className={`mx-auto max-w-3xl p-4 rounded-2xl shadow-md mb-8 text-center font-semibold ${
              message.includes("✅")
                ? "bg-green-100 border border-green-300 text-green-800"
                : "bg-red-100 border border-red-300 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Total Users</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">{summary.totalUsers}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Total Products</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">{summary.totalProducts}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Pending Orders</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">{summary.pendingOrders}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Low / Out of Stock</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">
              {Number(summary.lowStockProducts || 0) + Number(summary.outOfStockProducts || 0)}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Delivered Sales</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">
              ₱{Number(summary.totalSales || 0).toLocaleString()}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#ead7b8] mb-8">
          <h2 className="text-2xl font-black text-[#8b5e34] mb-6">
            Quick Shortcuts
          </h2>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <Link
              to="/admin-users"
              className="rounded-2xl p-6 bg-[#fff7eb] border border-[#ead7b8] hover:shadow-md transition"
            >
              <div className="text-3xl mb-3">👥</div>
              <h3 className="text-xl font-bold text-[#8b5e34] mb-2">
                Manage Users
              </h3>
              <p className="text-[#6d4c2f]">
                View, edit, and remove registered users.
              </p>
            </Link>

            <Link
              to="/admin-products"
              className="rounded-2xl p-6 bg-[#fff7eb] border border-[#ead7b8] hover:shadow-md transition"
            >
              <div className="text-3xl mb-3">🛍️</div>
              <h3 className="text-xl font-bold text-[#8b5e34] mb-2">
                Manage Products
              </h3>
              <p className="text-[#6d4c2f]">
                Add, edit, update stock, images, and descriptions.
              </p>
            </Link>

            <Link
              to="/admin-orders"
              className="rounded-2xl p-6 bg-[#fff7eb] border border-[#ead7b8] hover:shadow-md transition"
            >
              <div className="text-3xl mb-3">📦</div>
              <h3 className="text-xl font-bold text-[#8b5e34] mb-2">
                Manage Orders
              </h3>
              <p className="text-[#6d4c2f]">
                Track, update, and process customer orders.
              </p>
            </Link>

            <Link
              to="/admin-reports"
              className="rounded-2xl p-6 bg-[#fff7eb] border border-[#ead7b8] hover:shadow-md transition"
            >
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-xl font-bold text-[#8b5e34] mb-2">
                Reports & Insights
              </h3>
              <p className="text-[#6d4c2f]">
                View summary reports and transaction history.
              </p>
            </Link>

            <button
              onClick={() => loadAdminData(false)}
              disabled={refreshing}
              className="text-left rounded-2xl p-6 bg-[#fff7eb] border border-[#ead7b8] hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className={`text-3xl mb-3 ${refreshing ? "animate-spin" : ""}`}>
                🔄
              </div>
              <h3 className="text-xl font-bold text-[#8b5e34] mb-2">
                {refreshing ? "Refreshing..." : "Refresh Dashboard"}
              </h3>
              <p className="text-[#6d4c2f]">
                Reload users, products, and orders instantly.
              </p>
            </button>

            <Link
              to="/home"
              className="rounded-2xl p-6 bg-[#fff7eb] border border-[#ead7b8] hover:shadow-md transition"
            >
              <div className="text-3xl mb-3">🏪</div>
              <h3 className="text-xl font-bold text-[#8b5e34] mb-2">
                View Store
              </h3>
              <p className="text-[#6d4c2f]">
                Preview the customer-facing homepage and products.
              </p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#ead7b8]">
          <h2 className="text-2xl font-black text-[#8b5e34] mb-6">
            Order Status Overview
          </h2>

          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-200">
              <p className="text-sm text-yellow-700 mb-2">Pending</p>
              <h3 className="text-3xl font-black text-yellow-700">{summary.pendingOrders || 0}</h3>
            </div>

            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
              <p className="text-sm text-blue-700 mb-2">Confirmed</p>
              <h3 className="text-3xl font-black text-blue-700">{summary.confirmedOrders || 0}</h3>
            </div>

            <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
              <p className="text-sm text-purple-700 mb-2">Shipped</p>
              <h3 className="text-3xl font-black text-purple-700">{summary.shippedOrders || 0}</h3>
            </div>

            <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
              <p className="text-sm text-green-700 mb-2">Delivered</p>
              <h3 className="text-3xl font-black text-green-700">{summary.deliveredOrders || 0}</h3>
            </div>

            <div className="bg-red-50 rounded-2xl p-5 border border-red-200">
              <p className="text-sm text-red-700 mb-2">Cancelled</p>
              <h3 className="text-3xl font-black text-red-700">{summary.cancelledOrders || 0}</h3>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 text-[#7a5331]">
          <p>Admin Panel • Saba Chips</p>
        </div>
      </div>
    </div>
  );
}

export default Admin;