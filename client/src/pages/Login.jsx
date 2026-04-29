import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { initializeCsrfToken, loginUser } from "../assets/services/authService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { refreshUser } = useAuth();
  const { refreshCartCount } = useCart();
  const { notify } = useNotification();

  useEffect(() => {
    void initializeCsrfToken().catch(() => {
      // ignore prefetch failures; login flow will still try again on submit
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginUser(form);

      if (res.message === "Login successful") {
        const isAdmin = res.user?.email === "admin@sabachips.com";
        await refreshUser();
        await refreshCartCount();
        notify({
          type: "success",
          title: "Login Successful",
          message: `Welcome back, ${res.user?.name || "User"}!`,
        });
        window.location.href = isAdmin ? "/admin" : "/home";
      } else {
        setError(res.message);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      notify({
        type: "error",
        title: "Login Failed",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f2e8] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#ead7b8] overflow-hidden">
        <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] p-8 text-white text-center">
          <div className="text-5xl mb-4">🍌</div>
          <h2 className="text-4xl font-black mb-2">Welcome Back</h2>
          <p className="text-[#fff1df] text-base">
            Login to continue shopping Saba Chips
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-2xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full border border-[#d8be96] bg-[#fffaf2] p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#d6b585] text-[#6d4c2f]"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full border border-[#d8be96] bg-[#fffaf2] p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#d6b585] text-[#6d4c2f]"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-[#8b5e34] hover:text-[#714a28]"
              >
                Forgot password?
              </Link>
            </div>

            <button
              disabled={loading}
              className="w-full bg-[#8b5e34] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#714a28] disabled:opacity-50 transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center mt-8 text-[#6d4c2f]">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-[#8b5e34] font-bold hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
