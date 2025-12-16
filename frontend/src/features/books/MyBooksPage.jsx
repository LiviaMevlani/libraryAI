// src/features/books/MyBooksPage.jsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getMyBooks, createBook, deleteBook } from "../../api/bookApi";
import { useAuth } from "../../context/AuthContext";
import httpClient from "../../api/httpClient";

const STATUS_OPTIONS = ["planned", "reading", "completed"];

export default function MyBooksPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [form, setForm] = useState({
    title: "",
    author: "",
    genre: "",
    price: "",
    pages: "",
    reading_status: "planned",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    author: "",
    genre: "",
    price: "",
    pages: "",
    reading_status: "planned",
  });

  const genreFilter = searchParams.get("genre") || "";
  const statusFilter = searchParams.get("status") || "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["books", genreFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Only add params if they have values
      if (genreFilter && genreFilter.trim()) {
        params.append("genre", genreFilter.trim());
      }
      if (statusFilter && statusFilter.trim()) {
        params.append("status", statusFilter.trim());
      }
      const queryString = params.toString();
      const url = queryString ? `/books/?${queryString}` : `/books/`;
      console.log("Fetching books with URL:", url); // Debug log
      const res = await httpClient.get(url);
      return res.data;
    },
  });

  const books = data || [];

  // Extract unique genres from books
  const availableGenres = useMemo(() => {
    const genres = new Set();
    books.forEach((book) => {
      if (book.genre) {
        genres.add(book.genre);
      }
    });
    return Array.from(genres).sort();
  }, [books]);

  const createMutation = useMutation({
    mutationFn: (payload) => createBook(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["books"]);
      setForm({
        title: "",
        author: "",
        genre: "",
        price: "",
        pages: "",
        reading_status: "planned",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["books"]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await httpClient.put(`/books/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["books"]);
      setEditingId(null);
    },
  });

  const handleAddChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      price: form.price ? Number(form.price) : null,
      pages: form.pages ? Number(form.pages) : null,
    });
  };

  const startEdit = (book) => {
    setEditingId(book.id);
    setEditForm({
      title: book.title || "",
      author: book.author || "",
      genre: book.genre || "",
      price: book.price ?? "",
      pages: book.pages ?? "",
      reading_status: book.reading_status || "planned",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      payload: {
        ...editForm,
        price: editForm.price ? Number(editForm.price) : null,
        pages: editForm.pages ? Number(editForm.pages) : null,
      },
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleGenreFilter = (genre) => {
    const params = new URLSearchParams(searchParams);
    const trimmedGenre = genre.trim();
    if (trimmedGenre) {
      params.set("genre", trimmedGenre);
    } else {
      params.delete("genre");
    }
    setSearchParams(params);
  };

  const handleStatusFilter = (status) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    setSearchParams(params);
  };

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center", color: "#f9fafb" }}>Loading books...</div>;
  if (isError) return <div style={{ padding: "40px", color: "red" }}>Error loading books.</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "system-ui", padding: "0 20px" }}>
      <header
        style={{
          marginBottom: 30,
        }}
      >
        <h1 style={{ marginBottom: 4, color: "#f9fafb" }}>My Library</h1>
        <p style={{ margin: 0, color: "#9ca3af" }}>
          Manage your personal book collection
        </p>
      </header>

      {/* Filters */}
      <section
        style={{
          padding: 16,
          borderRadius: 10,
          border: "1px solid #374151",
          marginBottom: 24,
          background: "#111827",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12, color: "#f9fafb" }}>Filter Books</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={genreFilter}
              onChange={(e) => handleGenreFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #374151",
                background: "#020617",
                color: "#f9fafb",
                minWidth: "200px",
              }}
            >
              <option value="">All genres</option>
              {availableGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            {genreFilter && (
              <button
                type="button"
                onClick={() => handleGenreFilter("")}
                style={{
                  padding: "6px 12px",
                  background: "#374151",
                  color: "#f9fafb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #374151",
              background: "#020617",
              color: "#f9fafb",
            }}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearchParams({});
            }}
            style={{
              padding: "8px 16px",
              background: "#374151",
              color: "#f9fafb",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Clear all filters
          </button>
        </div>
        {genreFilter && (
          <p style={{ marginTop: 8, fontSize: "12px", color: "#9ca3af" }}>
            Filtering by genre: <strong>{genreFilter}</strong>
          </p>
        )}
      </section>

      {/* Add book - Only show for non-admin users */}
      {user?.role !== "admin" && (
        <section
          style={{
            padding: 16,
            borderRadius: 10,
            border: "1px solid #374151",
            marginBottom: 24,
            background: "#111827",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#f9fafb" }}>Add New Book</h2>
          <form
            onSubmit={handleAddSubmit}
            style={{ display: "grid", gap: 10, maxWidth: 500 }}
          >
            <input
              name="title"
              placeholder="Title *"
              value={form.title}
              onChange={handleAddChange}
              required
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #374151",
                background: "#020617",
                color: "#f9fafb",
              }}
            />
            <input
              name="author"
              placeholder="Author"
              value={form.author}
              onChange={handleAddChange}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #374151",
                background: "#020617",
                color: "#f9fafb",
              }}
            />
            <input
              name="genre"
              placeholder="Genre"
              value={form.genre}
              onChange={handleAddChange}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #374151",
                background: "#020617",
                color: "#f9fafb",
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <input
                name="price"
                type="number"
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={handleAddChange}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#f9fafb",
                }}
              />
              <input
                name="pages"
                type="number"
                placeholder="Pages"
                value={form.pages}
                onChange={handleAddChange}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#f9fafb",
                }}
              />
            </div>
            <select
              name="reading_status"
              value={form.reading_status}
              onChange={handleAddChange}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #374151",
                background: "#020617",
                color: "#f9fafb",
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(to right, #6366f1, #8b5cf6)",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {createMutation.isPending ? "Saving..." : "Add book"}
            </button>
          </form>
        </section>
      )}

      {/* Book list */}
      <section>
        <h2 style={{ color: "#f9fafb" }}>Your Books ({books.length})</h2>
        {books.length === 0 && (
          <p style={{ color: "#9ca3af", padding: "20px", textAlign: "center" }}>
            No books found. {genreFilter || statusFilter ? "Try adjusting your filters." : "Add your first book above!"}
          </p>
        )}

        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {books.map((b) => (
            <div
              key={b.id}
              style={{
                border: "1px solid #374151",
                borderRadius: 10,
                padding: 16,
                background: "#111827",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {editingId === b.id ? (
                <form
                  onSubmit={handleEditSubmit}
                  style={{ display: "grid", gap: 6, flex: 1, marginRight: 12 }}
                >
                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    required
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #374151",
                      background: "#020617",
                      color: "#f9fafb",
                    }}
                  />
                  <input
                    name="author"
                    placeholder="Author"
                    value={editForm.author}
                    onChange={handleEditChange}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #374151",
                      background: "#020617",
                      color: "#f9fafb",
                    }}
                  />
                  <input
                    name="genre"
                    placeholder="Genre"
                    value={editForm.genre}
                    onChange={handleEditChange}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #374151",
                      background: "#020617",
                      color: "#f9fafb",
                    }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={editForm.price}
                      onChange={handleEditChange}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #374151",
                        background: "#020617",
                        color: "#f9fafb",
                      }}
                    />
                    <input
                      name="pages"
                      type="number"
                      placeholder="Pages"
                      value={editForm.pages}
                      onChange={handleEditChange}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #374151",
                        background: "#020617",
                        color: "#f9fafb",
                      }}
                    />
                  </div>
                  <select
                    name="reading_status"
                    value={editForm.reading_status}
                    onChange={handleEditChange}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #374151",
                      background: "#020617",
                      color: "#f9fafb",
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      style={{
                        padding: "6px 12px",
                        background: "#6366f1",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{
                        padding: "6px 12px",
                        background: "#374151",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <div style={{ fontWeight: 600, color: "#f9fafb", fontSize: "16px" }}>{b.title}</div>
                    <div style={{ fontSize: 14, color: "#9ca3af", marginTop: "4px" }}>
                      {b.author || "Unknown author"}
                      {b.genre ? ` · ${b.genre}` : ""}
                    </div>
                    <div style={{ fontSize: 13, marginTop: 4, color: "#6b7280" }}>
                      Status:{" "}
                      <strong style={{ textTransform: "capitalize", color: "#d1d5db" }}>
                        {b.reading_status || "planned"}
                      </strong>
                      {b.price != null && ` · $${Number(b.price).toFixed(2)}`}
                      {b.pages != null && ` · ${b.pages} pages`}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      onClick={() => startEdit(b)}
                      style={{
                        padding: "6px 12px",
                        background: "#6366f1",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
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
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

