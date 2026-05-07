import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { initializeCsrfToken, registerUser } from "../assets/services/authService.js";
import { useNotification } from "../context/NotificationContext.jsx";

function Register() {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  useEffect(() => {
    void initializeCsrfToken().catch(() => {
      // ignore prefetch failures; submit will fetch or refresh the token
    });
  }, []);

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
      notify({
        type: "warning",
        title: "Password Mismatch",
        message: "Please make sure both password fields match.",
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      if (res.message === "User registered successfully") {
        notify({
          type: "success",
          title: "Registration Successful",
          message: "Your account has been created. You can now log in.",
        });
        navigate("/login");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      setError(message);
      notify({
        type: "error",
        title: "Registration Failed",
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
          <h2 className="text-4xl font-black mb-2">Create Account</h2>
          <p className="text-[#fff1df] text-base">
            Join Saba Chips today
          </p>
        </div>

        <div className="p-8">
          {form.confirmPassword && !passwordsMatch && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-lg">⚠️</span>
                <span className="font-semibold">Passwords do not match!</span>
              </div>
            </div>
          )}

          {error && !form.confirmPassword && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                className="w-full border border-[#d8be96] bg-[#fffaf2] p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#d6b585] text-[#6d4c2f]"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

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
                className={`w-full p-4 rounded-2xl focus:outline-none focus:ring-2 text-[#6d4c2f] ${
                  passwordsMatch
                    ? "border border-[#d8be96] bg-[#fffaf2] focus:ring-[#d6b585]"
                    : "border border-red-300 bg-red-50 focus:ring-red-200"
                }`}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Confirm Password"
                className={`w-full p-4 rounded-2xl focus:outline-none focus:ring-2 text-[#6d4c2f] ${
                  passwordsMatch
                    ? "border border-[#d8be96] bg-[#fffaf2] focus:ring-[#d6b585]"
                    : "border border-red-300 bg-red-50 focus:ring-red-200"
                }`}
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                required
              />
            </div>

            <button
              disabled={loading || !passwordsMatch}
              className="w-full bg-[#8b5e34] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#714a28] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>

          <p className="text-center mt-8 text-[#6d4c2f]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#8b5e34] font-bold hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
