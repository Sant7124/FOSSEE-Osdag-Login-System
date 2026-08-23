import axios from 'axios';

// Create a configured axios instance
// The base URL relies on the Vite proxy in development
// In production, the client will be served from the same domain, so relative paths work automatically.
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Crucial: ensures HttpOnly cookies are sent with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (Optional, for logging or modifying requests)
api.interceptors.request.use((config) => {
  return config;
});

// Response interceptor to handle common errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // We can centrally handle 401 Unauthorized if needed, but we typically let the AuthContext handle it
    // by catching the error in the refreshUser flow or by dispatching an event.
    
    // Normalize error response
    if (error.response && error.response.data && error.response.data.message) {
      error.message = error.response.data.message;
    }
    
    return Promise.reject(error);
  }
);
