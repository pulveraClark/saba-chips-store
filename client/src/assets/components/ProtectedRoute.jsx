import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8]">
      <div className="text-2xl text-[#8b5e34] animate-pulse">Loading...</div>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <RouteLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <RouteLoader />;
  }

  if (user) {
    return <Navigate to={isAdmin ? "/admin" : "/home"} replace />;
  }

  return children;
}
