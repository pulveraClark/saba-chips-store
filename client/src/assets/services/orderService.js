import api from "./authService.js";

export const checkout = async (orderData) => {
  const res = await api.post("/api/orders/checkout", orderData, {
    headers:
      orderData instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
  });
  return res.data;
};

export const getPaymentSettings = async () => {
  const res = await api.get("/api/orders/payment-settings");
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

export const reviewPayment = async (orderId, decision, note = "") => {
  const res = await api.put(`/api/orders/admin/${orderId}/payment`, {
    decision,
    note,
  });
  return res.data;
};

export const markRefunded = async (orderId, note = "") => {
  const res = await api.put(`/api/orders/admin/${orderId}/refund`, { note });
  return res.data;
};

export const requestOrderCancellation = async (orderId, reason) => {
  const res = await api.post(`/api/orders/${orderId}/cancellation-requests`, {
    reason,
  });
  return res.data;
};

export const reviewCancellationRequest = async (requestId, decision, adminNote = "") => {
  const res = await api.put(`/api/orders/admin/cancellation-requests/${requestId}`, {
    decision,
    adminNote,
  });
  return res.data;
};
