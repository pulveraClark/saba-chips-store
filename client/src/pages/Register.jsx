import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../assets/services/authService.js";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await registerUser(form);
      alert(res.message);
      if (res.message === "User registered successfully") {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-yellow-50 to-green-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🍌</div>
          <h2 className="text-3xl font-bold text-green-600">Create Account</h2>
          <p className="text-gray-500">Join Saba Chips today!</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border-2 border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="mb-6">
            <input
              type="email"
              placeholder="Email"
              className="w-full border-2 border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="mb-8">
            <input
              type="password"
              placeholder="Password"
              className="w-full border-2 border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 shadow-lg transform hover:scale-[1.02] transition-all duration-200"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-green-600 font-bold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;