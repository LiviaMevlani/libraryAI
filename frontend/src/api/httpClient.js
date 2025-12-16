import axios from "axios";

const httpClient = axios.create({
  baseURL: "http://127.0.0.1:5001/api",
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default httpClient;
