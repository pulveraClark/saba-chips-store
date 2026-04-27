import api from "./authService.js";

export const getWishlist = async () => {
  const res = await api.get("/api/wishlist");
  return res.data.productIds;
};

export const addWishlistItem = async (productId) => {
  const res = await api.post(`/api/wishlist/${productId}`);
  return res.data;
};

export const removeWishlistItem = async (productId) => {
  const res = await api.delete(`/api/wishlist/${productId}`);
  return res.data;
};
