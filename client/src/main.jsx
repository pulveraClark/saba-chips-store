import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { ProductProvider } from "./context/ProductContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ProductProvider>
              <App />
            </ProductProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>
);
