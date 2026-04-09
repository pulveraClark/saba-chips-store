import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../assets/services/authService.js";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true); // ✅ NEW

  // ✅ REAL-TIME PASSWORD CHECK
  useEffect(() => {
    if (form.confirmPassword) {
      setPasswordsMatch(form.password === form.confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [form.password, form.confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordsMatch) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password
      });
      
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

        {/* ✅ REAL-TIME PASSWORD NOTIFICATION */}
        {form.confirmPassword && !passwordsMatch && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg animate-pulse">
            <div className="flex items-center space-x-3">
              <span className="text-xl">⚠️</span>
              <span className="font-semibold">Passwords do not match!</span>
            </div>
          </div>
        )}

        {error && !form.confirmPassword && (
          <div className="p-4 rounded-lg mb-6 bg-red-100 border-2 border-red-300 text-red-800 text-sm font-medium">
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

          <div className="mb-4">
            <input
              type="password"
              placeholder="Password"
              className={`w-full border-2 p-4 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                passwordsMatch 
                  ? "focus:ring-green-100 focus:border-green-500 border-gray-200" 
                  : "focus:ring-orange-100 focus:border-orange-500 border-orange-300 ring-2 ring-orange-200"
              }`}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="mb-8">
            <input
              type="password"
              placeholder="Confirm Password"
              className={`w-full border-2 p-4 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                passwordsMatch 
                  ? "focus:ring-green-100 focus:border-green-500 border-gray-200" 
                  : "focus:ring-orange-100 focus:border-orange-500 border-orange-300 ring-2 ring-orange-200"
              }`}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button
            disabled={loading || !passwordsMatch}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02] transition-all duration-200"
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