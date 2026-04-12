import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAllOrders,
  updateOrderStatus,
} from "../assets/services/orderService.js";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [page, setPage] = useState(1);

  const ORDERS_PER_PAGE = 5;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const data = await getAllOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const paginatedOrders = orders.slice(
    (page - 1) * ORDERS_PER_PAGE,
    page * ORDERS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f2e8]">
        <div className="text-2xl text-[#8b5e34] animate-pulse">
          Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] rounded-[2rem] p-8 text-white shadow-xl mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                to="/admin"
                className="inline-block text-[#fff1df] hover:text-white mb-4"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl md:text-5xl font-black mb-3">
                Order Management
              </h1>
              <p className="text-[#fff1df] text-lg max-w-2xl">
                Track, review, and update the status of customer orders.
              </p>
            </div>

            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="px-4 py-3 rounded-2xl bg-white text-[#8b5e34] font-bold hover:bg-[#f8f2e8] disabled:opacity-60"
            >
              {refreshing ? "↻..." : "↻"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#ead7b8]">
          <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] p-6 text-white">
            <h2 className="text-3xl font-black">📦 Orders</h2>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-20 text-[#6d4c2f]">
              No orders found.
            </div>
          ) : (
            <>
              <div className="space-y-6 p-6">
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#fffaf2] border border-[#ead7b8] rounded-3xl p-6 shadow-sm"
                  >
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Order ID</p>
                        <p className="font-black text-[#8b5e34] text-xl">
                          #{order.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Customer</p>
                        <p className="font-semibold text-gray-900">
                          {order.customer_name}
                        </p>
                        <p className="text-sm text-[#6d4c2f]">
                          {order.customer_email}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Total</p>
                        <p className="font-black text-[#8b5e34] text-xl">
                          ₱{Number(order.total).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Date</p>
                        <p className="font-medium text-[#6d4c2f]">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-5">
                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Address</p>
                        <p className="text-[#6d4c2f]">{order.address}</p>
                      </div>

                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Phone</p>
                        <p className="text-[#6d4c2f]">{order.phone}</p>
                      </div>

                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Payment</p>
                        <p className="text-[#6d4c2f]">{order.payment_method}</p>
                      </div>
                    </div>

                    <div className="mb-5">
                      <p className="text-sm text-[#7a5331] mb-3">Ordered Items</p>
                      <div className="flex flex-wrap gap-2">
                        {order.items?.map((item, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-2 rounded-full bg-[#f5e4c9] text-[#8b5e34] text-sm font-semibold"
                          >
                            {item.product_name} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-sm text-[#7a5331] mb-2">Current Status</p>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${
                            order.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "confirmed"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "shipped"
                              ? "bg-purple-100 text-purple-700"
                              : order.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          disabled={updatingId === order.id}
                          className="border border-[#d8be96] bg-white rounded-2xl px-4 py-3 text-[#6d4c2f] font-medium"
                        >
                          <option value="pending">pending</option>
                          <option value="confirmed">confirmed</option>
                          <option value="shipped">shipped</option>
                          <option value="delivered">delivered</option>
                          <option value="cancelled">cancelled</option>
                        </select>

                        {updatingId === order.id && (
                          <span className="text-sm text-[#7a5331]">
                            Updating...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#f1e3ca] bg-[#fffaf2]">
                <p className="text-[#6d4c2f] font-medium">
                  Page {page} of {totalPages} • {orders.length} total orders
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="px-5 py-2 rounded-xl bg-[#8b5e34] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>

                  <button
                    onClick={() =>
                      setPage((prev) => (prev < totalPages ? prev + 1 : prev))
                    }
                    disabled={page >= totalPages}
                    className="px-5 py-2 rounded-xl bg-[#8b5e34] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminOrders;