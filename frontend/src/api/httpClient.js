import axios from "axios";

const httpClient = axios.create({
  baseURL: "/api",
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default httpClient;
