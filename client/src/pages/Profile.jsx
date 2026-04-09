import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMe } from "../assets/services/authService.js";
import { getUserOrders } from "../assets/services/orderService.js";

function Profile() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getMe();

      if (data.user) {
        setUser(data.user);

        try {
          const userOrders = await getUserOrders();
          setOrders(userOrders || []);
        } catch (orderErr) {
          console.error("Failed to fetch orders:", orderErr);
          setOrders([]);
        }
      } else {
        setError("Please login to view profile");
      }
    } catch (err) {
      setError("Please login to view profile");
    } finally {
      setLoading(false);
      setOrdersLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-2xl text-gray-600 animate-pulse">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            Your Profile
          </h1>
          <p className="text-xl text-gray-600">Manage your account & orders</p>
        </div>

        {error ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md mx-auto border-4 border-dashed border-gray-200">
            <div className="text-6xl mb-6 mx-auto">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
            <Link
              to="/login"
              className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg transform hover:scale-105 transition-all duration-200 inline-block"
            >
              Go to Login
            </Link>
          </div>
        ) : user ? (
          <div className="space-y-10">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-12 text-white text-center">
                <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full mx-auto flex items-center justify-center mb-6">
                  <span className="text-5xl">👤</span>
                </div>
                <h2 className="text-4xl font-bold mb-2">{user.name}</h2>
                <p className="text-xl opacity-90">{user.email}</p>
              </div>

              <div className="p-12">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Account Info
                    </h3>

                    <div className="space-y-4 text-lg">
                      <div>
                        <span className="font-semibold text-gray-600">
                          User ID:
                        </span>
                        <span className="ml-2 bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-mono text-sm">
                          {user.id}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-600">
                          Email:
                        </span>
                        <span className="ml-2 text-gray-900">{user.email}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-600">
                          Member since:
                        </span>
                        <span className="ml-2 text-green-600 font-bold">
                          {new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
                    <h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Order Summary
                    </h3>

                    <div className="space-y-4 text-lg">
                      <div className="flex justify-between">
                        <span className="font-semibold text-blue-700">
                          Total Orders:
                        </span>
                        <span className="font-bold text-blue-900">
                          {orders.length}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-semibold text-blue-700">
                          Latest Status:
                        </span>
                        <span className="font-bold text-blue-900 capitalize">
                          {orders.length > 0 ? orders[0].status : "No orders yet"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-semibold text-blue-700">
                          Total Spent:
                        </span>
                        <span className="font-bold text-blue-900">
                          ₱
                          {orders
                            .reduce((sum, order) => sum + Number(order.total), 0)
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-8">
                Order History
              </h3>

              {ordersLoading ? (
                <div className="text-center py-16 text-xl text-gray-600 animate-pulse">
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-6">📦</div>
                  <p className="text-xl text-gray-600 mb-6">No orders yet</p>
                  <Link
                    to="/home"
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg transform hover:scale-105 transition-all duration-200 inline-block"
                  >
                    Start Shopping →
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-2xl p-6 bg-gray-50"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                          <h4 className="text-2xl font-bold text-gray-900">
                            Order #{order.id}
                          </h4>
                          <p className="text-gray-600">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-black text-green-600">
                            ₱{Number(order.total).toLocaleString()}
                          </p>
                          <span
                          className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-bold capitalize ${
                            order.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "confirmed"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "shipped"
                              ? "bg-purple-100 text-purple-700"
                              : order.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center bg-white rounded-xl p-4 border border-gray-100"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">
                                {item.product}
                              </p>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity}
                              </p>
                            </div>

                            <p className="font-bold text-gray-900">
                              ₱{Number(item.price).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl text-gray-600">Loading user data...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;