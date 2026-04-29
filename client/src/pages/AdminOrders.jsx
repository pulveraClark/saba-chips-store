import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAllOrders,
  markRefunded,
  reviewPayment,
  reviewCancellationRequest,
  updateOrderStatus,
} from "../assets/services/orderService.js";
import OrderTimeline from "../assets/components/OrderTimeline.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import { sortByNewest } from "../utils/sortByNewest.js";
import { getMediaUrl } from "../utils/media.js";

const ORDERS_PER_PAGE = 5;

const statusStyles = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  payment_verification: "bg-orange-100 text-orange-800 border-orange-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-cyan-100 text-cyan-800 border-cyan-200",
  out_for_delivery: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
  const [reviewingPaymentId, setReviewingPaymentId] = useState(null);
  const [refundingOrderId, setRefundingOrderId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [paymentNotes, setPaymentNotes] = useState({});
  const [refundNotes, setRefundNotes] = useState({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const { notify } = useNotification();

  const fetchOrders = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const data = await getAllOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);
      notify({
        type: "error",
        title: "Orders unavailable",
        message: "Could not load orders right now.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const handleReviewPayment = async (orderId, decision) => {
    try {
      setReviewingPaymentId(orderId);
      await reviewPayment(orderId, decision, paymentNotes[orderId] || "");
      await fetchOrders();
      notify({
        type: "success",
        title: "Payment reviewed",
        message: `GCash payment for Order #${orderId} was ${decision}.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Payment review failed",
        message: err?.response?.data?.message || "Could not review payment.",
      });
    } finally {
      setReviewingPaymentId(null);
    }
  };

  const handleMarkRefunded = async (orderId) => {
    try {
      setRefundingOrderId(orderId);
      await markRefunded(orderId, refundNotes[orderId] || "");
      await fetchOrders();
      notify({
        type: "success",
        title: "Refund completed",
        message: `GCash refund for Order #${orderId} was marked as refunded.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Refund update failed",
        message: err?.response?.data?.message || "Could not mark refund as completed.",
      });
    } finally {
      setRefundingOrderId(null);
    }
  };

  const sortedOrders = useMemo(() => sortByNewest(orders), [orders]);
  const visibleOrders = useMemo(() => {
    return sortedOrders.filter((order) => {
      const query = orderSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        String(order.id).includes(query) ||
        order.customer_name?.toLowerCase().includes(query) ||
        order.customer_email?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter ||
        (statusFilter === "cancellation_pending" &&
          order.cancellation_request?.status === "pending");

      return matchesSearch && matchesStatus;
    });
  }, [orderSearch, sortedOrders, statusFilter]);
  const activeOrders = orders.filter((order) =>
        ["payment_verification", "pending", "confirmed", "preparing", "out_for_delivery"].includes(order.status)
  ).length;
  const totalPages = Math.max(1, Math.ceil(visibleOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = visibleOrders.slice(
    (page - 1) * ORDERS_PER_PAGE,
    page * ORDERS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8]">
        <div className="text-xl font-bold text-[#8b5e34]">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#ead7b8] bg-white shadow-xl">
          <div className="flex flex-col gap-5 border-b border-[#ead7b8] bg-[#8b5e34] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link to="/admin" className="font-bold text-[#fff1df] hover:text-white">
                Back to Dashboard
              </Link>
              <h1 className="mt-3 text-3xl font-black">Order Management</h1>
              <p className="mt-1 text-[#fff1df]">
                Review orders, update statuses, and handle cancellation requests.
              </p>
            </div>
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="rounded-xl bg-white px-4 py-3 font-bold text-[#8b5e34] hover:bg-[#fff7eb] disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total Orders" value={orders.length} />
            <Metric label="Active Orders" value={activeOrders} />
            <Metric
              label="GCash To Verify"
              value={orders.filter((order) => order.payment_status === "pending_verification").length}
              alert
            />
            <Metric
              label="Refund Pending"
              value={orders.filter((order) => order.payment_status === "refund_pending").length}
              alert
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#ead7b8] bg-white shadow-xl">
          <div className="flex flex-col gap-2 border-b border-[#ead7b8] p-5">
            <h2 className="text-2xl font-black text-[#8b5e34]">Orders</h2>
            <p className="text-sm text-[#6d4c2f]">
              Each order shows the essentials first. Open details only when you need the full timeline.
            </p>
          </div>

          <div className="grid gap-4 border-b border-[#ead7b8] p-5 lg:grid-cols-[minmax(260px,420px)_1fr]">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#7a5331]">
                Search orders
              </span>
              <input
                value={orderSearch}
                onChange={(e) => {
                  setOrderSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-[#d8be96] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b5e34]"
                placeholder="Order ID, customer name, or email"
              />
            </label>

            <details className="rounded-xl border border-[#ead7b8] bg-[#fffaf2] p-3" open>
              <summary className="cursor-pointer list-none text-sm font-black text-[#7a5331]">
                Filters:{" "}
                <span className="capitalize text-[#8b5e34]">
                  {statusFilter.replaceAll("_", " ")}
                </span>
              </summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ["all", "All"],
                  ["payment_verification", "Payment Check"],
                  ["pending", "Pending"],
                  ["confirmed", "Confirmed"],
                  ["preparing", "Preparing"],
                  ["out_for_delivery", "Out for Delivery"],
                  ["delivered", "Delivered"],
                  ["cancelled", "Cancelled"],
                  ["cancellation_pending", "Cancel Requests"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setStatusFilter(value);
                      setPage(1);
                    }}
                    className={`min-h-10 rounded-full px-3 py-2 text-sm font-black ${
                      statusFilter === value
                        ? "bg-[#8b5e34] text-white"
                        : "border border-[#ead7b8] bg-white text-[#8b5e34] hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </details>
          </div>

          {orders.length === 0 ? (
            <div className="py-20 text-center text-[#6d4c2f]">No orders found.</div>
          ) : (
            <>
              {visibleOrders.length === 0 ? (
                <div className="py-16 text-center text-[#6d4c2f]">
                  No orders match your filters.
                </div>
              ) : (
                <div className="divide-y divide-[#f1e3ca]">
                  {paginatedOrders.map((order) => (
                    <AdminOrderCard
                      key={order.id}
                      order={order}
                      updating={updatingId === order.id}
                      reviewing={reviewingRequestId === order.cancellation_request?.id}
                      reviewingPayment={reviewingPaymentId === order.id}
                      refunding={refundingOrderId === order.id}
                      adminNote={adminNotes[order.cancellation_request?.id] || ""}
                      paymentNote={paymentNotes[order.id] || ""}
                      refundNote={refundNotes[order.id] || ""}
                      onStatusChange={(orderId, status) =>
                        setConfirmAction({
                          type: "status",
                          orderId,
                          status,
                        })
                      }
                      onAdminNoteChange={(requestId, value) =>
                        setAdminNotes((prev) => ({ ...prev, [requestId]: value }))
                      }
                      onPaymentNoteChange={(orderId, value) =>
                        setPaymentNotes((prev) => ({ ...prev, [orderId]: value }))
                      }
                      onRefundNoteChange={(orderId, value) =>
                        setRefundNotes((prev) => ({ ...prev, [orderId]: value }))
                      }
                      onReviewPayment={(orderId, decision) =>
                        setConfirmAction({
                          type: "payment",
                          orderId,
                          decision,
                        })
                      }
                      onReviewCancellation={(requestId, decision) =>
                        setConfirmAction({
                          type: "cancellation",
                          requestId,
                          decision,
                        })
                      }
                      onMarkRefunded={(orderId) =>
                        setConfirmAction({
                          type: "refund",
                          orderId,
                        })
                      }
                    />
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-4 border-t border-[#f1e3ca] bg-[#fffaf2] p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium text-[#6d4c2f]">
                  Page {page} of {totalPages} - {visibleOrders.length} shown
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="rounded-xl bg-[#8b5e34] px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                    disabled={page >= totalPages}
                    className="rounded-xl bg-[#8b5e34] px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction.type === "status"
              ? "Update order status?"
              : confirmAction.type === "payment"
              ? "Review GCash payment?"
              : confirmAction.type === "refund"
              ? "Mark refund completed?"
              : "Review cancellation request?"
          }
          message={
            confirmAction.type === "status"
              ? `Order #${confirmAction.orderId} will be changed to ${confirmAction.status}.`
              : confirmAction.type === "payment"
              ? `GCash payment for Order #${confirmAction.orderId} will be ${confirmAction.decision}.`
              : confirmAction.type === "refund"
              ? `Order #${confirmAction.orderId} will be marked as refunded.`
              : `This cancellation request will be ${confirmAction.decision}.`
          }
          confirmLabel={
            confirmAction.type === "status"
              ? "Update"
              : confirmAction.type === "payment"
              ? "Review Payment"
              : confirmAction.type === "refund"
              ? "Mark Refunded"
              : "Confirm"
          }
          danger={
            confirmAction.status === "cancelled" || confirmAction.decision === "rejected"
          }
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction.type === "status") {
              void handleStatusChange(confirmAction.orderId, confirmAction.status);
            } else if (confirmAction.type === "payment") {
              void handleReviewPayment(confirmAction.orderId, confirmAction.decision);
            } else if (confirmAction.type === "refund") {
              void handleMarkRefunded(confirmAction.orderId);
            } else {
              void handleReviewCancellation(confirmAction.requestId, confirmAction.decision);
            }
            setConfirmAction(null);
          }}
        />
      )}
    </div>
  );
}

function Metric({ label, value, alert = false }) {
  return (
    <div className="rounded-xl border border-[#ead7b8] bg-[#fffaf2] p-4">
      <p className="text-sm font-bold text-[#7a5331]">{label}</p>
      <p className={`mt-2 text-3xl font-black ${alert && value > 0 ? "text-red-700" : "text-[#8b5e34]"}`}>
        {value}
      </p>
    </div>
  );
}

function AdminOrderCard({
  order,
  updating,
  reviewing,
  reviewingPayment,
  refunding,
  adminNote,
  paymentNote,
  refundNote,
  onStatusChange,
  onAdminNoteChange,
  onPaymentNoteChange,
  onRefundNoteChange,
  onReviewPayment,
  onReviewCancellation,
  onMarkRefunded,
}) {
  const statusClass = statusStyles[order.status] || "bg-gray-100 text-gray-800 border-gray-200";
  const cancellation = order.cancellation_request;

  return (
    <article className="p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black text-[#8b5e34]">Order #{order.id}</h3>
            <span className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${statusClass}`}>
              {order.status}
            </span>
            {cancellation?.status === "pending" && (
              <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                Cancellation pending
              </span>
            )}
            {order.payment_status === "pending_verification" && (
              <span className="rounded-full border border-orange-300 bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                GCash proof to verify
              </span>
            )}
            {order.payment_status === "refund_pending" && (
              <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-black text-red-800">
                GCash refund pending
              </span>
            )}
            {order.payment_status === "refunded" && (
              <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                GCash refunded
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoBlock label="Customer" value={order.customer_name} subValue={order.customer_email} />
            <InfoBlock label="Total" value={`PHP ${Number(order.total).toLocaleString()}`} />
            <InfoBlock label="Date" value={new Date(order.created_at).toLocaleString()} />
            <InfoBlock label="Payment" value={order.payment_method} />
          </div>
        </div>

        <div className="min-w-56">
          <label className="mb-2 block text-sm font-bold text-[#7a5331]">
            Update Status
          </label>
          <select
            value={order.status}
            onChange={(e) => onStatusChange(order.id, e.target.value)}
            disabled={updating}
            className="w-full rounded-xl border border-[#d8be96] bg-white px-4 py-3 font-medium text-[#6d4c2f]"
          >
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="preparing">preparing</option>
            <option value="out_for_delivery">out for delivery</option>
            <option value="delivered">delivered</option>
            <option value="cancelled">cancelled</option>
          </select>
          {updating && <p className="mt-2 text-sm font-bold text-[#7a5331]">Updating...</p>}
        </div>
      </div>

      {order.payment_method === "GCash" && (
        <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="font-black text-orange-900">GCash Payment Proof</p>
              <div className="mt-3 grid gap-2 text-sm text-[#6d4c2f] sm:grid-cols-3">
                <p>
                  Status:{" "}
                  <span className="font-black capitalize text-[#8b5e34]">
                    {(order.payment_status || "pending").replaceAll("_", " ")}
                  </span>
                </p>
                <p>Reference: {order.payment_reference || "Not provided"}</p>
                <p>
                  Reviewed:{" "}
                  {order.payment_reviewed_at
                    ? new Date(order.payment_reviewed_at).toLocaleString()
                    : "Not yet"}
                </p>
              </div>
              {order.payment_review_note && (
                <p className="mt-2 text-sm text-[#6d4c2f]">
                  Note: {order.payment_review_note}
                </p>
              )}
              {order.payment_status === "refund_pending" && (
                <div className="mt-3 space-y-3 rounded-xl border border-red-200 bg-white p-4">
                  <p className="text-sm font-bold text-red-800">
                    This paid GCash order was cancelled. Process the customer refund using the
                    GCash reference, then mark it refunded.
                  </p>
                  <textarea
                    value={refundNote}
                    onChange={(e) => onRefundNoteChange(order.id, e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="Refund note or GCash refund reference"
                  />
                  <button
                    onClick={() => onMarkRefunded(order.id)}
                    disabled={refunding}
                    className="rounded-xl bg-emerald-600 px-4 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {refunding ? "Updating..." : "Mark Refunded"}
                  </button>
                </div>
              )}
              {order.payment_status === "refunded" && (
                <p className="mt-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800">
                  Refund completed. The customer has been notified.
                </p>
              )}
              {order.payment_proof_image ? (
                <a
                  href={getMediaUrl(order.payment_proof_image)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block overflow-hidden rounded-2xl border border-orange-200 bg-white"
                >
                  <img
                    src={getMediaUrl(order.payment_proof_image)}
                    alt={`GCash proof for Order #${order.id}`}
                    className="h-36 w-56 object-cover"
                  />
                </a>
              ) : (
                <p className="mt-3 text-sm text-[#6d4c2f]">No proof uploaded.</p>
              )}
            </div>

            {order.payment_status === "pending_verification" && (
              <div className="w-full space-y-3 lg:w-80">
                <textarea
                  value={paymentNote}
                  onChange={(e) => onPaymentNoteChange(order.id, e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-orange-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-600"
                  placeholder="Optional payment note"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => onReviewPayment(order.id, "approved")}
                    disabled={reviewingPayment}
                    className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-black text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => onReviewPayment(order.id, "rejected")}
                    disabled={reviewingPayment}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-black text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-[#ead7b8] bg-[#fffaf2] p-4">
          <p className="mb-3 font-black text-[#8b5e34]">Delivery Details</p>
          <InfoLine label="Address" value={order.address} />
          <InfoLine label="Phone" value={order.phone} />
        </div>

        <div className="rounded-xl border border-[#ead7b8] bg-[#fffaf2] p-4">
          <p className="mb-3 font-black text-[#8b5e34]">Items</p>
          <div className="flex flex-wrap gap-2">
            {order.items?.map((item, index) => (
              <span
                key={index}
                className="rounded-full bg-white px-3 py-2 text-sm font-bold text-[#8b5e34]"
              >
                {item.product_name} x{item.quantity}
              </span>
            ))}
          </div>
        </div>
      </div>

      {cancellation && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-black text-amber-900">Cancellation Request</p>
              <p className="mt-2 text-sm text-[#6d4c2f]">
                Status: <span className="font-bold capitalize">{cancellation.status}</span>
              </p>
              <p className="mt-1 text-sm text-[#6d4c2f]">Reason: {cancellation.reason}</p>
              {cancellation.admin_note && (
                <p className="mt-1 text-sm text-[#6d4c2f]">
                  Admin note: {cancellation.admin_note}
                </p>
              )}
            </div>

            {cancellation.status === "pending" && (
              <div className="w-full space-y-3 lg:w-96">
                <textarea
                  value={adminNote}
                  onChange={(e) => onAdminNoteChange(cancellation.id, e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  placeholder="Optional admin note"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => onReviewCancellation(cancellation.id, "approved")}
                    disabled={reviewing}
                    className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-black text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReviewCancellation(cancellation.id, "rejected")}
                    disabled={reviewing}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-black text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <details className="mt-5 rounded-xl border border-[#ead7b8] bg-white p-4">
        <summary className="cursor-pointer font-black text-[#8b5e34]">
          Order timeline
        </summary>
        <div className="mt-4">
          <OrderTimeline status={order.status} timeline={order.timeline || []} />
        </div>
      </details>
    </article>
  );
}

function InfoBlock({ label, value, subValue }) {
  return (
    <div>
      <p className="text-sm font-bold text-[#7a5331]">{label}</p>
      <p className="mt-1 font-black text-gray-900">{value}</p>
      {subValue && <p className="mt-1 text-sm text-[#6d4c2f]">{subValue}</p>}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#ead7b8] py-2 last:border-0">
      <p className="text-sm font-bold text-[#7a5331]">{label}</p>
      <p className="text-right text-sm font-semibold text-[#6d4c2f]">{value}</p>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, danger = false, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-black text-[#8b5e34]">{title}</h3>
        <p className="mt-3 text-[#6d4c2f]">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-[#d8be96] px-4 py-3 font-bold text-[#8b5e34] hover:bg-[#fffaf2]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl px-4 py-3 font-bold text-white ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-[#8b5e34] hover:bg-[#714a28]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminOrders;
