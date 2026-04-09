import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { addToCart } from "../assets/services/cartService.js";
import { useCart } from "../context/CartContext.jsx";
import { useProducts } from "../context/ProductContext.jsx";

function Home() {
  const [loading, setLoading] = useState(true);
  const [cartMessage, setCartMessage] = useState("");
  const { refreshCartCount } = useCart();
  const { products, refreshProducts } = useProducts();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      await refreshProducts();
    } catch (err) {
      console.error("Products fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId);
      await refreshCartCount();
      await refreshProducts();

      const selectedProduct = products.find(
        (p) => p.id === productId || p._id === productId
      );

      setCartMessage(`${selectedProduct?.name || "Product"} added to cart!`);
      setTimeout(() => setCartMessage(""), 3000);
    } catch (err) {
      setCartMessage(
        err?.response?.data?.message || "Please login to add to cart"
      );
      setTimeout(() => setCartMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50">
        <div className="text-2xl text-gray-600 animate-pulse">
          Loading products...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-sabaGreen to-emerald-600 pt-32 pb-24 text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-7xl font-black mb-6 drop-shadow-2xl">
            Saba Chips
          </h1>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto opacity-95 drop-shadow-lg">
            Live products ({products.length} available)
          </p>
          <Link
            to="/cart"
            className="btn-primary text-lg px-10 py-4 shadow-xl inline-block"
          >
            View Cart
          </Link>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          {cartMessage && (
            <div className="max-w-md mx-auto mb-12 p-4 bg-green-100 border border-green-300 rounded-2xl text-green-800 font-semibold text-center shadow-lg animate-pulse">
              {cartMessage}
            </div>
          )}

          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Products ({products.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => {
              const productId = product.id || product._id;

              return (
                <div
                  key={productId}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:border-sabaGreen/30">
                    <div className="text-6xl mb-8 text-center p-6 bg-gray-50 rounded-2xl group-hover:bg-sabaGreen/5">
                      {product.image ? (
                        <img
                          src={`http://localhost:5000${product.image}`}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                      ) : (
                        "🍟"
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-sabaGreen">
                      {product.name}
                    </h3>

                    <p className="text-gray-600 mb-8">
                      {product.description || "Delicious saba chips"}
                    </p>

                    <div className="text-3xl font-black text-sabaGreen mb-4">
                      ₱{product.price}
                    </div>

                    <div
                      className={`text-sm font-semibold mb-6 ${
                        product.stock <= 0
                          ? "text-red-600"
                          : product.stock <= 5
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {product.stock <= 0
                        ? "Out of Stock"
                        : product.stock <= 5
                        ? `Low Stock: ${product.stock}`
                        : `In Stock: ${product.stock}`}
                    </div>

                    <button
                      onClick={() => handleAddToCart(productId)}
                      className={`w-full text-lg ${
                        product.stock <= 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed py-3 rounded-xl"
                          : "btn-primary"
                      }`}
                      disabled={product.stock <= 0}
                    >
                      {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {products.length === 0 && (
            <div className="text-center py-24 col-span-full">
              <div className="text-6xl mb-8">📦</div>
              <h3 className="text-3xl font-bold text-gray-700 mb-4">
                No products yet
              </h3>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;