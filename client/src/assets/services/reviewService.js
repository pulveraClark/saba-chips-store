import api from "./authService.js";

export const createReview = async ({ orderId, productId, rating, comment, image }) => {
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("productId", productId);
  formData.append("rating", rating);
  formData.append("comment", comment || "");
  if (image instanceof File) {
    formData.append("image", image);
  }

  const res = await api.post("/api/reviews", formData, {
    headers: { "Content-Type": "multipart/form-data" },
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
