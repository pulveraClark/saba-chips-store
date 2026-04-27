import api from "./authService.js";

// GET
export const getProducts = async () => {
  const res = await api.get("/api/products");
  return res.data.products;
};

export const getTopSellingProducts = async (limit = 5) => {
  const res = await api.get("/api/products/top-selling", {
    params: { limit },
  });
  return res.data.products;
};

// CREATE
export const createProduct = async (formData) => {
  const res = await api.post("/api/products", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

// UPDATE
export const updateProduct = async (id, formData) => {
  const res = await api.put(`/api/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

// DELETE
export const deleteProduct = async (id) => {
  const res = await api.delete(`/api/products/${id}`);
  return res.data;
};
