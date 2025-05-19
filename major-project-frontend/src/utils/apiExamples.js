// Example of using API utilities with environment variables
import { fetchApi, postApi } from './apiUtils';

/**
 * Example function showing how to use process.env.NEXT_PUBLIC_API_URL directly
 * This approach works in Next.js environment
 */
export const fetchDataUsingNextPublicEnv = async () => {
  try {
    // Example using process.env.NEXT_PUBLIC_API_URL directly
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/your-endpoint`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

/**
 * Example function showing how to use Vite environment variables
 * This approach works in Vite environment
 */
export const fetchDataUsingViteEnv = async () => {
  try {
    // Example using import.meta.env.VITE_API_URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/your-endpoint`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

/**
 * Recommended approach: Use the centralized API utility
 * This handles environment variables for you automatically
 */
export const fetchDataRecommendedWay = async () => {
  try {
    // Using the utility function that handles API URL for you
    const data = await fetchApi('/api/your-endpoint');
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

/**
 * Example for posting data
 */
export const postDataExample = async (payload) => {
  try {
    const result = await postApi('/api/your-endpoint', payload);
    return result;
  } catch (error) {
    console.error('Error posting data:', error);
    throw error;
  }
};
