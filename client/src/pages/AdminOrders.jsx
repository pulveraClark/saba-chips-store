import { useEffect, useState } from "react";
import { getAllOrders, updateOrderStatus } from "../assets/services/orderService.js";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Failed to update order status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600 animate-pulse">
          Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">
          Manage Orders
        </h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-600">
            No orders found.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow p-6 border border-gray-100"
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-bold text-gray-900">#{order.id}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-bold text-gray-900">{order.customer_name}</p>
                    <p className="text-sm text-gray-600">{order.customer_email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-green-600">
                      ₱{Number(order.total).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Created At</p>
                    <p className="font-medium text-gray-900">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900">{order.address}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{order.phone}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="text-gray-900">{order.payment_method}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Current Status</p>
                    <span
                         className={`inline-block px-4 py-2 rounded-full font-semibold capitalize ${
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

                  <div className="flex items-center gap-3">
                    <select
                        defaultValue={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className={`border rounded-xl px-4 py-2 font-medium ${
                            order.status === "pending"
                            ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                            : order.status === "confirmed"
                            ? "border-blue-300 bg-blue-50 text-blue-700"
                            : order.status === "shipped"
                            ? "border-purple-300 bg-purple-50 text-purple-700"
                            : order.status === "delivered"
                            ? "border-green-300 bg-green-50 text-green-700"
                            : "border-gray-300 bg-white text-gray-700"
                        }`}
                        >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="shipped">shipped</option>
                        <option value="delivered">delivered</option>
                    </select>

                    {updatingId === order.id && (
                      <span className="text-sm text-gray-500">Updating...</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrders;