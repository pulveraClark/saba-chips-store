import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMe, updateMe } from "../assets/services/authService.js";
import OrderTimeline from "../assets/components/OrderTimeline.jsx";
import { createReview } from "../assets/services/reviewService.js";
import {
  getUserOrders,
  requestOrderCancellation,
} from "../assets/services/orderService.js";
import { sortByNewest } from "../utils/sortByNewest.js";
import { useNotification } from "../context/NotificationContext.jsx";
import { getMediaUrl } from "../utils/media.js";

const ORDERS_PER_PAGE = 5;

const statusStyles = {
  payment_verification: "bg-orange-100 text-orange-800 border-orange-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-cyan-100 text-cyan-800 border-cyan-200",
  out_for_delivery: "bg-purple-100 text-purple-800 border-purple-200",
  shipped: "bg-violet-100 text-violet-800 border-violet-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

function Profile() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [orderFilter, setOrderFilter] = useState("all");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [cancelReasonByOrder, setCancelReasonByOrder] = useState({});
  const [requestingCancelId, setRequestingCancelId] = useState(null);
  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState(null);
  const [reviewForms, setReviewForms] = useState({});
  const [reviewingKey, setReviewingKey] = useState(null);
  const { notify } = useNotification();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);

      const data = await getMe();
      if (!data.user) {
        setError("Please login to view profile");
        return;
      }

      setUser(data.user);
      setProfileForm({
        name: data.user.name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        address: data.user.address || "",
      });

      try {
        const userOrders = await getUserOrders();
        setOrders(userOrders || []);
      } catch {
        setOrders([]);
      }
    } catch {
      setError("Please login to view profile");
    } finally {
      setLoading(false);
      setOrdersLoading(false);
      setRefreshing(false);
    }
  };

  const sortedOrders = useMemo(() => sortByNewest(orders), [orders]);
  const filteredOrders = useMemo(() => {
    if (orderFilter === "active") {
      return sortedOrders.filter((order) =>
        ["payment_verification", "pending", "confirmed", "preparing", "out_for_delivery", "shipped"].includes(order.status)
      );
    }
    if (orderFilter === "completed") {
      return sortedOrders.filter((order) => order.status === "delivered");
    }
    if (orderFilter === "cancelled") {
      return sortedOrders.filter((order) => order.status === "cancelled");
    }
    return sortedOrders;
  }, [orderFilter, sortedOrders]);
  const activeOrders = sortedOrders.filter((order) =>
    ["payment_verification", "pending", "confirmed", "preparing", "out_for_delivery", "shipped"].includes(order.status)
  );
  const totalSpent = sortedOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const latestStatus = sortedOrders[0]?.status || "No orders yet";
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * ORDERS_PER_PAGE,
    page * ORDERS_PER_PAGE
  );

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const data = await updateMe(profileForm);
      setUser(data.user);
      setEditingProfile(false);
      notify({
        type: "success",
        title: "Profile updated",
        message: "Your account details were saved.",
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Profile update failed",
        message: err?.response?.data?.message || "Could not update your profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

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
      setConfirmCancelOrderId(null);
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

  const handleReviewSubmit = async (orderId, productId) => {
    const key = `${orderId}-${productId}`;
    const form = reviewForms[key] || { rating: 5, comment: "" };

    try {
      setReviewingKey(key);
      await createReview({
        orderId,
        productId,
        rating: Number(form.rating),
        comment: form.comment || "",
        image: form.image || null,
      });
      await fetchProfile(true);
      notify({
        type: "success",
        title: "Review submitted",
        message: "Thanks for sharing your feedback.",
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Review failed",
        message: err?.response?.data?.message || "Could not submit review.",
      });
    } finally {
      setReviewingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8]">
        <div className="text-xl font-bold text-[#8b5e34]">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f2e8] px-6 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-[#ead7b8] bg-white p-10 text-center shadow-xl">
          <h2 className="mb-4 text-2xl font-black text-[#8b5e34]">{error}</h2>
          <Link
            to="/login"
            className="inline-block rounded-xl bg-[#8b5e34] px-6 py-3 font-bold text-white hover:bg-[#714a28]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <section className="overflow-hidden rounded-2xl border border-[#ead7b8] bg-white shadow-xl">
          <div className="bg-[#8b5e34] px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-black text-[#8b5e34]">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f9dfbd]">
                    My Profile
                  </p>
                  <h1 className="mt-1 text-3xl font-black">{user?.name}</h1>
                  <p className="mt-1 text-[#fff1df]">{user?.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/messages"
                  className="rounded-xl bg-white px-4 py-3 font-bold text-[#8b5e34] hover:bg-[#fff7eb]"
                >
                  Message Admin
                </Link>
                <Link
                  to="/home"
                  className="rounded-xl border border-white/60 px-4 py-3 font-bold text-white hover:bg-white/10"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryTile label="User ID" value={`#${user?.id}`} />
              <SummaryTile label="Total Orders" value={orders.length} />
            <SummaryTile label="Active Orders" value={activeOrders.length} />
            <SummaryTile label="Total Spent" value={`PHP ${totalSpent.toLocaleString()}`} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.35fr]">
          <div className="space-y-6">
            <Panel title="Account Details">
              {editingProfile ? (
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <ProfileInput
                    label="Name"
                    value={profileForm.name}
                    onChange={(value) => setProfileForm((prev) => ({ ...prev, name: value }))}
                    required
                  />
                  <ProfileInput
                    label="Email"
                    type="email"
                    value={profileForm.email}
                    onChange={(value) => setProfileForm((prev) => ({ ...prev, email: value }))}
                    required
                  />
                  <ProfileInput
                    label="Phone"
                    value={profileForm.phone}
                    onChange={(value) => setProfileForm((prev) => ({ ...prev, phone: value }))}
                    placeholder="09xxxxxxxxx"
                  />
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#7a5331]">
                      Delivery Address
                    </label>
                    <textarea
                      value={profileForm.address}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-xl border border-[#d8be96] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b5e34]"
                      placeholder="Default delivery address"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="rounded-xl bg-[#8b5e34] px-4 py-3 font-bold text-white hover:bg-[#714a28] disabled:opacity-60"
                    >
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="rounded-xl border border-[#d8be96] px-4 py-3 font-bold text-[#8b5e34] hover:bg-[#fffaf2]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <InfoRow label="Name" value={user?.name} />
                  <InfoRow label="Email" value={user?.email} />
                  <InfoRow label="Phone" value={user?.phone || "Not set"} />
                  <InfoRow label="Address" value={user?.address || "Not set"} />
                  <InfoRow label="Latest Order Status" value={latestStatus} capitalize />
                  <InfoRow
                    label="Member Since"
                    value={new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  />
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="mt-4 w-full rounded-xl bg-[#8b5e34] px-4 py-3 font-bold text-white hover:bg-[#714a28]"
                  >
                    Edit Profile
                  </button>
                </>
              )}
            </Panel>

            <Panel title="Quick Links">
              <div className="grid gap-3">
                <Link
                  to="/cart"
                  className="rounded-xl border border-[#ead7b8] bg-[#fffaf2] px-4 py-3 font-bold text-[#8b5e34] hover:bg-[#f5e4c9]"
                >
                  View Cart
                </Link>
                <Link
                  to="/messages"
                  className="rounded-xl border border-[#ead7b8] bg-[#fffaf2] px-4 py-3 font-bold text-[#8b5e34] hover:bg-[#f5e4c9]"
                >
                  Contact Support
                </Link>
              </div>
            </Panel>
          </div>

          <section className="rounded-2xl border border-[#ead7b8] bg-white shadow-xl">
            <div className="flex flex-col gap-4 border-b border-[#ead7b8] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#8b5e34]">Order History</h2>
                <p className="mt-1 text-sm text-[#6d4c2f]">
                  Simple view of your orders, tracking, and cancellation requests.
                </p>
              </div>
              <button
                onClick={() => fetchProfile(true)}
                disabled={refreshing}
                className="rounded-xl bg-[#8b5e34] px-4 py-3 font-bold text-white hover:bg-[#714a28] disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-[#ead7b8] px-5 py-4">
              {[
                ["all", "All"],
                ["active", "Active"],
                ["completed", "Delivered"],
                ["cancelled", "Cancelled"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    setOrderFilter(value);
                    setPage(1);
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
                    orderFilter === value
                      ? "bg-[#8b5e34] text-white"
                      : "border border-[#ead7b8] bg-white text-[#8b5e34] hover:bg-[#fffaf2]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {ordersLoading ? (
              <div className="py-16 text-center font-bold text-[#8b5e34]">
                Loading orders...
              </div>
            ) : sortedOrders.length === 0 ? (
              <div className="p-10 text-center">
                <h3 className="text-xl font-black text-[#8b5e34]">No orders yet</h3>
                <p className="mt-2 text-[#6d4c2f]">Your future purchases will appear here.</p>
                <Link
                  to="/home"
                  className="mt-6 inline-block rounded-xl bg-[#8b5e34] px-6 py-3 font-bold text-white hover:bg-[#714a28]"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                {filteredOrders.length === 0 ? (
                  <div className="p-10 text-center text-[#6d4c2f]">
                    No orders match this filter.
                  </div>
                ) : (
                  <div className="divide-y divide-[#f1e3ca]">
                    {paginatedOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        reason={cancelReasonByOrder[order.id] || ""}
                        requesting={requestingCancelId === order.id}
                        onReasonChange={(value) =>
                          setCancelReasonByOrder((prev) => ({
                            ...prev,
                            [order.id]: value,
                          }))
                        }
                      onCancelRequest={() => setConfirmCancelOrderId(order.id)}
                      reviewForms={reviewForms}
                      reviewingKey={reviewingKey}
                      onReviewChange={(key, value) =>
                        setReviewForms((prev) => ({
                          ...prev,
                          [key]: {
                            rating: prev[key]?.rating || 5,
                            comment: prev[key]?.comment || "",
                            ...value,
                          },
                        }))
                      }
                      onReviewSubmit={handleReviewSubmit}
                    />
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-4 border-t border-[#f1e3ca] bg-[#fffaf2] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-[#6d4c2f]">
                    Page {page} of {totalPages} - {filteredOrders.length} shown
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
        </section>
      </div>
      {confirmCancelOrderId && (
        <ConfirmDialog
          title="Request cancellation?"
          message={`This will send your cancellation request for Order #${confirmCancelOrderId} to admin for review.`}
          confirmLabel="Send Request"
          danger
          onCancel={() => setConfirmCancelOrderId(null)}
          onConfirm={() => handleCancellationRequest(confirmCancelOrderId)}
        />
      )}
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-xl border border-[#ead7b8] bg-[#fffaf2] p-4">
      <p className="text-sm font-bold text-[#7a5331]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#8b5e34]">{value}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-[#ead7b8] bg-white p-5 shadow-xl">
      <h2 className="mb-4 text-xl font-black text-[#8b5e34]">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value, capitalize = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f1e3ca] py-3 last:border-0">
      <p className="text-sm font-bold text-[#7a5331]">{label}</p>
      <p className={`text-right font-semibold text-gray-900 ${capitalize ? "capitalize" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function ProfileInput({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#7a5331]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#d8be96] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b5e34]"
      />
    </div>
  );
}

function OrderCard({
  order,
  reason,
  requesting,
  onReasonChange,
  onCancelRequest,
  reviewForms,
  reviewingKey,
  onReviewChange,
  onReviewSubmit,
}) {
  const canRequestCancel = [
    "payment_verification",
    "pending",
    "confirmed",
    "preparing",
  ].includes(order.status);
  const statusClass = statusStyles[order.status] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <article className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black text-[#8b5e34]">Order #{order.id}</h3>
            <span className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${statusClass}`}>
              {order.status.replaceAll("_", " ")}
            </span>
            {order.payment_status === "refund_pending" && (
              <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-black text-red-800">
                Refund pending
              </span>
            )}
            {order.payment_status === "refunded" && (
              <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                Refunded
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#6d4c2f]">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <p className="text-2xl font-black text-[#8b5e34]">
          PHP {Number(order.total).toLocaleString()}
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-[#f1e3ca] bg-[#fffaf2]">
        {order.items.map((item, index) => {
          const reviewKey = `${order.id}-${item.product_id}`;
          return (
          <div
            key={index}
            className="border-b border-[#f1e3ca] px-4 py-3 last:border-0"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900">{item.product}</p>
                <p className="text-sm text-[#6d4c2f]">Qty {item.quantity}</p>
              </div>
              <p className="font-black text-[#8b5e34]">
                PHP {Number(item.price).toLocaleString()}
              </p>
            </div>
            {order.status === "delivered" && (
              <div className="mt-3 rounded-xl bg-white p-3">
                {item.review ? (
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <p className="text-sm font-bold text-[#6d4c2f]">
                      Your rating: {Number(item.review.rating)} / 5
                      {item.review.comment ? ` - ${item.review.comment}` : ""}
                    </p>
                    {item.review.image && (
                      <img
                        src={getMediaUrl(item.review.image)}
                        alt={`Review for ${item.product}`}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-[120px_1fr]">
                    <select
                      value={reviewForms[reviewKey]?.rating || 5}
                      onChange={(e) =>
                        onReviewChange(reviewKey, { rating: e.target.value })
                      }
                      className="rounded-xl border border-[#d8be96] px-3 py-2"
                    >
                      <option value="5">5 stars</option>
                      <option value="4">4 stars</option>
                      <option value="3">3 stars</option>
                      <option value="2">2 stars</option>
                      <option value="1">1 star</option>
                    </select>
                    <input
                      value={reviewForms[reviewKey]?.comment || ""}
                      onChange={(e) =>
                        onReviewChange(reviewKey, { comment: e.target.value })
                      }
                      className="rounded-xl border border-[#d8be96] px-3 py-2"
                      placeholder="Optional review"
                    />
                    <label className="md:col-span-2">
                      <span className="mb-2 block text-sm font-bold text-[#7a5331]">
                        Add review photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          onReviewChange(reviewKey, {
                            image: e.target.files?.[0] || null,
                          })
                        }
                        className="block w-full rounded-xl border border-[#d8be96] bg-white px-3 py-2 text-sm"
                      />
                    </label>
                    <button
                      onClick={() => onReviewSubmit(order.id, item.product_id)}
                      disabled={reviewingKey === reviewKey}
                      className="rounded-xl bg-[#8b5e34] px-4 py-2 font-bold text-white hover:bg-[#714a28] disabled:opacity-60 md:col-span-2"
                    >
                      {reviewingKey === reviewKey ? "Sending..." : "Review"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>

      <details className="mt-4 rounded-xl border border-[#ead7b8] bg-white p-4">
        <summary className="cursor-pointer font-black text-[#8b5e34]">
          Tracking details
        </summary>
        <div className="mt-4">
          <OrderTimeline status={order.status} timeline={order.timeline || []} />
        </div>
      </details>

      <div className="mt-4 rounded-xl border border-[#ead7b8] bg-white p-4">
        <p className="mb-3 font-black text-[#8b5e34]">Payment</p>
        <div className="rounded-xl bg-[#fffaf2] p-4 text-sm text-[#6d4c2f]">
          <p>
            Method: <span className="font-black">{order.payment_method}</span>
          </p>
          {order.payment_method === "GCash" && (
            <>
              <p className="mt-1">
                Status:{" "}
                <span className="font-black capitalize">
                  {(order.payment_status || "pending").replaceAll("_", " ")}
                </span>
              </p>
              {order.payment_reference && (
                <p className="mt-1">Reference: {order.payment_reference}</p>
              )}
              {order.payment_review_note && (
                <p className="mt-1">Admin note: {order.payment_review_note}</p>
              )}
              {order.payment_status === "refund_pending" && (
                <p className="mt-2 rounded-lg border border-red-200 bg-white px-3 py-2 font-bold text-red-800">
                  Refund pending: your verified GCash payment is queued for admin refund.
                </p>
              )}
              {order.payment_status === "refunded" && (
                <p className="mt-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 font-bold text-emerald-800">
                  Refunded: your GCash refund has been marked as completed.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#ead7b8] bg-white p-4">
        <p className="mb-3 font-black text-[#8b5e34]">Cancellation</p>
        {order.cancellation_request ? (
          <div className="rounded-xl bg-[#fffaf2] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-bold text-[#6d4c2f]">
                Request status:{" "}
                <span className="capitalize text-[#8b5e34]">
                  {order.cancellation_request.status}
                </span>
              </p>
              <p className="text-sm text-[#7a5331]">
                {new Date(order.cancellation_request.created_at).toLocaleString()}
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
            {order.payment_method === "GCash" && order.payment_status === "refund_pending" && (
              <p className="mt-2 text-sm font-bold text-red-800">
                Since this order was paid through GCash, admin must refund it after approval.
              </p>
            )}
            {order.payment_method === "GCash" && order.payment_status === "refunded" && (
              <p className="mt-2 text-sm font-bold text-emerald-800">
                This cancelled GCash order has been refunded.
              </p>
            )}
          </div>
        ) : canRequestCancel ? (
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={2}
              className="rounded-xl border border-[#d8be96] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b5e34]"
              placeholder="Reason for cancellation"
            />
            <button
              onClick={onCancelRequest}
              disabled={requesting}
              className="rounded-xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700 disabled:opacity-60"
            >
              {requesting ? "Sending..." : "Request Cancel"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-[#6d4c2f]">
            Cancellation requests are available only before shipping.
          </p>
        )}
      </div>
    </article>
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

export default Profile;
