import axios from "axios";

const API = "/api/auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let csrfToken = null;
let csrfTokenPromise = null;

const unsafeMethods = new Set(["post", "put", "patch", "delete"]);

const fetchCsrfToken = async () => {
  if (csrfToken) {
    return csrfToken;
  }

  if (!csrfTokenPromise) {
    csrfTokenPromise = api
      .get(`${API}/csrf-token`)
      .then((res) => {
        csrfToken = res.data.csrfToken;
        return csrfToken;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
};

api.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();
  if (unsafeMethods.has(method)) {
    const token = await fetchCsrfToken();
    config.headers = config.headers || {};
    config.headers["x-csrf-token"] = token;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 403) {
      csrfToken = null;
    }
    return Promise.reject(error);
  }
);

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

export const updateMe = async (data) => {
  const res = await api.put(`${API}/me`, data);
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
