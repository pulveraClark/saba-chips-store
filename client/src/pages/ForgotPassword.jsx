import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../assets/services/authService.js";
import { useNotification } from "../context/NotificationContext.jsx";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
      notify({
        type: "success",
        title: "Reset Email Sent",
        message: res.message,
      });
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || "Failed to send reset email";
      setMessage(errorMessage);
      notify({
        type: "error",
        title: "Request Failed",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f2e8] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#ead7b8] overflow-hidden">
        <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] p-8 text-white text-center">
          <h2 className="text-4xl font-black mb-2">Forgot Password</h2>
          <p className="text-[#fff1df]">
            Enter your email to receive a reset link
          </p>
        </div>

        <div className="p-8">
          {message && (
            <div className="mb-6 p-4 rounded-2xl bg-[#fff7eb] border border-[#ead7b8] text-[#6d4c2f]">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              placeholder="Email"
              className="w-full border border-[#d8be96] bg-[#fffaf2] p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#d6b585] text-[#6d4c2f]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              disabled={loading}
              className="w-full bg-[#8b5e34] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#714a28] disabled:opacity-50 transition"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="text-center mt-8 text-[#6d4c2f]">
            Remember your password?{" "}
            <Link to="/login" className="text-[#8b5e34] font-bold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
