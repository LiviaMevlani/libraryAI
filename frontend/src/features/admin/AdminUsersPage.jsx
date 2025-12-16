// src/features/admin/AdminUsersPage.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsers,
  updateUserRole,
  deleteUserAdmin,
  createUserAdmin,
} from "../../api/adminApi";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await getAllUsers();
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUserAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      queryClient.invalidateQueries(["books"]); // in case some books disappear
    },
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const createMutation = useMutation({
    mutationFn: (data) => createUserAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      setShowCreateForm(false);
      setCreateForm({ name: "", email: "", password: "", role: "user" });
    },
  });

  if (isLoading) return <div>Loading users...</div>;
  if (isError) return <div>Error loading users.</div>;

  const users = data || [];

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <header
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}
      >
        <h1>Admin · Users</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/admin/books">
            <button>View All Books</button>
          </Link>
          <Link to="/ai">
            <button>AI Panel</button>
          </Link>
        </div>
      </header>
      <p>Logged in as admin: {user?.email}</p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 16,
          fontSize: 14,
        }}
      >
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>ID</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Name</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Email</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Role</th>
            <th style={{ borderBottom: "1px solid #ddd" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={{ padding: 6 }}>{u.id}</td>
              <td style={{ padding: 6 }}>{u.name}</td>
              <td style={{ padding: 6 }}>{u.email}</td>
              <td style={{ padding: 6, textTransform: "capitalize" }}>{u.role}</td>
              <td style={{ padding: 6 }}>
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: u.id,
                      role: u.role === "admin" ? "user" : "admin",
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  Set as {u.role === "admin" ? "user" : "admin"}
                </button>
                {u.id !== user.id && (
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => deleteMutation.mutate(u.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
