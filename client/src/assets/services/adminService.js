import api from "./authService.js";

const API = "/api/admin";

export const getAllUsers = async (page = 1, limit = 5, search = "") => {
  const res = await api.get(`${API}/users`, {
    params: { page, limit, search },
  });
  return res.data;
};

export const getActivityLogs = async () => {
  const res = await api.get(`${API}/activity-logs`);
  return res.data.logs;
};

export const updateUser = async (id, data) => {
  const res = await api.put(`${API}/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`${API}/users/${id}`);
  return res.data;
};

export const getAdminSummary = async () => {
  const res = await api.get(`${API}/reports/summary`);
  return res.data;
};

export const getTransactionHistory = async () => {
  const res = await api.get(`${API}/reports/transactions`);
  return res.data.transactions;
};

export const getSalesChartData = async () => {
  const res = await api.get(`${API}/reports/charts/sales`);
  return res.data.salesChart;
};

export const getOrderStatusChartData = async () => {
  const res = await api.get(`${API}/reports/charts/status`);
  return res.data.orderStatusChart;
};

export const getTopProductsChartData = async () => {
  const res = await api.get(`${API}/reports/charts/top-products`);
  return res.data.topProductsChart;
};

export const getAdvancedInsights = async () => {
  const res = await api.get(`${API}/reports/advanced-insights`);
  return res.data;
};