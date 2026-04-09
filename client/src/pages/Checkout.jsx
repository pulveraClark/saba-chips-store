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

    setLoading(true);

    try {
      const result = await placeOrder(formData);
      setFinalTotal(result.total || total);
      setOrderId(result.orderId);

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="w-28 h-28 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          <p className="text-xl text-gray-600 mb-2">Order #{orderId}</p>
          <p className="text-2xl font-bold text-sabaGreen mb-8">
            Total: ₱{finalTotal.toLocaleString()}
          </p>

          <div className="space-y-4">
            <Link to="/home" className="block w-full btn-primary text-xl py-4">
              Continue Shopping
            </Link>
            <Link
              to="/profile"
              className="block w-full text-center text-gray-700 font-medium hover:text-gray-900 py-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all"
            >
              View Order History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        <div className="bg-white rounded-3xl shadow-card p-8 lg:sticky lg:top-28 lg:max-h-screen lg:overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Order Summary ({cart.length} items)
          </h2>

          <div className="space-y-6 mb-12">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
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
                  <h4 className="font-semibold text-gray-900 text-lg truncate">
                    {item.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-1">
                    Qty: {item.quantity}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-sabaGreen">
                    ₱{(item.price * item.quantity).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    ₱{item.price.toLocaleString()} each
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-sabaGreen/5 p-6 rounded-2xl border border-sabaGreen/20">
            <div className="flex justify-between text-2xl font-black text-gray-900 mb-4">
              <span>Total:</span>
              <span className="text-sabaGreen">₱{total.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-600">Includes all taxes and fees</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Shipping & Payment
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
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
              <label className="block text-sm font-semibold text-gray-700 mb-3">
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
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Payment Method
              </label>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-2xl cursor-pointer">
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
                    <div className="font-semibold text-gray-900">
                      Cash on Delivery
                    </div>
                    <div className="text-sm text-gray-600">
                      Pay when delivered
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="btn-primary w-full text-xl py-6 shadow-2xl mt-8 font-bold"
            >
              {loading
                ? "Processing Order..."
                : `Place Order • ₱${total.toLocaleString()}`}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <Link
              to="/cart"
              className="text-gray-600 hover:text-gray-900 font-medium"
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