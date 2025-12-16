// src/features/admin/AdminBooksPage.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllBooksAdmin, deleteBookAdmin } from "../../api/adminApi";
import { useAuth } from "../../context/AuthContext";

export default function AdminBooksPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const res = await getAllBooksAdmin();
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBookAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-books"]);
    },
  });

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center", color: "#f9fafb" }}>Loading books...</div>;
  if (isError) return <div style={{ padding: "40px", color: "red" }}>Error loading books.</div>;

  const books = data || [];

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto", fontFamily: "system-ui", padding: "0 20px" }}>
      <header
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}
      >
        <h1 style={{ color: "#f9fafb" }}>Admin · All Books</h1>
      </header>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 16,
          fontSize: 14,
          background: "#111827",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ background: "#1f2937" }}>
            <th style={{ borderBottom: "1px solid #374151", textAlign: "left", padding: "12px", color: "#f9fafb" }}>ID</th>
            <th style={{ borderBottom: "1px solid #374151", textAlign: "left", padding: "12px", color: "#f9fafb" }}>Title</th>
            <th style={{ borderBottom: "1px solid #374151", textAlign: "left", padding: "12px", color: "#f9fafb" }}>Author</th>
            <th style={{ borderBottom: "1px solid #374151", textAlign: "left", padding: "12px", color: "#f9fafb" }}>Genre</th>
            <th style={{ borderBottom: "1px solid #374151", textAlign: "left", padding: "12px", color: "#f9fafb" }}>Status</th>
            <th style={{ borderBottom: "1px solid #374151", textAlign: "left", padding: "12px", color: "#f9fafb" }}>Price</th>
            <th style={{ borderBottom: "1px solid #374151", textAlign: "left", padding: "12px", color: "#f9fafb" }}>Pages</th>
            <th style={{ borderBottom: "1px solid #374151", textAlign: "left", padding: "12px", color: "#f9fafb" }}>User ID</th>
            <th style={{ borderBottom: "1px solid #374151", padding: "12px", color: "#f9fafb" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id} style={{ borderBottom: "1px solid #374151" }}>
              <td style={{ padding: "12px", color: "#d1d5db" }}>{b.id}</td>
              <td style={{ padding: "12px", color: "#d1d5db" }}>{b.title}</td>
              <td style={{ padding: "12px", color: "#d1d5db" }}>{b.author || "-"}</td>
              <td style={{ padding: "12px", color: "#d1d5db" }}>{b.genre || "-"}</td>
              <td style={{ padding: "12px", color: "#d1d5db", textTransform: "capitalize" }}>{b.reading_status || "-"}</td>
              <td style={{ padding: "12px", color: "#d1d5db" }}>
                {b.price != null ? `$${Number(b.price).toFixed(2)}` : "-"}
              </td>
              <td style={{ padding: "12px", color: "#d1d5db" }}>{b.pages || "-"}</td>
              <td style={{ padding: "12px", color: "#d1d5db" }}>{b.user_id}</td>
              <td style={{ padding: "12px" }}>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${b.title}"?`)) {
                      deleteMutation.mutate(b.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  style={{
                    padding: "6px 12px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
