import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../assets/services/cartService.js";
import { useCart } from "../context/CartContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import { getMediaUrl } from "../utils/media.js";

const iconPaths = {
  bag: "M6 8h12l-1 13H7L6 8Zm3 0a3 3 0 0 1 6 0",
  shield: "M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z",
  truck: "M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
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

function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const { refreshCartCount } = useCart();
  const { notify } = useNotification();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const cartItems = await getCart();
      setCart(cartItems || []);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (id, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      await updateCartItem(id, newQuantity);
      await fetchCart();
      await refreshCartCount();
    } catch (err) {
      notify({
        type: "error",
        title: "Cart Update Failed",
        message: err?.response?.data?.message || "Update failed",
      });
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleRemove = async (id) => {
    if (confirm("Remove this item?")) {
      try {
        await removeCartItem(id);
        await fetchCart();
        await refreshCartCount();
        notify({
          type: "success",
          title: "Item Removed",
          message: "The product was removed from your cart.",
        });
      } catch (err) {
        notify({
          type: "error",
          title: "Remove Failed",
          message: err?.response?.data?.message || "Remove failed",
        });
      }
    }
  };

  const handleClearCart = async () => {
    if (confirm("Clear entire cart?")) {
      try {
        await clearCart();
        await fetchCart();
        await refreshCartCount();
        notify({
          type: "success",
          title: "Cart Cleared",
          message: "All items were removed from your cart.",
        });
      } catch (err) {
        notify({
          type: "error",
          title: "Clear Failed",
          message: err?.response?.data?.message || "Clear failed",
        });
      }
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8]">
        <div className="rounded-2xl border border-[#ead7b8] bg-white px-6 py-4 text-xl font-black text-[#8b5e34] shadow-sm">
          Loading cart...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 rounded-[2rem] border border-[#d8be96] bg-[#5f432c] p-8 text-white shadow-xl">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#ffe2ad]">
            Order Review
          </p>
          <h1 className="mb-3 text-4xl font-black md:text-5xl">Your Cart</h1>
          <p className="max-w-2xl text-[#fff1df]">
            Check quantities, remove items you no longer want, then continue to
            delivery and payment details.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-[2rem] border border-[#ead7b8] bg-white px-8 py-24 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f1dfc2] text-[#8b5e34]">
              <Icon name="bag" className="h-9 w-9" />
            </div>
            <h2 className="mb-4 text-3xl font-black text-[#8b5e34]">
              Your cart is empty
            </h2>
            <p className="mb-8 text-lg text-[#6d4c2f]">
              Add freshly cooked Saba Chips to start your order.
            </p>
            <Link
              to="/home#products"
              className="inline-flex rounded-2xl bg-[#8b5e34] px-10 py-4 font-black text-white transition hover:bg-[#714a28]"
            >
              Shop Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.55fr_0.9fr]">
            <div className="overflow-hidden rounded-[2rem] border border-[#ead7b8] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#ead7b8] bg-[#fff7eb] px-6 py-5">
                <div>
                  <h2 className="text-2xl font-black text-[#5f432c]">
                    Cart Items
                  </h2>
                  <p className="text-sm text-[#7a5331]">
                    {itemCount} total pack(s) in this order
                  </p>
                </div>
                <button
                  onClick={handleClearCart}
                  className="rounded-full px-4 py-2 text-sm font-black text-[#b6402e] hover:bg-[#fff0ec]"
                >
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-[#f1e3ca]">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-5 p-6 md:grid-cols-[112px_1fr_auto] md:items-center"
                  >
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-[#f8f2e8]">
                      {item.image ? (
                        <img
                          src={getMediaUrl(item.image)}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="px-3 text-center text-sm font-black text-[#8b5e34]">
                          Saba Chips
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="mb-1 text-xl font-black text-[#5f432c]">
                        {item.name}
                      </h3>
                      <p className="mb-4 text-sm leading-relaxed text-[#6d4c2f]">
                        {item.description || "Freshly cooked banana chips"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-2xl font-black text-[#8b5e34]">
                          PHP {(item.price * item.quantity).toLocaleString()}
                        </p>
                        <span className="rounded-full bg-[#fff7eb] px-3 py-1 text-xs font-bold text-[#7a5331]">
                          PHP {Number(item.price).toLocaleString()} each
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <div className="flex items-center rounded-2xl border border-[#d8be96] bg-[#fffaf2] p-1">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          disabled={updating[item.id] || item.quantity <= 1}
                          className="h-10 w-10 rounded-xl font-black text-[#8b5e34] hover:bg-white disabled:opacity-40"
                        >
                          -
                        </button>

                        <span className="min-w-10 text-center font-black text-[#5f432c]">
                          {updating[item.id] ? "..." : item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          disabled={updating[item.id]}
                          className="h-10 w-10 rounded-xl font-black text-[#8b5e34] hover:bg-white disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        className="rounded-full px-4 py-2 text-sm font-black text-[#b6402e] hover:bg-[#fff0ec]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="h-fit rounded-[2rem] border border-[#ead7b8] bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-black text-[#5f432c]">
                Order Summary
              </h2>

              <div className="mb-6 space-y-4">
                <div className="flex justify-between text-[#6d4c2f]">
                  <span>Unique products</span>
                  <span className="font-black">{cart.length}</span>
                </div>
                <div className="flex justify-between text-[#6d4c2f]">
                  <span>Total packs</span>
                  <span className="font-black">{itemCount}</span>
                </div>
                <div className="flex justify-between text-[#6d4c2f]">
                  <span>Delivery</span>
                  <span className="font-black">Calculated at checkout</span>
                </div>
                <div className="border-t border-[#ead7b8] pt-5">
                  <div className="flex justify-between text-3xl font-black text-[#5f432c]">
                    <span>Total</span>
                    <span>PHP {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full rounded-2xl bg-[#8b5e34] py-4 text-center font-black text-white transition hover:bg-[#714a28]"
              >
                Proceed to Checkout
              </Link>

              <div className="mt-6 grid gap-3">
                {[
                  ["truck", "Free delivery in Consolacion, Liloan, and Compostela"],
                  ["shield", "Cash on Delivery & GCAsh available for local orders"],
                ].map(([icon, text]) => (
                  <div
                    key={text}
                    className="flex gap-3 rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#6d4c2f]"
                  >
                    <Icon name={icon} className="h-5 w-5 shrink-0 text-[#8b5e34]" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
