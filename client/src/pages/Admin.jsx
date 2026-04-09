import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllUsers, updateUser, deleteUser } from "../assets/services/adminService.js";
import { getMe } from "../assets/services/authService.js";
import { getAllOrders } from "../assets/services/orderService.js";
import { useProducts } from "../context/ProductContext.jsx";

function Admin() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminName, setAdminName] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const { products, refreshProducts } = useProducts();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const me = await getMe();
      if (me?.user?.name) {
        setAdminName(me.user.name);
      }

      const { users } = await getAllUsers();
      setUsers(users || []);

      await refreshProducts();

      try {
        const allOrders = await getAllOrders();
        setOrders(allOrders || []);
      } catch (err) {
        console.error("Failed to fetch admin orders:", err);
      }

      setMessage("");
    } catch (err) {
      setMessage("❌ Admin access required. Please login as admin@sabachips.com");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email });
    setMessage("");
  };

  const handleUpdate = async (id) => {
    try {
      await updateUser(id, editForm);
      setMessage("✅ User updated successfully!");
      setEditingId(null);
      loadAdminData();
    } catch (err) {
      setMessage("❌ Update failed!");
    }
  };

  const handleDelete = async (id) => {
    if (confirm(`Delete user ID ${id}? This cannot be undone.`)) {
      try {
        await deleteUser(id);
        setMessage("✅ User deleted successfully!");
        loadAdminData();
      } catch (err) {
        setMessage("❌ Delete failed!");
      }
    }
  };

  const totalUsers = users.length;
  const totalProducts = products.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const lowStockProducts = products.filter(
    (p) => Number(p.stock) > 0 && Number(p.stock) <= 5
  ).length;
  const outOfStockProducts = products.filter(
    (p) => Number(p.stock) <= 0
  ).length;
  const totalSales = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

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
        {/* Hero */}
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

        {/* Message */}
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Total Users</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">{totalUsers}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Total Products</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">{totalProducts}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Pending Orders</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">{pendingOrders}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Low / Out of Stock</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">
              {lowStockProducts + outOfStockProducts}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Total Sales</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">
              ₱{totalSales.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* Shortcuts + Insights */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-lg border border-[#ead7b8]">
            <h2 className="text-2xl font-black text-[#8b5e34] mb-6">
              Quick Shortcuts
            </h2>

            <div className="grid sm:grid-cols-2 gap-5">
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

              <button
                onClick={loadAdminData}
                className="text-left rounded-2xl p-6 bg-[#fff7eb] border border-[#ead7b8] hover:shadow-md transition"
              >
                <div className="text-3xl mb-3">🔄</div>
                <h3 className="text-xl font-bold text-[#8b5e34] mb-2">
                  Refresh Dashboard
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
              Store Insights
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#fff7eb] rounded-2xl px-4 py-4">
                <span className="text-[#6d4c2f] font-medium">Pending Orders</span>
                <span className="font-black text-blue-600">{pendingOrders}</span>
              </div>

              <div className="flex justify-between items-center bg-[#fff7eb] rounded-2xl px-4 py-4">
                <span className="text-[#6d4c2f] font-medium">Low Stock</span>
                <span className="font-black text-yellow-600">{lowStockProducts}</span>
              </div>

              <div className="flex justify-between items-center bg-[#fff7eb] rounded-2xl px-4 py-4">
                <span className="text-[#6d4c2f] font-medium">Out of Stock</span>
                <span className="font-black text-red-600">{outOfStockProducts}</span>
              </div>

              <div className="flex justify-between items-center bg-[#fff7eb] rounded-2xl px-4 py-4">
                <span className="text-[#6d4c2f] font-medium">Users</span>
                <span className="font-black text-[#8b5e34]">{totalUsers}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#ead7b8]">
          <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] p-6 text-white">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="text-3xl font-black">👥 User Management</h2>
              <div className="w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-80 p-3 rounded-2xl text-gray-800 border-none outline-none"
                />
              </div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-[#8b5e34] mb-2">
                {search ? "No matching users" : "No users found"}
              </h3>
              <p className="text-[#6d4c2f]">Try adjusting your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#fff7eb]">
                  <tr>
                    <th className="px-8 py-5 text-left text-lg font-bold text-[#8b5e34]">ID</th>
                    <th className="px-8 py-5 text-left text-lg font-bold text-[#8b5e34]">Name</th>
                    <th className="px-8 py-5 text-left text-lg font-bold text-[#8b5e34]">Email</th>
                    <th className="px-8 py-5 text-left text-lg font-bold text-[#8b5e34]">Joined</th>
                    <th className="px-8 py-5 text-center text-lg font-bold text-[#8b5e34]">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-[#f1e3ca] hover:bg-[#fffaf2] transition">
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center px-4 py-2 bg-[#f5e4c9] text-[#8b5e34] text-sm font-bold rounded-full">
                          {user.id}
                        </span>
                      </td>

                      <td className="px-8 py-5">
                        {editingId === user.id ? (
                          <input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="w-64 p-3 border border-[#d8be96] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d6b585]"
                            placeholder="Enter name"
                          />
                        ) : (
                          <span className="font-bold text-lg text-gray-900">
                            {user.name}
                          </span>
                        )}
                      </td>

                      <td className="px-8 py-5">
                        {editingId === user.id ? (
                          <input
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm({ ...editForm, email: e.target.value })
                            }
                            className="w-80 p-3 border border-[#d8be96] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d6b585]"
                            type="email"
                            placeholder="Enter email"
                          />
                        ) : (
                          <span className="text-sm text-gray-700 font-mono bg-[#f8f2e8] px-4 py-2 rounded-xl">
                            {user.email}
                          </span>
                        )}
                      </td>

                      <td className="px-8 py-5">
                        <span className="text-sm text-green-700 font-bold bg-green-100 px-4 py-2 rounded-full">
                          {new Date(user.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>

                      <td className="px-8 py-5">
                        {editingId === user.id ? (
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                              onClick={() => handleUpdate(user.id)}
                              className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-gray-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-600 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(user)}
                              className="bg-[#8b5e34] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#714a28] transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="bg-red-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-red-600 transition"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-center mt-12 text-[#7a5331]">
          <p>Admin Panel • Saba Chips</p>
        </div>
      </div>
    </div>
  );
}

export default Admin;