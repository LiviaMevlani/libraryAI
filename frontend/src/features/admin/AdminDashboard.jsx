// src/features/admin/AdminDashboard.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getAllUsers,
  updateUserRole,
  deleteUserAdmin,
  getAllBooksAdmin,
} from "../../api/adminApi";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users"); // "users" | "books"

  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await getAllUsers();
      return res.data;
    },
  });

  const {
    data: booksData,
    isLoading: booksLoading,
    isError: booksError,
  } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const res = await getAllBooksAdmin();
      return res.data;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => deleteUserAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      queryClient.invalidateQueries(["admin-books"]);
    },
  });

  const handleRoleChange = (id, newRole) => {
    updateRoleMutation.mutate({ userId: id, role: newRole });
  };

  const handleDeleteUser = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const users = usersData || [];
  const books = booksData || [];

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "system-ui", padding: "0 20px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ color: "#f9fafb" }}>Admin Dashboard</h1>
          <p style={{ color: "#9ca3af" }}>Logged in as: {user?.name} (admin)</p>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("users")}
          style={{
            marginRight: 8,
            padding: "6px 12px",
            fontWeight: activeTab === "users" ? "bold" : "normal",
            background: activeTab === "users" ? "#6366f1" : "#374151",
            color: "#f9fafb",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("books")}
          style={{
            padding: "6px 12px",
            fontWeight: activeTab === "books" ? "bold" : "normal",
            background: activeTab === "books" ? "#6366f1" : "#374151",
            color: "#f9fafb",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          All Books
        </button>
      </div>

      {/* USERS TAB */}
      {activeTab === "users" && (
        <section>
          <h2 style={{ color: "#f9fafb" }}>All Users</h2>
          {usersLoading && <p style={{ color: "#9ca3af" }}>Loading users...</p>}
          {usersError && <p style={{ color: "red" }}>Error loading users.</p>}
          {!usersLoading && !usersError && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 10,
                background: "#111827",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ background: "#1f2937" }}>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>ID</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>Name</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>Email</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>Role</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>Created At</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #374151" }}>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>{u.id}</td>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>{u.name}</td>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>{u.email}</td>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>{u.role}</td>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>
                      {u.created_at
                        ? new Date(u.created_at).toLocaleString()
                        : "-"}
                    </td>
                    <td style={tdStyle}>
                      {u.id !== user.id && (
                        <>
                          {u.role === "admin" ? (
                            <button
                              onClick={() => handleRoleChange(u.id, "user")}
                              style={{
                                marginRight: 8,
                                padding: "6px 12px",
                                background: "#6366f1",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                            >
                              Make user
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(u.id, "admin")}
                              style={{
                                marginRight: 8,
                                padding: "6px 12px",
                                background: "#6366f1",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                            >
                              Make admin
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.id)}
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
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* BOOKS TAB */}
      {activeTab === "books" && (
        <section>
          <h2 style={{ color: "#f9fafb" }}>All Users' Books</h2>
          {booksLoading && <p style={{ color: "#9ca3af" }}>Loading books...</p>}
          {booksError && <p style={{ color: "red" }}>Error loading books.</p>}
          {!booksLoading && !booksError && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 10,
                background: "#111827",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ background: "#1f2937" }}>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>ID</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>Title</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>Author</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>Genre</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>Status</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>Price</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>Pages</th>
                  <th style={{ ...thStyle, color: "#f9fafb" }}>User ID</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #374151" }}>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>{b.id}</td>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>{b.title}</td>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>{b.author || "-"}</td>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>{b.genre || "-"}</td>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>{b.reading_status}</td>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>
                      {b.price != null ? `$${Number(b.price).toFixed(2)}` : "-"}
                    </td>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>{b.pages || "-"}</td>
                    <td style={{ ...tdStyle, color: "#d1d5db" }}>{b.user_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

const thStyle = {
  borderBottom: "1px solid #374151",
  textAlign: "left",
  padding: "12px",
};

const tdStyle = {
  borderBottom: "1px solid #374151",
  padding: "12px",
};
