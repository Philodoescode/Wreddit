import axios from 'axios'


//call the api anywhere you want to send the user request data to the backend server
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export default api;