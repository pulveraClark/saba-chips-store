import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMe } from "../assets/services/authService.js";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMe()
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Please login to view profile");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-2xl text-gray-600 animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            Your Profile
          </h1>
          <p className="text-xl text-gray-600">Manage your account & orders</p>
        </div>

        {error ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md mx-auto border-4 border-dashed border-gray-200">
            <div className="text-6xl mb-6 mx-auto">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
            <Link 
              to="/login" 
              className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg transform hover:scale-105 transition-all duration-200 inline-block"
            >
              Go to Login
            </Link>
          </div>
        ) : user ? (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-12 text-white text-center">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full mx-auto flex items-center justify-center mb-6">
                <span className="text-5xl">👤</span>
              </div>
              <h2 className="text-4xl font-bold mb-2">{user.name}</h2>
              <p className="text-xl opacity-90">{user.email}</p>
            </div>

            <div className="p-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Account Info
                  </h3>
                  <div className="space-y-4 text-lg">
                    <div>
                      <span className="font-semibold text-gray-600">User ID:</span>
                      <span className="ml-2 bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-mono text-sm">
                        {user.id}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Email:</span>
                      <span className="ml-2 text-gray-900">{user.email}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Member since:</span>
                      <span className="ml-2 text-green-600 font-bold">
                        {new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
                  <h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Your Orders
                  </h3>
                  <div className="text-center py-12">
                    <div className="text-6xl mb-6">📦</div>
                    <p className="text-xl text-blue-700 mb-6">No orders yet</p>
                    <Link
                      to="/home"
                      className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg transform hover:scale-105 transition-all duration-200 inline-block"
                    >
                      Start Shopping →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl text-gray-600">Loading user data...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;