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
const csrfErrorMessage = "Invalid security token. Please refresh and try again.";

const clearCsrfToken = () => {
  csrfToken = null;
  csrfTokenPromise = null;
};

const fetchCsrfToken = async ({ force = false } = {}) => {
  if (force) {
    clearCsrfToken();
  }

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
    const originalRequest = error?.config;
    const method = originalRequest?.method?.toLowerCase();
    const message = error?.response?.data?.message;
    const isCsrfError =
      error?.response?.status === 403 && message === csrfErrorMessage;

    if (error?.response?.status === 403) {
      clearCsrfToken();
    }

    if (
      isCsrfError &&
      originalRequest &&
      unsafeMethods.has(method) &&
      !originalRequest.__csrfRetry
    ) {
      originalRequest.__csrfRetry = true;

      try {
        const token = await fetchCsrfToken({ force: true });
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["x-csrf-token"] = token;
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
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

export const initializeCsrfToken = async () => {
  await fetchCsrfToken();
};

export const logoutUser = async () => {
  try {
    const res = await api.post(`${API}/logout`);
    return res.data;
  } finally {
    clearCsrfToken();
  }
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
