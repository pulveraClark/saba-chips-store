import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCart, clearCart } from "../assets/services/cartService.js";
import {
  checkout as placeOrder,
  getPaymentSettings,
} from "../assets/services/orderService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import { useProducts } from "../context/ProductContext.jsx";
import { getMediaUrl } from "../utils/media.js";

const deliveryAreas = ["Consolacion", "Liloan", "Compostela", "Other nearby area"];

const iconPaths = {
  check: "m5 13 4 4L19 7",
  map: "M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6",
  receipt: "M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Zm3 6h6m-6 4h6",
  shield: "M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z",
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

function Checkout() {
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    address: "",
    phone: "",
    paymentMethod: "Cash on Delivery",
    saveProfile: true,
    deliveryArea: "Liloan",
    notes: "",
    paymentReference: "",
    paymentProof: null,
  });
  const [paymentSettings, setPaymentSettings] = useState({
    gcash: { accountName: "CL**K ED**L P.", number: "09274482261" },
  });
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [finalTotal, setFinalTotal] = useState(0);

  const { refreshCartCount } = useCart();
  const { user, refreshUser } = useAuth();
  const { refreshProducts } = useProducts();
  const { notify } = useNotification();

  useEffect(() => {
    fetchCart();
    fetchPaymentSettings();
  }, []);

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      address: prev.address || user.address || "",
      phone: prev.phone || user.phone || "",
    }));
  }, [user]);

  const fetchCart = async () => {
    try {
      const cartItems = await getCart();
      setCart(cartItems || []);
    } catch (err) {
      console.error("Cart fetch failed:", err);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const settings = await getPaymentSettings();
      setPaymentSettings(settings);
    } catch (err) {
      console.error("Payment settings fetch failed:", err);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const freeDelivery = ["Consolacion", "Liloan", "Compostela"].includes(
    formData.deliveryArea
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.address || !formData.phone) {
      notify({
        type: "warning",
        title: "Missing Details",
        message: "Please complete your delivery address and phone number.",
      });
      return;
    }

    if (cart.length === 0) {
      notify({
        type: "warning",
        title: "Cart Empty",
        message: "Add products to your cart before checkout.",
      });
      return;
    }

    if (formData.paymentMethod === "GCash" && !formData.paymentProof) {
      notify({
        type: "warning",
        title: "Payment Proof Required",
        message: "Please upload your GCash receipt before placing the order.",
      });
      return;
    }

    setLoading(true);

    try {
      const checkoutData = new FormData();
      checkoutData.append("address", formData.address);
      checkoutData.append("phone", formData.phone);
      checkoutData.append("paymentMethod", formData.paymentMethod);
      checkoutData.append("saveProfile", String(formData.saveProfile));
      checkoutData.append("deliveryArea", formData.deliveryArea);
      checkoutData.append("notes", formData.notes);
      checkoutData.append("paymentReference", formData.paymentReference);
      if (formData.paymentProof instanceof File) {
        checkoutData.append("paymentProof", formData.paymentProof);
      }

      const result = await placeOrder(checkoutData);
      setFinalTotal(result.total || total);
      setOrderId(result.orderId || "N/A");

      await clearCart();
      await refreshCartCount();
      await refreshProducts();
      if (formData.saveProfile) {
        await refreshUser();
      }

      setCart([]);
      setOrderSuccess(true);
      notify({
        type: "success",
        title: "Order Confirmed",
        message: `Order #${result.orderId || "N/A"} was placed successfully.`,
      });
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Please try again";
      notify({
        type: "error",
        title: "Checkout Failed",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8] px-4 py-12">
        <div className="w-full max-w-2xl rounded-[2rem] border border-[#ead7b8] bg-white p-8 text-center shadow-2xl md:p-12">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-[#6f8f3d] text-white shadow-xl">
            <Icon name="check" className="h-12 w-12" />
          </div>

          <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-[#9a7654]">
            Order received
          </p>
          <h1 className="mb-4 text-4xl font-black text-[#5f432c]">
            We are preparing your Saba Chips.
          </h1>

          <div className="mx-auto mb-8 grid max-w-md gap-3 rounded-2xl border border-[#ead7b8] bg-[#fffaf2] p-5 text-left">
            <div className="flex justify-between text-[#6d4c2f]">
              <span>Order number</span>
              <span className="font-black text-[#5f432c]">#{orderId}</span>
            </div>
            <div className="flex justify-between text-[#6d4c2f]">
              <span>Total</span>
              <span className="font-black text-[#5f432c]">
                PHP {Number(finalTotal).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-[#6d4c2f]">
              <span>Payment</span>
              <span className="font-black text-[#5f432c]">
                {formData.paymentMethod}
              </span>
            </div>
            {formData.paymentMethod === "GCash" && (
              <div className="rounded-xl bg-[#fff6da] p-3 text-sm font-bold text-[#8b5e34]">
                Your payment proof is pending admin verification.
              </div>
            )}
          </div>

          <p className="mx-auto mb-8 max-w-lg text-[#6d4c2f]">
            You can check your profile for order history and status updates. The
            store can also message you if delivery details need confirmation.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/profile"
              className="rounded-2xl bg-[#8b5e34] py-4 font-black text-white transition hover:bg-[#714a28]"
            >
              View Order History
            </Link>

            <Link
              to="/home"
              className="rounded-2xl border border-[#d8be96] py-4 font-black text-[#8b5e34] transition hover:bg-[#fff7eb]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] border border-[#d8be96] bg-[#5f432c] p-8 text-white shadow-xl">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#ffe2ad]">
            Secure checkout
          </p>
          <h1 className="mb-3 text-4xl font-black md:text-5xl">
            Delivery and payment
          </h1>
          <p className="max-w-2xl text-[#fff1df]">
            Confirm your contact details so the store can prepare your order and
            coordinate delivery.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="rounded-[2rem] border border-[#ead7b8] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1dfc2] text-[#8b5e34]">
                <Icon name="receipt" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#5f432c]">
                  Order Summary
                </h2>
                <p className="text-sm text-[#7a5331]">{itemCount} pack(s)</p>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[72px_1fr_auto] gap-4 rounded-2xl border border-[#f1e3ca] bg-[#fffaf2] p-3"
                  >
                    <div className="flex h-18 w-18 items-center justify-center overflow-hidden rounded-xl bg-[#f8f2e8]">
                      {item.image ? (
                        <img
                          src={getMediaUrl(item.image)}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="px-2 text-center text-xs font-black text-[#8b5e34]">
                          Saba
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="truncate font-black text-[#5f432c]">
                        {item.name}
                      </h4>
                      <p className="text-sm text-[#6d4c2f]">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-xs text-[#7a5331]">
                        PHP {Number(item.price).toLocaleString()} each
                      </p>
                    </div>

                    <div className="text-right font-black text-[#8b5e34]">
                      PHP {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[#6d4c2f]">Your cart is empty.</p>
              )}
            </div>

            <div className="rounded-2xl border border-[#ead7b8] bg-[#fff7eb] p-5">
              <div className="mb-3 flex justify-between text-[#6d4c2f]">
                <span>Subtotal</span>
                <span className="font-black">PHP {total.toLocaleString()}</span>
              </div>
              <div className="mb-4 flex justify-between text-[#6d4c2f]">
                <span>Delivery</span>
                <span className="font-black">
                  {freeDelivery ? "Free" : "To be confirmed"}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#ead7b8] pt-4 text-3xl font-black text-[#5f432c]">
                <span>Total</span>
                <span>PHP {total.toLocaleString()}</span>
              </div>
            </div>
          </aside>

          <section className="rounded-[2rem] border border-[#ead7b8] bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-2 text-2xl font-black text-[#5f432c]">
              Customer Details
            </h2>
            <p className="mb-8 text-[#6d4c2f]">
              Accurate details help avoid delivery delays.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-black text-[#6d4c2f]">
                  Delivery Area
                </label>
                <select
                  value={formData.deliveryArea}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryArea: e.target.value })
                  }
                  className="input-field"
                >
                  {deliveryAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-[#7a5331]">
                  Free delivery currently covers Consolacion, Liloan, and
                  Compostela.
                </p>
              </div>

              <div>
                <label className="mb-3 block text-sm font-black text-[#6d4c2f]">
                  Complete Delivery Address *
                </label>
                <textarea
                  rows="4"
                  className="input-field resize-none"
                  placeholder="House number, street, barangay, landmark"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-black text-[#6d4c2f]">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="09xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-black text-[#6d4c2f]">
                  Order Notes
                </label>
                <textarea
                  rows="3"
                  className="input-field resize-none"
                  placeholder="Preferred delivery time, landmark, or special request"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-black text-[#6d4c2f]">
                  Payment Method
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-[#d8be96] bg-[#fffaf2] p-4">
                  <input
                    type="radio"
                    name="payment"
                    value="Cash on Delivery"
                    checked={formData.paymentMethod === "Cash on Delivery"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="h-5 w-5"
                  />
                  <span>
                    <span className="block font-black text-[#8b5e34]">
                      Cash on Delivery
                    </span>
                    <span className="text-sm text-[#6d4c2f]">
                      Pay when your order arrives.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-[#d8be96] bg-[#fffaf2] p-4">
                  <input
                    type="radio"
                    name="payment"
                    value="GCash"
                    checked={formData.paymentMethod === "GCash"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="h-5 w-5"
                  />
                  <span>
                    <span className="block font-black text-[#8b5e34]">
                      GCash
                    </span>
                    <span className="text-sm text-[#6d4c2f]">
                      Upload receipt for admin verification.
                    </span>
                  </span>
                </label>
                </div>

                {formData.paymentMethod === "GCash" && (
                  <div className="mt-4 rounded-2xl border border-[#e8c475] bg-[#fff6da] p-5">
                    <h3 className="font-black text-[#5f432c]">
                      Send payment to this GCash account
                    </h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-bold text-[#9a7654]">
                          Account name
                        </p>
                        <p className="mt-1 font-black text-[#5f432c]">
                          {paymentSettings.gcash?.accountName}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-bold text-[#9a7654]">
                          Number
                        </p>
                        <p className="mt-1 font-black text-[#5f432c]">
                          {paymentSettings.gcash?.number}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-bold text-[#9a7654]">
                          Amount
                        </p>
                        <p className="mt-1 font-black text-[#5f432c]">
                          PHP {total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[#6d4c2f]">
                      After sending payment in GCash, upload the receipt image
                      below. This keeps the process clear for both customer and
                      admin.
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label>
                        <span className="mb-2 block text-sm font-black text-[#6d4c2f]">
                          Reference number
                        </span>
                        <input
                          value={formData.paymentReference}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              paymentReference: e.target.value,
                            })
                          }
                          className="input-field"
                          placeholder="Optional GCash reference no."
                        />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-black text-[#6d4c2f]">
                          Receipt screenshot *
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              paymentProof: e.target.files?.[0] || null,
                            })
                          }
                          className="block w-full rounded-xl border border-[#d8be96] bg-white px-4 py-3 text-sm text-[#6d4c2f]"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-[#d8be96] bg-[#fffaf2] p-4">
                <input
                  type="checkbox"
                  checked={formData.saveProfile}
                  onChange={(e) =>
                    setFormData({ ...formData, saveProfile: e.target.checked })
                  }
                  className="mt-1 h-5 w-5"
                />
                <span>
                  <span className="block font-black text-[#8b5e34]">
                    Save as my default delivery details
                  </span>
                  <span className="text-sm text-[#6d4c2f]">
                    Next checkout will prefill this address and phone number.
                  </span>
                </span>
              </label>

              <div className="grid gap-3 rounded-2xl border border-[#ead7b8] bg-white p-4 sm:grid-cols-2">
                <div className="flex gap-3 text-sm text-[#6d4c2f]">
                  <Icon name="map" className="h-5 w-5 shrink-0 text-[#8b5e34]" />
                  Delivery details may be confirmed by message.
                </div>
                <div className="flex gap-3 text-sm text-[#6d4c2f]">
                  <Icon
                    name="shield"
                    className="h-5 w-5 shrink-0 text-[#8b5e34]"
                  />
                  Your order is created before stock is refreshed.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full rounded-2xl bg-[#8b5e34] py-5 text-xl font-black text-white transition hover:bg-[#714a28] disabled:opacity-60"
              >
                {loading
                  ? "Processing Order..."
                  : `Place Order - PHP ${total.toLocaleString()}`}
              </button>
            </form>

            <div className="mt-8 border-t border-[#ead7b8] pt-6 text-center">
              <Link
                to="/cart"
                className="font-black text-[#8b5e34] hover:text-[#714a28]"
              >
                Back to Cart
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
