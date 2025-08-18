import axios from 'axios';

// Utility functions for making API requests to the backend

const API_URL = import.meta.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Axios instance with base URL and default headers
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token to requests if available
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// GET request
export const fetchApi = async (endpoint) => {
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
};

// POST request
export const postApi = async (endpoint, data) => {
  try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error posting data to ${endpoint}:`, error);
    throw error;
  }
};

// PUT request
export const putApi = async (endpoint, data) => {
  try {
    const response = await apiClient.put(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating data at ${endpoint}:`, error);
    throw error;
  }
};

// DELETE request
export const deleteApi = async (endpoint) => {
  try {
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error deleting data at ${endpoint}:`, error);
    throw error;
  }
};

// Get the API base URL
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

// API endpoints for different features
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  admin: {
    dashboard: '/api/admin',
    createAdmin: '/api/admin/create',
    changePassword: '/api/admin/change-password',
  },
  doctor: {
    dashboard: '/doctor/dashboard',
    patientDetails: '/doctor/patient-details',
  },
  predict: {
    predictAlzheimer: '/predict/alzheimer',
  }
};
