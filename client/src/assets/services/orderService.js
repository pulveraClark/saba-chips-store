import api from "./authService.js";

export const checkout = async (orderData) => {
  const res = await api.post("/api/orders/checkout", orderData);
  return res.data;
};

export const getUserOrders = async () => {
  const res = await api.get("/api/orders");
  return res.data.orders;
};

// ADMIN
export const getAllOrders = async () => {
  const res = await api.get("/api/orders/admin/all");
  return res.data.orders;
};

export const updateOrderStatus = async (orderId, status) => {
  const res = await api.put(`/api/orders/admin/${orderId}/status`, { status });
  return res.data;
};