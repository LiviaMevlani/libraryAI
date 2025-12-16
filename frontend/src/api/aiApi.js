// src/api/aiApi.js
import httpClient from "./httpClient";

export function askAiQuestion(question) {
  return httpClient.post("/ai/query", { question });
}

export function getRecommendations() {
  return httpClient.get("/ai/recommendations");
}

export function getInsights() {
  return httpClient.get("/ai/insights");
}
