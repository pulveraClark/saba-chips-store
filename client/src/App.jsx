import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./assets/components/Navbar.jsx";
import {
  AdminRoute,
  GuestRoute,
  ProtectedRoute,
} from "./assets/components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import Admin from "./pages/Admin.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import AdminProducts from "./pages/AdminProducts.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import AdminReports from "./pages/AdminReports.jsx";
import AdminTransactions from "./pages/AdminTransactions.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import Messages from "./pages/Messages.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import Wishlist from "./pages/Wishlist.jsx";

function App() {
  return (
    <BrowserRouter>
      <>
        <Navbar />
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <GuestRoute>
                <ResetPassword />
              </GuestRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />
          <Route
            path="/admin-orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProtectedRoute>
                <ProductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-reports"
            element={
              <AdminRoute>
                <AdminReports />
              </AdminRoute>
            }
          />
          <Route
            path="/admin-transactions"
            element={
              <AdminRoute>
                <AdminTransactions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin-users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
        </Routes>
      </>
    </BrowserRouter>
  );
}

export default App;
