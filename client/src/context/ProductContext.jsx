import { createContext, useContext, useEffect, useState } from "react";
import { getProducts } from "../assets/services/productService.js";

const ProductContext = createContext();

/* eslint-disable react-refresh/only-export-components */
export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);

  const refreshProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error("Failed to refresh products:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, setProducts, refreshProducts }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductContext);
}
