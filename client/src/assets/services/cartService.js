import api from "./authService.js";

export const addToCart = async (productId, quantity = 1) => {
  const res = await api.post("/api/cart/add", { productId, quantity });
  return res.data;
};

export const getCart = async () => {
  const res = await api.get("/api/cart");
  return res.data.cart;
};

export const updateCartItem = async (id, quantity) => {
  const res = await api.put(`/api/cart/item/${id}`, { quantity });
  return res.data;
};

export const removeCartItem = async (id) => {
  const res = await api.delete(`/api/cart/item/${id}`);
  return res.data;
};

export const clearCart = async () => {
  const res = await api.delete("/api/cart");
  return res.data;
};