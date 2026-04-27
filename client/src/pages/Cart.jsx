import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../assets/services/cartService.js";
import { useCart } from "../context/CartContext.jsx";
import { getMediaUrl } from "../utils/media.js";

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
        alert(err?.response?.data?.message || "Remove failed");
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
        alert(err?.response?.data?.message || "Clear failed");
      }
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f2e8] flex items-center justify-center">
        <div className="text-2xl text-[#8b5e34] animate-pulse">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] rounded-[2rem] p-8 text-white shadow-xl mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-3">Your Cart</h1>
          <p className="text-[#fff1df] text-lg">
            Review your selected Saba Chips before checkout.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl border border-[#ead7b8] text-center py-24 px-8">
            <div className="text-7xl mb-6">🛒</div>
            <h2 className="text-3xl font-black text-[#8b5e34] mb-4">
              Your cart is empty
            </h2>
            <p className="text-[#6d4c2f] text-lg mb-8">
              Add some delicious Saba Chips to get started.
            </p>
            <Link
              to="/home"
              className="inline-block bg-[#8b5e34] text-white px-10 py-4 rounded-2xl font-semibold hover:bg-[#714a28] transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.6fr_0.9fr] gap-8">
            <div className="bg-white rounded-3xl shadow-xl border border-[#ead7b8] overflow-hidden">
              <div className="flex items-center justify-between px-8 py-6 bg-[#fff7eb] border-b border-[#ead7b8]">
                <h2 className="text-2xl font-black text-[#8b5e34]">
                  Cart Items
                </h2>
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-[#f1e3ca]">
                {cart.map((item) => (
                  <div key={item.id} className="p-6 flex gap-5 items-center">
                    <div className="w-24 h-24 bg-[#f8f2e8] rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={getMediaUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">🍟</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-[#8b5e34] mb-1">
                        {item.name}
                      </h3>
                      <p className="text-[#6d4c2f] text-sm mb-3">
                        {item.description || "Freshly cooked banana chips"}
                      </p>
                      <p className="text-2xl font-black text-[#8b5e34]">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        disabled={updating[item.id] || item.quantity <= 1}
                        className="w-11 h-11 rounded-xl bg-[#ead7b8] text-[#8b5e34] font-bold disabled:opacity-50"
                      >
                        -
                      </button>

                      <span className="min-w-[2rem] text-center text-lg font-bold text-[#8b5e34]">
                        {updating[item.id] ? "..." : item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        disabled={updating[item.id]}
                        className="w-11 h-11 rounded-xl bg-[#ead7b8] text-[#8b5e34] font-bold disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-red-500 hover:text-red-600 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-[#ead7b8] p-8 h-fit">
              <h2 className="text-2xl font-black text-[#8b5e34] mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[#6d4c2f]">
                  <span>Unique Products</span>
                  <span className="font-semibold">{cart.length}</span>
                </div>
                <div className="flex justify-between text-[#6d4c2f]">
                  <span>Total Items</span>
                  <span className="font-semibold">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-3xl font-black text-[#8b5e34] pt-4 border-t border-[#ead7b8]">
                  <span>Total</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full text-center bg-[#8b5e34] text-white py-4 rounded-2xl font-semibold hover:bg-[#714a28] transition"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
