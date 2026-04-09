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

      const selectedProduct = products.find((p) => p.id === productId);
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f2e8]">
        <div className="text-2xl text-[#8b5e34] animate-pulse">
          Loading products...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8]">
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#f1d7ac] to-[#f8f2e8] pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-[#fff7eb] text-[#8b5e34] px-4 py-2 rounded-full font-semibold text-sm shadow-sm mb-6">
              Freshly Cooked Banana Chips
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-[#8b5e34] leading-tight mb-6">
              Saba Chips
            </h1>

            <p className="text-xl md:text-2xl text-[#6d4c2f] font-medium mb-3">
              Catarman, Liloan, Cebu
            </p>

            <p className="text-base md:text-lg text-[#6d4c2f] leading-relaxed mb-8 max-w-2xl">
              Crispy, flavorful, and freshly cooked banana chips made for every
              snack lover. Try our crowd favorites and order before we sell out
              again.
            </p>

            <div className="bg-white/80 rounded-3xl p-6 shadow-lg border border-[#ead7b8] mb-8">
              <h2 className="text-xl font-bold text-[#8b5e34] mb-4">
                Available Flavors
              </h2>

              <div className="grid sm:grid-cols-2 gap-3 text-[#5f432c]">
                <div>🧀 Cheese</div>
                <div>🌿 Sour Cream <span className="font-semibold">(best seller)</span></div>
                <div>🍖 Barbecue <span className="font-semibold">(best seller)</span></div>
                <div>🌶️ Chili BBQ <span className="font-semibold">(best seller)</span></div>
                <div>🧀 Sour Cheese</div>
                <div>⚪ Plain (No sugar, No Flavor)</div>
              </div>
            </div>

            <div className="bg-[#fff7eb] border border-[#ead7b8] rounded-2xl p-5 mb-8 shadow-sm">
              <p className="text-[#7a5331] font-semibold mb-2">
                🚚 Free delivery on 4 packs and up
              </p>
              <p className="text-[#6d4c2f]">
                Consolacion, Liloan & Compostela
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/cart"
                className="bg-[#8b5e34] text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:bg-[#714a28] transition"
              >
                View Cart
              </Link>

              <a
                href="#products"
                className="bg-white text-[#8b5e34] px-8 py-4 rounded-2xl font-semibold border border-[#d8be96] hover:bg-[#fff7eb] transition"
              >
                Shop Now
              </a>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-xl bg-[#e7c391] rounded-[2rem] p-4 shadow-2xl">
              <img
                src="/saba-banner.jpg"
                alt="Saba Chips"
                className="w-full h-[420px] object-cover rounded-[1.5rem]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="bg-[#fdf7ed] rounded-[1.5rem] p-10 text-center">
                <div className="text-6xl mb-4">🍌</div>
                <h3 className="text-4xl font-black text-[#8b5e34] mb-3">
                  SABA CHIPS
                </h3>
                <p className="text-[#6d4c2f] text-xl font-medium mb-2">
                  Freshly Cooked Banana Chips
                </p>
                <p className="text-[#6d4c2f]">Catarman, Liloan, Cebu</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-20 bg-[#fffaf2]">
        <div className="max-w-6xl mx-auto px-6">
          {cartMessage && (
            <div className="max-w-md mx-auto mb-10 p-4 bg-green-100 border border-green-300 rounded-2xl text-green-800 font-semibold text-center shadow-lg">
              {cartMessage}
            </div>
          )}

          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black text-[#8b5e34] mb-4">
              Our Products
            </h2>
            <p className="text-lg text-[#6d4c2f] max-w-2xl mx-auto">
              Message us now before we sell out again ✨
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl shadow-lg border border-[#ead7b8] overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition"
              >
                <div className="h-64 bg-[#f7ecd8] flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={`http://localhost:5000${product.image}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-7xl">🍟</div>
                  )}
                </div>

                <div className="p-7">
                  <h3 className="text-2xl font-bold text-[#8b5e34] mb-2">
                    {product.name}
                  </h3>

                  <p className="text-[#6d4c2f] mb-4 min-h-[48px]">
                    {product.description || "Freshly cooked banana chips"}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl font-black text-[#8b5e34]">
                      ₱{product.price}
                    </div>

                    <div
                      className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        product.stock <= 0
                          ? "bg-red-100 text-red-700"
                          : product.stock <= 5
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {product.stock <= 0
                        ? "Out of Stock"
                        : product.stock <= 5
                        ? `Low: ${product.stock}`
                        : `Stock: ${product.stock}`}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={product.stock <= 0}
                    className={`w-full py-3 rounded-2xl font-semibold transition ${
                      product.stock <= 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#8b5e34] text-white hover:bg-[#714a28]"
                    }`}
                  >
                    {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-24">
              <div className="text-6xl mb-6">📦</div>
              <h3 className="text-3xl font-bold text-[#8b5e34] mb-3">
                No products yet
              </h3>
              <p className="text-[#6d4c2f]">
                Please check back again soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;