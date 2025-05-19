// API utility for making consistent requests to the backend
import axios from 'axios';

// Get base API URL from environment variables with fallback
const API_URL = import.meta.env.VITE_API_URL || 
                process.env.NEXT_PUBLIC_API_URL || 
                'http://localhost:5000';

// Create a pre-configured axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests automatically when available
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper for GET requests
export const fetchApi = async (endpoint) => {
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

// Helper for POST requests
export const postApi = async (endpoint, data) => {
  try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error posting to ${endpoint}:`, error);
    throw error;
  }
};

// Helper for PUT requests
export const putApi = async (endpoint, data) => {
  try {
    const response = await apiClient.put(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating ${endpoint}:`, error);
    throw error;
  }
};

// Helper for DELETE requests
export const deleteApi = async (endpoint) => {
  try {
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error deleting ${endpoint}:`, error);
    throw error;
  }
};

// Example usage:
// import { fetchApi, postApi } from '../utils/apiUtils';
//
// // GET example
// const data = await fetchApi('/api/your-endpoint');
//
// // POST example
// const result = await postApi('/api/your-endpoint', { key: 'value' });
