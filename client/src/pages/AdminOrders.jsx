import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAllOrders,
  reviewCancellationRequest,
  updateOrderStatus,
} from "../assets/services/orderService.js";
import OrderTimeline from "../assets/components/OrderTimeline.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import { sortByNewest } from "../utils/sortByNewest.js";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [page, setPage] = useState(1);
  const { notify } = useNotification();

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
      notify({
        type: "success",
        title: "Order Updated",
        message: `Order #${orderId} is now marked as ${newStatus}.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Update Failed",
        message: err?.response?.data?.message || "Failed to update order status",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReviewCancellation = async (requestId, decision) => {
    try {
      setReviewingRequestId(requestId);
      await reviewCancellationRequest(requestId, decision, adminNotes[requestId] || "");
      await fetchOrders();
      notify({
        type: "success",
        title: "Request reviewed",
        message: `Cancellation request was ${decision}.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Review Failed",
        message: err?.response?.data?.message || "Failed to review cancellation request",
      });
    } finally {
      setReviewingRequestId(null);
    }
  };

  const sortedOrders = sortByNewest(orders);
  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = sortedOrders.slice(
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

                    {order.cancellation_request && (
                      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">
                              Cancellation Request
                            </p>
                            <p className="mt-2 text-[#6d4c2f]">
                              <span className="font-bold">Status:</span>{" "}
                              <span className="capitalize">
                                {order.cancellation_request.status}
                              </span>
                            </p>
                            <p className="mt-1 text-[#6d4c2f]">
                              <span className="font-bold">Reason:</span>{" "}
                              {order.cancellation_request.reason}
                            </p>
                            {order.cancellation_request.admin_note && (
                              <p className="mt-1 text-[#6d4c2f]">
                                <span className="font-bold">Admin note:</span>{" "}
                                {order.cancellation_request.admin_note}
                              </p>
                            )}
                          </div>

                          {order.cancellation_request.status === "pending" && (
                            <div className="w-full md:w-96 space-y-3">
                              <textarea
                                value={adminNotes[order.cancellation_request.id] || ""}
                                onChange={(e) =>
                                  setAdminNotes((prev) => ({
                                    ...prev,
                                    [order.cancellation_request.id]: e.target.value,
                                  }))
                                }
                                rows={2}
                                className="w-full rounded-2xl border border-amber-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-600"
                                placeholder="Optional admin note"
                              />
                              <div className="flex gap-3">
                                <button
                                  onClick={() =>
                                    handleReviewCancellation(
                                      order.cancellation_request.id,
                                      "approved"
                                    )
                                  }
                                  disabled={reviewingRequestId === order.cancellation_request.id}
                                  className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-white font-black hover:bg-green-700 disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleReviewCancellation(
                                      order.cancellation_request.id,
                                      "rejected"
                                    )
                                  }
                                  disabled={reviewingRequestId === order.cancellation_request.id}
                                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-white font-black hover:bg-red-700 disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 border-t border-[#ead7b8] pt-5">
                      <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#7a5331]">
                        Order Timeline
                      </p>
                      <OrderTimeline
                        status={order.status}
                        timeline={order.timeline || []}
                      />
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
