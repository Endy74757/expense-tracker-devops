import axios from 'axios';

const API_BASE_URL = '/api'; // Your API Gateway URL

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const login = async (email, password) => {
  try {
    const response = await api.post('/user/login', { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add other API calls here
