import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../assets/services/authService.js";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordsMatch) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await resetPassword(token, password);
      alert(res.message);
      navigate("/login");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f2e8] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#ead7b8] overflow-hidden">
        <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] p-8 text-white text-center">
          <h2 className="text-4xl font-black mb-2">Reset Password</h2>
          <p className="text-[#fff1df]">Enter your new password</p>
        </div>

        <div className="p-8">
          {message && (
            <div className="mb-6 p-4 rounded-2xl bg-red-100 border border-red-300 text-red-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="password"
              placeholder="New Password"
              className="w-full border border-[#d8be96] bg-[#fffaf2] p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#d6b585] text-[#6d4c2f]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              className="w-full border border-[#d8be96] bg-[#fffaf2] p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#d6b585] text-[#6d4c2f]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button
              disabled={loading}
              className="w-full bg-[#8b5e34] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#714a28] disabled:opacity-50 transition"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <p className="text-center mt-8 text-[#6d4c2f]">
            <Link to="/login" className="text-[#8b5e34] font-bold hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;