import { createContext, useContext, useEffect, useState } from "react";
import { getCart } from "../assets/services/cartService.js";

const CartContext = createContext();

/* eslint-disable react-refresh/only-export-components */
export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = async () => {
    try {
      const cart = await getCart();
      setCartCount((cart || []).length); // count unique products, not quantity
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCartCount();
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
