import axios from 'axios';

// This file contains utility functions for making API requests to the backend.
// It ensures consistent request handling and simplifies integration with backend endpoints.

// Fetch the base API URL from environment variables. If not set, default to localhost.
const API_URL = import.meta.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL;

// Create a pre-configured axios instance for making HTTP requests.
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json' // Default content type for requests.
  }
});

// Automatically add the authentication token to requests if available.
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Attach token for secure endpoints.
  }
  return config;
});

// Perform a GET request to the specified endpoint and return the response data.
export const fetchApi = async (endpoint) => {
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error; // Propagate error for handling by the caller.
  }
};

// Perform a POST request to the specified endpoint with the provided data.
export const postApi = async (endpoint, data) => {
  try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error posting data to ${endpoint}:`, error);
    throw error; // Propagate error for handling by the caller.
  }
};

// Perform a PUT request to update data at the specified endpoint.
export const putApi = async (endpoint, data) => {
  try {
    const response = await apiClient.put(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating data at ${endpoint}:`, error);
    throw error; // Propagate error for handling by the caller.
  }
};

// Perform a DELETE request to remove data at the specified endpoint.
export const deleteApi = async (endpoint) => {
  try {
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error deleting data at ${endpoint}:`, error);
    throw error; // Propagate error for handling by the caller.
  }
};

// Retrieve the base API URL for backend integration.
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

// Define backend endpoints for various functionalities.
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  admin: {
    dashboard: '/api/admin', // Updated from '/admin/dashboard' to '/api/admin'
    createAdmin: '/api/admin/create',
  },
  doctor: {
    dashboard: '/doctor/dashboard',
    patientDetails: '/doctor/patient-details',
  },
  predict: {
    predictAlzheimer: '/predict/alzheimer',
  }
};

// Example usage of the utility functions:
// import { fetchApi, postApi } from '../utils/apiUtils';
//
// // Fetch data from an endpoint.
// const data = await fetchApi('/api/your-endpoint');
//
// // Submit data to an endpoint.
// const result = await postApi('/api/your-endpoint', { key: 'value' });
