// frontend/src/lib/axios.js
import axios from "axios";

const API_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

export const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});
