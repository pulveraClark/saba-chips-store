import { createContext, useContext, useEffect, useState } from "react";
import { getWishlist } from "../assets/services/wishlistService.js";
import { useAuth } from "./AuthContext.jsx";

const WishlistContext = createContext();

/* eslint-disable react-refresh/only-export-components */
export function WishlistProvider({ children }) {
  const [wishlistCount, setWishlistCount] = useState(0);
  const { user, loading, isAdmin } = useAuth();

  const refreshWishlistCount = async () => {
    if (!user || isAdmin) {
      setWishlistCount(0);
      return 0;
    }

    try {
      const productIds = await getWishlist();
      const count = productIds?.length || 0;
      setWishlistCount(count);
      return count;
    } catch (err) {
      console.error("Failed to refresh wishlist count:", err);
      setWishlistCount(0);
      return 0;
    }
  };

  useEffect(() => {
    if (loading) return;
    void refreshWishlistCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, isAdmin]);

  return (
    <WishlistContext.Provider value={{ wishlistCount, refreshWishlistCount }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
