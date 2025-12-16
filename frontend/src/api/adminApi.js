// src/api/adminApi.js
import httpClient from "./httpClient";

export function getAllUsers() {
  return httpClient.get("/admin/users");
}

export function createUserAdmin(data) {
  return httpClient.post("/admin/users", data);
}

export function updateUserRole(userId, role) {
  return httpClient.patch(`/admin/users/${userId}`, { role });
}

export function deleteUserAdmin(userId) {
  return httpClient.delete(`/admin/users/${userId}`);
}

export function getAllBooksAdmin() {
  return httpClient.get("/admin/books");
}

export function deleteBookAdmin(bookId) {
  return httpClient.delete(`/admin/books/${bookId}`);
}
