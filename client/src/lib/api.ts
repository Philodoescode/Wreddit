// src/lib/api.ts
import axios from "axios";

// call the api anywhere you want to send the user request data to the backend server
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// THIS INTERCEPTOR AUTOMATICALLY ADDS THE JWT TOKEN TO EVERY REQUEST
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Special handling for FormData (prevents "boundary" corruption)
  if (config.data instanceof FormData) {
    config.headers["Content-Type"] = undefined;
    config.headers["content-type"] = undefined;

    // Prevent axios from altering form data
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
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;