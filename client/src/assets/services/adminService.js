import api from "./authService.js";

const API = "/api/admin";

export const getAllUsers = async () => {
  const res = await api.get(`${API}/users`);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await api.put(`${API}/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`${API}/users/${id}`);
  return res.data;
};