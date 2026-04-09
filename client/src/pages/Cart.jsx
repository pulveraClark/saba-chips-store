import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../assets/services/cartService.js";
import { useCart } from "../context/CartContext.jsx";

function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const { refreshCartCount } = useCart();

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
      alert(err?.response?.data?.message || "Update failed");
      console.error("Update failed:", err);
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
      } catch (err) {
        console.error("Remove failed:", err);
      }
    }
  };

  const handleClearCart = async () => {
    if (confirm("Clear entire cart?")) {
      try {
        await clearCart();
        await fetchCart();
        await refreshCartCount();
      } catch (err) {
        console.error("Clear failed:", err);
      }
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600 animate-pulse">
          Loading cart...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              Shopping Cart
            </h1>
            <p className="text-xl text-gray-600">Review your items</p>
          </div>

          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 font-semibold text-lg px-6 py-2 rounded-xl hover:bg-red-50 transition-all"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-8xl mb-8 mx-auto w-32 h-32 bg-gray-200 rounded-3xl flex items-center justify-center">
              🛒
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Add some delicious Saba Chips to get started
            </p>
            <Link
              to="/home"
              className="btn-primary text-xl px-12 py-4 shadow-xl"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl shadow-card p-8 mb-12">
              <div className="space-y-6">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-6 p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-2xl transition-colors"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={`http://localhost:5000${item.image}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        "🍟"
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {item.description}
                      </p>
                      <p className="text-2xl font-black text-sabaGreen">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        disabled={updating[item.id] || item.quantity <= 1}
                        className="w-12 h-12 rounded-xl bg-gray-200 hover:bg-gray-300 text-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>

                      <span className="text-xl font-bold text-gray-900 min-w-[2.5rem] text-center">
                        {updating[item.id] ? "..." : item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        disabled={updating[item.id]}
                        className="w-12 h-12 rounded-xl bg-gray-200 hover:bg-gray-300 text-xl font-bold transition-all disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-card p-8 max-w-md mx-auto">
              <div className="space-y-4">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total Items:</span>
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>

                <div className="flex justify-between text-3xl font-black text-sabaGreen">
                  <span>Total:</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>

                <Link
                  to="/checkout"
                  className="btn-primary w-full text-xl py-5 shadow-2xl mt-6 block text-center"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;