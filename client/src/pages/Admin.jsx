import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllUsers, updateUser, deleteUser } from "../assets/services/adminService.js";

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { users } = await getAllUsers();
      setUsers(users);
      setMessage("");
    } catch (err) {
      setMessage("❌ Admin access required. Please login as admin@sabachips.com");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email });
    setMessage("");
  };

  const handleUpdate = async (id) => {
    try {
      await updateUser(id, editForm);
      setMessage("✅ User updated successfully!");
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      setMessage("❌ Update failed!");
    }
  };

  const handleDelete = async (id) => {
    if (confirm(`Delete user ID ${id}? This cannot be undone.`)) {
      try {
        await deleteUser(id);
        setMessage("✅ User deleted successfully!");
        fetchUsers();
      } catch (err) {
        setMessage("❌ Delete failed!");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-2xl text-gray-600 animate-pulse">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Loading Admin Panel...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        

        {/* Message */}
        {message && (
          <div className={`mx-auto max-w-2xl p-4 rounded-2xl shadow-lg mb-8 text-center font-bold text-lg ${
            message.includes("✅") 
              ? "bg-green-100 border-4 border-green-400 text-green-800" 
              : "bg-red-100 border-4 border-red-400 text-red-800"
          }`}>
            {message}
          </div>
        )}

        {/* Search & Stats */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="🔍 Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-lg shadow-sm transition-all"
              />
            </div>
            <div className="text-center lg:text-left">
              <div className="text-3xl font-bold text-gray-900">
                {filteredUsers.length}
              </div>
              <div className="text-lg text-gray-600">Total Users</div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="text-4xl font-black">👥 User Management</h2>
              <button
                onClick={fetchUsers}
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-2xl font-bold hover:bg-white/30 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🔄 Refresh List
              </button>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-6">👥</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                {search ? "No matching users" : "No users found"}
              </h3>
              <p className="text-gray-500 mb-8">Start by registering users!</p>
              <button
                onClick={fetchUsers}
                className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg"
              >
                Reload Data
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-8 py-6 text-left text-xl font-bold text-gray-800">ID</th>
                    <th className="px-8 py-6 text-left text-xl font-bold text-gray-800">Name</th>
                    <th className="px-8 py-6 text-left text-xl font-bold text-gray-800">Email</th>
                    <th className="px-8 py-6 text-left text-xl font-bold text-gray-800">Joined</th>
                    <th className="px-8 py-6 text-center text-xl font-bold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                    >
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-lg font-bold rounded-full">
                          {user.id}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {editingId === user.id ? (
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-64 p-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 shadow-sm transition-all text-lg"
                            placeholder="Enter name"
                          />
                        ) : (
                          <span className="font-bold text-xl text-gray-900">{user.name}</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {editingId === user.id ? (
                          <input
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-80 p-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 shadow-sm transition-all text-lg"
                            type="email"
                            placeholder="Enter email"
                          />
                        ) : (
                          <span className="text-lg text-gray-700 font-mono bg-gray-100 px-4 py-2 rounded-xl">
                            {user.email}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm text-green-600 font-bold bg-green-100 px-4 py-2 rounded-full">
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {editingId === user.id ? (
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                              onClick={() => handleUpdate(user.id)}
                              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200"
                            >
                              💾 Save Changes
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200"
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(user)}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>Admin Panel • Powered by Saba Chips 🚀</p>
        </div>
      </div>
    </div>
  );
}

export default Admin;