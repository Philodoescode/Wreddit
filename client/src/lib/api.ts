import axios from 'axios'


// call the api anywhere you want to send the user request data to the backend server
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// CRITICAL FIX: Interceptor to automatically attach the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Get token from local storage
  
  if (token) {
    // Attach the token as a Bearer header for authentication
    config.headers.Authorization = `Bearer ${token}`; 
  }
  return config;
});

export default api;