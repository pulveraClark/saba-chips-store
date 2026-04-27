import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getAllUsers,
  getActivityLogs,
  updateUser,
  deleteUser,
} from "../assets/services/adminService.js";
import { useNotification } from "../context/NotificationContext.jsx";
import { sortByNewest } from "../utils/sortByNewest.js";
import {
  exportToCsv,
  exportToExcel,
  exportToPdfPrint,
} from "../utils/exportData.js";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [usersRefreshing, setUsersRefreshing] = useState(false);
  const [logsRefreshing, setLogsRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
  });
  const [logsPage, setLogsPage] = useState(1);

  const LOGS_PER_PAGE = 5;
  const { notify } = useNotification();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchUsers = async (showRefresh = false) => {
    try {
      if (showRefresh) setUsersRefreshing(true);
      const data = await getAllUsers(page, 5, search);
      setUsers(sortByNewest(data.users || []));
      setPagination(data.pagination || {});
      setMessage("");
    } catch {
      setMessage("Admin access required. Please login as admin@sabachips.com");
    } finally {
      setLoading(false);
      setUsersRefreshing(false);
    }
  };

  const fetchLogs = async (showRefresh = false) => {
    try {
      if (showRefresh) setLogsRefreshing(true);
      const activityLogs = await getActivityLogs();
      setLogs(sortByNewest(activityLogs || []));
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLogsLoading(false);
      setLogsRefreshing(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email });
    setMessage("");
  };

  const handleUpdate = async (id) => {
    try {
      await updateUser(id, editForm);
      setMessage("User updated successfully!");
      notify({
        type: "success",
        title: "User Updated",
        message: `${editForm.name} was updated successfully.`,
      });
      setEditingId(null);
      fetchUsers();
      fetchLogs();
    } catch {
      setMessage("Update failed!");
      notify({
        type: "error",
        title: "Update Failed",
        message: "The user could not be updated.",
      });
    }
  };

  const handleDelete = async (id) => {
    if (confirm(`Delete user ID ${id}? This cannot be undone.`)) {
      try {
        await deleteUser(id);
        setMessage("User deleted successfully!");
        notify({
          type: "success",
          title: "User Deleted",
          message: `User ID ${id} was deleted successfully.`,
        });
        fetchUsers();
        fetchLogs();
      } catch {
        setMessage("Delete failed!");
        notify({
          type: "error",
          title: "Delete Failed",
          message: "The user could not be deleted.",
        });
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const userRows = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    joined: new Date(user.created_at).toLocaleString(),
  }));
  const userColumns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "joined", label: "Joined" },
  ];

  const sortedLogs = sortByNewest(logs);
  const logRows = sortedLogs.map((log) => ({
    id: log.id,
    action: log.action,
    userName: log.user_name || "Unknown User",
    userEmail: log.user_email || "No email",
    details: log.details,
    createdAt: new Date(log.created_at).toLocaleString(),
  }));
  const logColumns = [
    { key: "id", label: "Log ID" },
    { key: "action", label: "Action" },
    { key: "userName", label: "User Name" },
    { key: "userEmail", label: "User Email" },
    { key: "details", label: "Details" },
    { key: "createdAt", label: "Created At" },
  ];

  const handleExportUsersCsv = () => {
    exportToCsv(`users-page-${page}.csv`, userColumns, userRows);
  };

  const handleExportUsersExcel = () => {
    exportToExcel(`users-page-${page}.xls`, "Users", userColumns, userRows);
  };

  const handleExportUsersPdf = () => {
    exportToPdfPrint("Users Report", [
      {
        heading: `Users - Page ${page}`,
        columns: userColumns,
        rows: userRows,
      },
    ]);
  };

  const handleExportLogsCsv = () => {
    exportToCsv("user-activity-logs.csv", logColumns, logRows);
  };

  const handleExportLogsExcel = () => {
    exportToExcel("user-activity-logs.xls", "User Activity Logs", logColumns, logRows);
  };

  const handleExportLogsPdf = () => {
    exportToPdfPrint("User Activity Logs", [
      {
        heading: "User Activity Logs",
        columns: logColumns,
        rows: logRows,
      },
    ]);
  };

  const logsTotalPages = Math.max(1, Math.ceil(sortedLogs.length / LOGS_PER_PAGE));
  const paginatedLogs = sortedLogs.slice(
    (logsPage - 1) * LOGS_PER_PAGE,
    logsPage * LOGS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f8f2e8]">
        <div className="text-2xl text-[#8b5e34] animate-pulse">
          Loading User Management...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] rounded-[2rem] p-8 text-white shadow-xl mb-8">
          <Link
            to="/admin"
            className="inline-block text-[#fff1df] hover:text-white mb-4"
          >
            Back to Admin Hub
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            User Management
          </h1>
          <p className="text-[#fff1df] text-lg max-w-2xl">
            View, search, edit, remove users, and monitor recent user activity.
          </p>
        </div>

        {message && (
          <div
            className={`mx-auto max-w-3xl p-4 rounded-2xl shadow-md mb-8 text-center font-semibold ${
              !message.toLowerCase().includes("failed") &&
              !message.toLowerCase().includes("required")
                ? "bg-green-100 border border-green-300 text-green-800"
                : "bg-red-100 border border-red-300 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#ead7b8] mb-10">
          <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] p-6 text-white">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="text-3xl font-black">Users</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full sm:w-80 p-3 rounded-2xl text-gray-800 border-none outline-none"
                />
                <button
                  onClick={() => fetchUsers(true)}
                  disabled={usersRefreshing}
                  className="px-4 py-3 rounded-2xl bg-white text-[#8b5e34] font-bold hover:bg-[#f8f2e8] disabled:opacity-60"
                >
                  {usersRefreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#fffaf2] border-b border-[#f1e3ca] flex flex-wrap gap-3">
            <button
              onClick={handleExportUsersCsv}
              className="px-4 py-3 rounded-2xl bg-[#8b5e34] text-white font-bold hover:bg-[#714a28]"
            >
              Export Users CSV
            </button>
            <button
              onClick={handleExportUsersExcel}
              className="px-4 py-3 rounded-2xl bg-[#b8834d] text-white font-bold hover:bg-[#9e6d3b]"
            >
              Export Users Excel
            </button>
            <button
              onClick={handleExportUsersPdf}
              className="px-4 py-3 rounded-2xl bg-[#2f4858] text-white font-bold hover:bg-[#243946]"
            >
              Export Users PDF
            </button>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">Users</div>
              <h3 className="text-2xl font-bold text-[#8b5e34] mb-2">
                {search ? "No matching users" : "No users found"}
              </h3>
              <p className="text-[#6d4c2f]">Try adjusting your search.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#fff7eb]">
                    <tr>
                      <th className="px-8 py-5 text-left text-lg font-bold text-[#8b5e34]">ID</th>
                      <th className="px-8 py-5 text-left text-lg font-bold text-[#8b5e34]">Name</th>
                      <th className="px-8 py-5 text-left text-lg font-bold text-[#8b5e34]">Email</th>
                      <th className="px-8 py-5 text-left text-lg font-bold text-[#8b5e34]">Joined</th>
                      <th className="px-8 py-5 text-center text-lg font-bold text-[#8b5e34]">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-[#f1e3ca] hover:bg-[#fffaf2] transition">
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center px-4 py-2 bg-[#f5e4c9] text-[#8b5e34] text-sm font-bold rounded-full">
                            {user.id}
                          </span>
                        </td>

                        <td className="px-8 py-5">
                          {editingId === user.id ? (
                            <input
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({ ...editForm, name: e.target.value })
                              }
                              className="w-64 p-3 border border-[#d8be96] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d6b585]"
                              placeholder="Enter name"
                            />
                          ) : (
                            <span className="font-bold text-lg text-gray-900">
                              {user.name}
                            </span>
                          )}
                        </td>

                        <td className="px-8 py-5">
                          {editingId === user.id ? (
                            <input
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm({ ...editForm, email: e.target.value })
                              }
                              className="w-80 p-3 border border-[#d8be96] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d6b585]"
                              type="email"
                              placeholder="Enter email"
                            />
                          ) : (
                            <span className="text-sm text-gray-700 font-mono bg-[#f8f2e8] px-4 py-2 rounded-xl">
                              {user.email}
                            </span>
                          )}
                        </td>

                        <td className="px-8 py-5">
                          <span className="text-sm text-green-700 font-bold bg-green-100 px-4 py-2 rounded-full">
                            {new Date(user.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </td>

                        <td className="px-8 py-5">
                          {editingId === user.id ? (
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <button
                                onClick={() => handleUpdate(user.id)}
                                className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700 transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-600 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <button
                                onClick={() => handleEdit(user)}
                                className="bg-[#8b5e34] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#714a28] transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="bg-red-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-red-600 transition"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#f1e3ca] bg-[#fffaf2]">
                <p className="text-[#6d4c2f] font-medium">
                  Page {pagination.page} of {pagination.totalPages} • {pagination.total} total users
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="px-5 py-2 rounded-xl bg-[#8b5e34] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>

                  <button
                    onClick={() =>
                      setPage((prev) =>
                        prev < pagination.totalPages ? prev + 1 : prev
                      )
                    }
                    disabled={page >= pagination.totalPages}
                    className="px-5 py-2 rounded-xl bg-[#8b5e34] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#ead7b8]">
          <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] p-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-black">User Activity Logs</h2>
              <button
                onClick={() => fetchLogs(true)}
                disabled={logsRefreshing}
                className="px-4 py-3 rounded-2xl bg-white text-[#8b5e34] font-bold hover:bg-[#f8f2e8] disabled:opacity-60"
              >
                {logsRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#fffaf2] border-b border-[#f1e3ca] flex flex-wrap gap-3">
            <button
              onClick={handleExportLogsCsv}
              className="px-4 py-3 rounded-2xl bg-[#8b5e34] text-white font-bold hover:bg-[#714a28]"
            >
              Export Logs CSV
            </button>
            <button
              onClick={handleExportLogsExcel}
              className="px-4 py-3 rounded-2xl bg-[#b8834d] text-white font-bold hover:bg-[#9e6d3b]"
            >
              Export Logs Excel
            </button>
            <button
              onClick={handleExportLogsPdf}
              className="px-4 py-3 rounded-2xl bg-[#2f4858] text-white font-bold hover:bg-[#243946]"
            >
              Export Logs PDF
            </button>
          </div>

          {logsLoading ? (
            <div className="text-center py-16 text-[#8b5e34] animate-pulse">
              Loading activity logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-[#6d4c2f]">
              No activity logs found.
            </div>
          ) : (
            <>
              <div className="space-y-4 p-6">
                {paginatedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#fffaf2] border border-[#ead7b8] rounded-2xl p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
                      <div>
                        <p className="font-bold text-[#8b5e34] text-lg">{log.action}</p>
                        <p className="text-sm text-[#6d4c2f]">
                          {log.user_name || "Unknown User"} • {log.user_email || "No email"}
                        </p>
                      </div>
                      <p className="text-sm text-[#7a5331]">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>

                    <p className="text-[#6d4c2f]">{log.details}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#f1e3ca] bg-[#fffaf2]">
                <p className="text-[#6d4c2f] font-medium">
                  Page {logsPage} of {logsTotalPages} • {logs.length} total logs
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLogsPage((prev) => Math.max(prev - 1, 1))}
                    disabled={logsPage === 1}
                    className="px-5 py-2 rounded-xl bg-[#8b5e34] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>

                  <button
                    onClick={() =>
                      setLogsPage((prev) =>
                        prev < logsTotalPages ? prev + 1 : prev
                      )
                    }
                    disabled={logsPage >= logsTotalPages}
                    className="px-5 py-2 rounded-xl bg-[#8b5e34] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
