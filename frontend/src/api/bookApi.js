import httpClient from "./httpClient";

export function getMyBooks() {
  return httpClient.get("/books/");
}

export function createBook(payload) {
  return httpClient.post("/books/", payload);
}

export function deleteBook(id) {
  return httpClient.delete(`/books/${id}`);
}
