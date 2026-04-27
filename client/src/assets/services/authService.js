import axios from "axios";

const API = "/api/auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const registerUser = async (data) => {
  const res = await api.post(`${API}/register`, data);
  return res.data;
};

export const loginUser = async (data) => {
  const res = await api.post(`${API}/login`, data);
  return res.data;
};

export const logoutUser = async () => {
  const res = await api.post(`${API}/logout`);
  return res.data;
};

export const getMe = async () => {
  const res = await api.get(`${API}/me`);
  return res.data;
};

export const forgotPassword = async (email) => {
  const res = await api.post(`${API}/forgot-password`, { email });
  return res.data;
};

export const resetPassword = async (token, password) => {
  const res = await api.post(`${API}/reset-password/${token}`, { password });
  return res.data;
};

export default api;
