import httpClient from "./httpClient";

export function registerUser(data) {
  return httpClient.post("/auth/register", data);
}

export function loginUser(data) {
  return httpClient.post("/auth/login", data);
}

export function getMe() {
  return httpClient.get("/auth/me");
}
