import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMe } from "../assets/services/authService.js";
import OrderTimeline from "../assets/components/OrderTimeline.jsx";
import {
  getUserOrders,
  requestOrderCancellation,
} from "../assets/services/orderService.js";
import { sortByNewest } from "../utils/sortByNewest.js";
import { useNotification } from "../context/NotificationContext.jsx";

function Profile() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [cancelReasonByOrder, setCancelReasonByOrder] = useState({});
  const [requestingCancelId, setRequestingCancelId] = useState(null);
  const { notify } = useNotification();

  const ORDERS_PER_PAGE = 5;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);

      const data = await getMe();

      if (data.user) {
        setUser(data.user);

        try {
          const userOrders = await getUserOrders();
          setOrders(userOrders || []);
        } catch {
          setOrders([]);
        }
      } else {
        setError("Please login to view profile");
      }
    } catch {
      setError("Please login to view profile");
    } finally {
      setLoading(false);
      setOrdersLoading(false);
      setRefreshing(false);
    }
  };

  const sortedOrders = sortByNewest(orders);
  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = sortedOrders.slice(
    (page - 1) * ORDERS_PER_PAGE,
    page * ORDERS_PER_PAGE
  );

  const handleCancellationRequest = async (orderId) => {
    const reason = cancelReasonByOrder[orderId]?.trim();
    if (!reason) {
      notify({
        type: "warning",
        title: "Reason required",
        message: "Please include why you want to cancel this order.",
      });
      return;
    }

    try {
      setRequestingCancelId(orderId);
      await requestOrderCancellation(orderId, reason);
      setCancelReasonByOrder((prev) => ({ ...prev, [orderId]: "" }));
      await fetchProfile(true);
      notify({
        type: "success",
        title: "Request submitted",
        message: `Cancellation request for Order #${orderId} was sent to admin.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Request failed",
        message: err?.response?.data?.message || "Could not submit cancellation request.",
      });
    } finally {
      setRequestingCancelId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f8f2e8]">
        <div className="text-2xl text-[#8b5e34] animate-pulse">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-16">
      <div className="max-w-6xl mx-auto px-6">
        {error ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md mx-auto border border-[#ead7b8]">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-[#8b5e34] mb-4">{error}</h2>
            <Link
              to="/login"
              className="bg-[#8b5e34] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#714a28] transition inline-block"
            >
              Go to Login
            </Link>
          </div>
        ) : user ? (
          <div className="space-y-10">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#ead7b8]">
              <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] p-12 text-white text-center">
                <div className="w-32 h-32 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-6">
                  <span className="text-5xl">👤</span>
                </div>
                <h2 className="text-4xl font-black mb-2">{user.name}</h2>
                <p className="text-xl text-[#fff1df]">{user.email}</p>
              </div>

              <div className="p-12">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-[#fffaf2] rounded-2xl p-8 border border-[#ead7b8]">
                    <h3 className="text-2xl font-black text-[#8b5e34] mb-6">
                      Account Info
                    </h3>

                    <div className="space-y-4 text-lg">
                      <div>
                        <span className="font-semibold text-[#6d4c2f]">User ID:</span>
                        <span className="ml-2 bg-[#f5e4c9] px-3 py-1 rounded-full text-[#8b5e34] font-mono text-sm">
                          {user.id}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold text-[#6d4c2f]">Email:</span>
                        <span className="ml-2 text-gray-900">{user.email}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-[#6d4c2f]">
                          Member since:
                        </span>
                        <span className="ml-2 text-[#8b5e34] font-bold">
                          {new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fffaf2] rounded-2xl p-8 border border-[#ead7b8]">
                    <h3 className="text-2xl font-black text-[#8b5e34] mb-6">
                      Order Summary
                    </h3>

                    <div className="space-y-4 text-lg">
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#6d4c2f]">
                          Total Orders:
                        </span>
                        <span className="font-bold text-[#8b5e34]">
                          {orders.length}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-semibold text-[#6d4c2f]">
                          Latest Status:
                        </span>
                        <span className="font-bold text-[#8b5e34] capitalize">
                          {sortedOrders.length > 0 ? sortedOrders[0].status : "No orders yet"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-semibold text-[#6d4c2f]">
                          Total Spent:
                        </span>
                        <span className="font-bold text-[#8b5e34]">
                          ₱
                          {sortedOrders
                            .reduce((sum, order) => sum + Number(order.total), 0)
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-10 border border-[#ead7b8]">
              <div className="flex items-center justify-between gap-4 mb-8">
                <h3 className="text-3xl font-black text-[#8b5e34]">
                  Order History
                </h3>

                <button
                  onClick={() => fetchProfile(true)}
                  disabled={refreshing}
                  className="px-4 py-3 rounded-2xl bg-[#8b5e34] text-white font-bold hover:bg-[#714a28] disabled:opacity-60"
                >
                  {refreshing ? "↻..." : "↻"}
                </button>
              </div>

              {ordersLoading ? (
                <div className="text-center py-16 text-xl text-[#8b5e34] animate-pulse">
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-6">📦</div>
                  <p className="text-xl text-[#6d4c2f] mb-6">No orders yet</p>
                  <Link
                    to="/home"
                    className="bg-[#8b5e34] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#714a28] transition inline-block"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {paginatedOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-[#ead7b8] rounded-2xl p-6 bg-[#fffaf2]"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                          <div>
                            <h4 className="text-2xl font-black text-[#8b5e34]">
                              Order #{order.id}
                            </h4>
                            <p className="text-[#6d4c2f]">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-black text-[#8b5e34]">
                              ₱{Number(order.total).toLocaleString()}
                            </p>
                            <span
                              className={`inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full text-sm font-bold capitalize ${
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
                              <span className="w-2 h-2 rounded-full bg-current"></span>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-white rounded-xl p-4 border border-[#f1e3ca]"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {item.product}
                                </p>
                                <p className="text-sm text-[#6d4c2f]">
                                  Quantity: {item.quantity}
                                </p>
                              </div>

                              <p className="font-bold text-[#8b5e34]">
                                ₱{Number(item.price).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 border-t border-[#ead7b8] pt-5">
                          <h5 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#7a5331]">
                            Order Tracking
                          </h5>
                          <OrderTimeline
                            status={order.status}
                            timeline={order.timeline || []}
                          />
                        </div>

                        <div className="mt-6 border-t border-[#ead7b8] pt-5">
                          <h5 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#7a5331]">
                            Cancellation
                          </h5>

                          {order.cancellation_request ? (
                            <div className="rounded-2xl border border-[#ead7b8] bg-white p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <p className="font-bold text-[#8b5e34]">
                                  Request status:{" "}
                                  <span className="capitalize">
                                    {order.cancellation_request.status}
                                  </span>
                                </p>
                                <p className="text-sm text-[#6d4c2f]">
                                  {new Date(
                                    order.cancellation_request.created_at
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <p className="mt-2 text-sm text-[#6d4c2f]">
                                Reason: {order.cancellation_request.reason}
                              </p>
                              {order.cancellation_request.admin_note && (
                                <p className="mt-2 text-sm text-[#6d4c2f]">
                                  Admin note: {order.cancellation_request.admin_note}
                                </p>
                              )}
                            </div>
                          ) : ["pending", "confirmed"].includes(order.status) ? (
                            <div className="grid md:grid-cols-[1fr_auto] gap-3">
                              <textarea
                                value={cancelReasonByOrder[order.id] || ""}
                                onChange={(e) =>
                                  setCancelReasonByOrder((prev) => ({
                                    ...prev,
                                    [order.id]: e.target.value,
                                  }))
                                }
                                rows={2}
                                className="rounded-2xl border border-[#d8be96] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b5e34]"
                                placeholder="Reason for cancellation"
                              />
                              <button
                                onClick={() => handleCancellationRequest(order.id)}
                                disabled={requestingCancelId === order.id}
                                className="rounded-2xl bg-red-600 px-5 py-3 text-white font-black hover:bg-red-700 disabled:opacity-60"
                              >
                                {requestingCancelId === order.id
                                  ? "Sending..."
                                  : "Request Cancel"}
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-[#6d4c2f]">
                              Cancellation requests are available only before shipping.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[#f1e3ca]">
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
        ) : null}
      </div>
    </div>
  );
}

export default Profile;
