// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// THIS INTERCEPTOR AUTOMATICALLY ADDS THE JWT TOKEN TO EVERY REQUEST
// src/lib/api.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    // Prevent Axios from adding a bad Content-Type without boundary
    config.headers["Content-Type"] = undefined;
    config.headers["content-type"] = undefined;

    // Crucial: stop Axios from transforming the FormData at all
    config.transformRequest = [(data: any) => data];
  }

  return config;
});

// Optional: nice error handling for 401 (auto logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // optional: redirect to home or show login modal
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;