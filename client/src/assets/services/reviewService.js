import api from "./authService.js";

export const createReview = async ({ orderId, productId, rating, comment }) => {
  const res = await api.post("/api/reviews", {
    orderId,
    productId,
    rating,
    comment,
  });
  return res.data;
};

export const getProductReviews = async (productId) => {
  const res = await api.get(`/api/reviews/products/${productId}`);
  return res.data.reviews;
};

export const getAdminReviews = async () => {
  const res = await api.get("/api/reviews/admin");
  return res.data.reviews;
};
