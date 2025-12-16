// src/features/ai/AiPanel.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { askAiQuestion, getRecommendations, getInsights } from "../../api/aiApi";
import { useAuth } from "../../context/AuthContext";

export default function AiPanel() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recError, setRecError] = useState("");
  const [recLoading, setRecLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);

  const { data: recommendations, refetch: refetchRecs } = useQuery({
    queryKey: ["ai-recommendations"],
    queryFn: async () => {
      const res = await getRecommendations();
      return res.data;
    },
    enabled: false,
  });

  const { data: insights, refetch: refetchInsights } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      const res = await getInsights();
      return res.data;
    },
    enabled: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    try {
      setLoading(true);
      const res = await askAiQuestion(question.trim());
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError("AI error: " + (err.response?.data?.message || "Something went wrong."));
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    setRecError("");
    setRecLoading(true);
    try {
      await refetchRecs();
    } catch (err) {
      console.error("Recommendations error:", err);
      setRecError(err.response?.data?.message || "Failed to get recommendations.");
    } finally {
      setRecLoading(false);
    }
  };

  const handleGetInsights = async () => {
    setInsightsError("");
    setInsightsLoading(true);
    try {
      await refetchInsights();
    } catch (err) {
      console.error("Insights error:", err);
      setInsightsError(err.response?.data?.message || "Failed to get insights.");
    } finally {
      setInsightsLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;

    if (result.type === "owner_with_most_books") {
      return (
        <div style={cardStyle}>
          <h3 style={{ color: "#f9fafb" }}>Owner with most books</h3>
          <p style={{ color: "#d1d5db" }}>
            <strong>{result.user.name}</strong> ({result.user.email}) owns{" "}
            <strong>{result.book_count}</strong> book
            {result.book_count !== 1 ? "s" : ""}.
          </p>
          {result.scope && (
            <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "8px" }}>
              {result.scope === "all_users" ? "📊 All users" : "📚 Your books"}
            </p>
          )}
        </div>
      );
    }

    if (result.type === "most_popular_book") {
      return (
        <div style={cardStyle}>
          <h3 style={{ color: "#f9fafb" }}>Most popular book</h3>
          <p style={{ color: "#d1d5db" }}>
            <strong>{result.title}</strong> appears <strong>{result.count}</strong>{" "}
            times in the library.
          </p>
          {result.example && (
            <p style={{ color: "#9ca3af" }}>
              Example: {result.example.author || "Unknown author"} —{" "}
              {result.example.genre || "No genre"}
            </p>
          )}
          {result.scope && (
            <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "8px" }}>
              {result.scope === "all_books" ? "📊 All books" : "📚 Your books"}
            </p>
          )}
        </div>
      );
    }

    if (result.type === "five_most_expensive_books") {
      return (
        <div style={cardStyle}>
          <h3 style={{ color: "#f9fafb" }}>Five Most Expensive Books</h3>
          {result.scope && (
            <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "12px" }}>
              {result.scope === "all_books" ? "📊 All books" : "📚 Your books"}
            </p>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px", color: "#d1d5db" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #374151" }}>
                <th style={{ textAlign: "left", padding: "8px", color: "#9ca3af", fontWeight: 600 }}>Title</th>
                <th style={{ textAlign: "left", padding: "8px", color: "#9ca3af", fontWeight: 600 }}>Author</th>
                <th style={{ textAlign: "left", padding: "8px", color: "#9ca3af", fontWeight: 600 }}>Genre</th>
                <th style={{ textAlign: "right", padding: "8px", color: "#9ca3af", fontWeight: 600 }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {result.books && result.books.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid #374151" }}>
                  <td style={{ padding: "8px" }}>{b.title}</td>
                  <td style={{ padding: "8px" }}>{b.author || "Unknown"}</td>
                  <td style={{ padding: "8px" }}>{b.genre || "-"}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#10b981", fontWeight: 600 }}>
                    ${b.price != null ? Number(b.price).toFixed(2) : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <pre style={{ background: "#111", color: "#eee", padding: 12, borderRadius: 6 }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui", padding: "0 20px" }}>
      <h1 style={{ color: "#f9fafb" }}>Library AI Panel</h1>
      <p style={{ color: "#9ca3af", marginBottom: 20 }}>
        Try questions like: <em>"Who owns the most books?"</em>,{" "}
        <em>"Which is the most popular book?"</em>,{" "}
        <em>"Show the five most expensive books."</em>
      </p>

      {/* Query Section */}
      <section style={sectionStyle}>
        <h2 style={{ color: "#f9fafb", marginTop: 0 }}>Ask a Question</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask something about the library..."
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #374151",
              background: "#020617",
              color: "#f9fafb",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(to right, #6366f1, #8b5cf6)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Asking..." : "Ask AI"}
          </button>
        </form>

        {error && <p style={{ color: "#fecaca" }}>{error}</p>}
        {renderResult()}
      </section>

      {/* Recommendations Section */}
      <section style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: "#f9fafb", marginTop: 0 }}>Book Recommendations</h2>
          <button
            onClick={handleGetRecommendations}
            disabled={recLoading}
            style={{
              padding: "8px 16px",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {recLoading ? "Loading..." : "Get Recommendations"}
          </button>
        </div>
        {recError && <p style={{ color: "#fecaca" }}>{recError}</p>}
        {recommendations && (
          <div>
            {recommendations.message ? (
              <p style={{ color: "#9ca3af" }}>{recommendations.message}</p>
            ) : (
              <>
                <p style={{ color: "#d1d5db" }}>
                  Based on your preference for <strong>{recommendations.based_on_genre}</strong>:
                </p>
                {recommendations.books && recommendations.books.length > 0 ? (
                  <ul style={{ color: "#d1d5db" }}>
                    {recommendations.books.map((b) => (
                      <li key={b.id} style={{ marginBottom: "8px" }}>
                        <strong>{b.title}</strong> by {b.author || "Unknown"} — {b.genre}
                        {b.price && ` ($${Number(b.price).toFixed(2)})`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#9ca3af" }}>No recommendations available at this time.</p>
                )}
                {recommendations.reason && (
                  <p style={{ color: "#9ca3af", fontSize: "13px", fontStyle: "italic", marginTop: "8px" }}>
                    {recommendations.reason}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* Insights Section */}
      <section style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: "#f9fafb", marginTop: 0 }}>Reading Insights</h2>
          <button
            onClick={handleGetInsights}
            disabled={insightsLoading}
            style={{
              padding: "8px 16px",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {insightsLoading ? "Loading..." : "Get Insights"}
          </button>
        </div>
        {insightsError && <p style={{ color: "#fecaca" }}>{insightsError}</p>}
        {insights && (
          <div style={{ color: "#d1d5db" }}>
            {/* AI-Generated Summary */}
            {insights.summary && (
              <div style={{ 
                padding: "12px", 
                background: "#1f2937", 
                borderRadius: "6px", 
                marginBottom: "16px",
                borderLeft: "3px solid #6366f1"
              }}>
                <p style={{ margin: 0, fontStyle: "italic", color: "#a5b4fc" }}>
                  {insights.summary}
                </p>
              </div>
            )}
            
            {/* Key Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              <div style={{ padding: "12px", background: "#1f2937", borderRadius: "6px" }}>
                <div style={{ color: "#9ca3af", fontSize: "12px" }}>Total Books</div>
                <div style={{ color: "#a5b4fc", fontSize: "24px", fontWeight: "bold" }}>{insights.total_books}</div>
              </div>
              {insights.average_pages && (
                <div style={{ padding: "12px", background: "#1f2937", borderRadius: "6px" }}>
                  <div style={{ color: "#9ca3af", fontSize: "12px" }}>Avg Pages</div>
                  <div style={{ color: "#a5b4fc", fontSize: "24px", fontWeight: "bold" }}>{Math.round(insights.average_pages)}</div>
                </div>
              )}
              {insights.total_pages && (
                <div style={{ padding: "12px", background: "#1f2937", borderRadius: "6px" }}>
                  <div style={{ color: "#9ca3af", fontSize: "12px" }}>Total Pages</div>
                  <div style={{ color: "#a5b4fc", fontSize: "24px", fontWeight: "bold" }}>{insights.total_pages}</div>
                </div>
              )}
              {insights.average_price && (
                <div style={{ padding: "12px", background: "#1f2937", borderRadius: "6px" }}>
                  <div style={{ color: "#9ca3af", fontSize: "12px" }}>Avg Price</div>
                  <div style={{ color: "#10b981", fontSize: "24px", fontWeight: "bold" }}>${Number(insights.average_price).toFixed(2)}</div>
                </div>
              )}
            </div>

            {/* Favorite Genre */}
            {insights.favorite_genre && (
              <p style={{ marginBottom: "12px" }}>
                <strong>Favorite Genre:</strong> <span style={{ color: "#a5b4fc" }}>{insights.favorite_genre}</span>
              </p>
            )}

            {/* Genre Distribution */}
            {insights.user_genre_distribution && Object.keys(insights.user_genre_distribution).length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <strong>Genre Distribution:</strong>
                <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                  {Object.entries(insights.user_genre_distribution).map(([genre, count]) => (
                    <li key={genre} style={{ marginBottom: "4px" }}>
                      {genre}: <strong style={{ color: "#a5b4fc" }}>{count}</strong> books
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Status Distribution */}
            {insights.status_distribution && Object.keys(insights.status_distribution).length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <strong>Reading Status:</strong>
                <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                  {Object.entries(insights.status_distribution).map(([status, count]) => (
                    <li key={status} style={{ marginBottom: "4px" }}>
                      {status}: <strong style={{ color: "#a5b4fc" }}>{count}</strong> books
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Page Range */}
            {insights.min_pages && insights.max_pages && (
              <p style={{ marginBottom: "12px" }}>
                <strong>Page Range:</strong> {insights.min_pages} - {insights.max_pages} pages
              </p>
            )}

            {/* Most Popular Genre Overall */}
            {insights.most_popular_genre_overall && (
              <p style={{ marginTop: "12px", padding: "8px", background: "#1f2937", borderRadius: "6px" }}>
                <strong>Most Popular Genre (Overall):</strong>{" "}
                <span style={{ color: "#a5b4fc" }}>{insights.most_popular_genre_overall}</span>
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const cardStyle = {
  background: "#111827",
  border: "1px solid #374151",
  borderRadius: 8,
  padding: 16,
  marginTop: 16,
};

const sectionStyle = {
  background: "#111827",
  border: "1px solid #374151",
  borderRadius: 10,
  padding: 20,
  marginBottom: 24,
};
