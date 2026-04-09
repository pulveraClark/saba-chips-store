import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCart, clearCart } from "../assets/services/cartService.js";
import { checkout as placeOrder } from "../assets/services/orderService.js";
import { useCart } from "../context/CartContext.jsx";
import { useProducts } from "../context/ProductContext.jsx";

function Checkout() {
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    address: "",
    phone: "",
    paymentMethod: "Cash on Delivery",
  });
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [finalTotal, setFinalTotal] = useState(0);

  const { refreshCartCount } = useCart();
  const { refreshProducts } = useProducts();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const cartItems = await getCart();
      setCart(cartItems || []);
    } catch (err) {
      console.error("Cart fetch failed:", err);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.address || !formData.phone) {
      alert("Please fill all fields");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setLoading(true);

    try {
      const result = await placeOrder(formData);
      setFinalTotal(result.total || total);
      setOrderId(result.orderId || "N/A");

      await clearCart();
      await refreshCartCount();
      await refreshProducts();

      setCart([]);
      setOrderSuccess(true);
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Please try again";
      alert("Checkout failed: " + message);
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#f8f2e8] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-12 text-center border border-[#ead7b8]">
          <div className="w-28 h-28 bg-gradient-to-r from-[#8b5e34] to-[#b8834d] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <span className="text-4xl text-white">✅</span>
          </div>

          <h1 className="text-4xl font-black text-[#8b5e34] mb-4">
            Order Confirmed!
          </h1>

          <p className="text-xl text-[#6d4c2f] mb-2">Order #{orderId}</p>

          <p className="text-2xl font-bold text-[#8b5e34] mb-8">
            Total: ₱{finalTotal.toLocaleString()}
          </p>

          <div className="space-y-4">
            <Link
              to="/home"
              className="block w-full bg-[#8b5e34] text-white text-xl py-4 rounded-2xl font-semibold hover:bg-[#714a28] transition"
            >
              Continue Shopping
            </Link>

            <Link
              to="/profile"
              className="block w-full text-center text-[#8b5e34] font-medium py-4 border border-[#d8be96] rounded-2xl hover:bg-[#fff7eb] transition"
            >
              View Order History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-12 px-4">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-3xl shadow-xl border border-[#ead7b8] p-8">
          <h2 className="text-2xl font-black text-[#8b5e34] mb-8">
            Order Summary
          </h2>

          <div className="space-y-5 mb-10">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-4 bg-[#fffaf2] rounded-2xl border border-[#f1e3ca]"
                >
                  <div className="w-20 h-20 bg-[#f8f2e8] rounded-xl flex items-center justify-center overflow-hidden">
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
                    <h4 className="font-semibold text-[#8b5e34] text-lg truncate">
                      {item.name}
                    </h4>
                    <p className="text-sm text-[#6d4c2f]">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-[#8b5e34]">
                      ₱{(item.price * item.quantity).toLocaleString()}
                    </div>
                    <div className="text-sm text-[#7a5331]">
                      ₱{item.price.toLocaleString()} each
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#6d4c2f]">Your cart is empty.</p>
            )}
          </div>

          <div className="bg-[#fff7eb] p-6 rounded-2xl border border-[#ead7b8]">
            <div className="flex justify-between text-2xl font-black text-[#8b5e34] mb-2">
              <span>Total:</span>
              <span>₱{total.toLocaleString()}</span>
            </div>
            <p className="text-sm text-[#6d4c2f]">Includes all taxes and fees</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-[#ead7b8] p-8">
          <h2 className="text-2xl font-black text-[#8b5e34] mb-8">
            Shipping & Payment
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#6d4c2f] mb-3">
                Delivery Address *
              </label>
              <textarea
                rows="3"
                className="input-field resize-none"
                placeholder="House number, street, barangay, city, postal code"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#6d4c2f] mb-3">
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
              <label className="block text-sm font-semibold text-[#6d4c2f] mb-3">
                Payment Method
              </label>

              <label className="flex items-center p-4 border border-[#d8be96] rounded-2xl bg-[#fffaf2] cursor-pointer">
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
                  className="w-5 h-5 mr-4"
                />
                <div>
                  <div className="font-semibold text-[#8b5e34]">
                    Cash on Delivery
                  </div>
                  <div className="text-sm text-[#6d4c2f]">
                    Pay when delivered
                  </div>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full bg-[#8b5e34] text-white text-xl py-5 rounded-2xl font-bold hover:bg-[#714a28] transition disabled:opacity-60"
            >
              {loading
                ? "Processing Order..."
                : `Place Order • ₱${total.toLocaleString()}`}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-[#ead7b8] text-center">
            <Link
              to="/cart"
              className="text-[#8b5e34] hover:text-[#714a28] font-medium"
            >
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;