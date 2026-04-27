import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { addToCart } from "../assets/services/cartService.js";
import { askTasteAssistant } from "../assets/services/aiService.js";
import {
  addWishlistItem,
  removeWishlistItem,
} from "../assets/services/wishlistService.js";
import { useCart } from "../context/CartContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import { useProducts } from "../context/ProductContext.jsx";
import { getMediaUrl } from "../utils/media.js";

function Home() {
  const [loading, setLoading] = useState(true);
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      text: "Hi! Ask me about flavors, prices, stock, best sellers, or what to buy first.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const aiQuickPrompts = [
    "What flavors are available?",
    "What are the best sellers?",
    "Show prices",
    "Suggest for first-time buyer",
  ];

  const chatEndRef = useRef(null);

  const { refreshCartCount } = useCart();
  const { products, refreshProducts } = useProducts();
  const { notify } = useNotification();

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, aiLoading, chatOpen]);

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
      notify({
        type: "success",
        title: "Added to Cart",
        message: `${selectedProduct?.name || "Product"} was added to your cart.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Add to Cart Failed",
        message: err?.response?.data?.message || "Please login to add to cart",
      });
    }
  };

  const handleWishlistToggle = async (product) => {
    try {
      if (product.is_wishlisted) {
        await removeWishlistItem(product.id);
        notify({
          type: "info",
          title: "Wishlist updated",
          message: `${product.name} was removed from your wishlist.`,
        });
      } else {
        await addWishlistItem(product.id);
        notify({
          type: "success",
          title: "Wishlist updated",
          message: `${product.name} was saved to your wishlist.`,
        });
      }
      await refreshProducts();
    } catch (err) {
      notify({
        type: "error",
        title: "Wishlist Failed",
        message: err?.response?.data?.message || "Please login to use wishlist.",
      });
    }
  };

  const handleAskAI = async (presetMessage) => {
    const nextMessage = presetMessage || aiMessage;
    if (!nextMessage.trim()) return;

    const userQuestion = nextMessage.trim();

    setChatMessages((prev) => [
      ...prev,
      { sender: "user", text: userQuestion, createdAt: new Date().toISOString() },
    ]);
    setAiMessage("");
    setAiLoading(true);

    try {
      const res = await askTasteAssistant(userQuestion);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.reply || "Sorry, I could not answer that right now.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      notify({
        type: "error",
        title: "Assistant Unavailable",
        message: "The AI taste assistant is unavailable right now.",
      });
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, the AI assistant is unavailable right now.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskAI();
    }
  };

  const formatChatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

  const visibleProducts = [...products]
    .filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "available" && Number(product.stock) > 0) ||
        (stockFilter === "low" &&
          Number(product.stock) > 0 &&
          Number(product.stock) <= 5) ||
        (stockFilter === "out" && Number(product.stock) <= 0);

      return matchesSearch && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
      if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
      if (sortBy === "name") return String(a.name).localeCompare(String(b.name));
      return (
        new Date(b.created_at || 0) - new Date(a.created_at || 0) ||
        Number(b.id) - Number(a.id)
      );
    });

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
    <div className="min-h-screen bg-[#f8f2e8] relative">
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
                <div>Cheese</div>
                <div>Sour Cream</div>
                <div>Barbecue</div>
                <div>Chili BBQ</div>
                <div>Sour Cheese</div>
                <div>Plain (No sugar, No flavor)</div>
              </div>
            </div>

            <div className="bg-[#fff7eb] border border-[#ead7b8] rounded-2xl p-5 mb-8 shadow-sm">
              <p className="text-[#7a5331] font-semibold mb-2">Free delivery</p>
              <p className="text-[#6d4c2f]">Consolacion, Liloan & Compostela</p>
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

      <section id="products" className="py-20 bg-[#fffaf2]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black text-[#8b5e34] mb-4">
              Our Products
            </h2>
            <p className="text-lg text-[#6d4c2f] max-w-2xl mx-auto">
              Message us now before we sell out again.
            </p>
          </div>

          <div className="mb-10 grid gap-4 rounded-3xl border border-[#ead7b8] bg-white p-5 shadow-sm md:grid-cols-[1.3fr_0.8fr_0.8fr]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product or flavor..."
              className="w-full rounded-2xl border border-[#d8be96] bg-[#fffaf2] p-4 text-[#6d4c2f] focus:outline-none focus:ring-2 focus:ring-[#d6b585]"
            />

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full rounded-2xl border border-[#d8be96] bg-[#fffaf2] p-4 text-[#6d4c2f] focus:outline-none focus:ring-2 focus:ring-[#d6b585]"
            >
              <option value="all">All stock levels</option>
              <option value="available">Available only</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-2xl border border-[#d8be96] bg-[#fffaf2] p-4 text-[#6d4c2f] focus:outline-none focus:ring-2 focus:ring-[#d6b585]"
            >
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-[#6d4c2f]">
            <p>{visibleProducts.length} product(s) shown</p>
            {(searchTerm || stockFilter !== "all" || sortBy !== "newest") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStockFilter("all");
                  setSortBy("newest");
                }}
                className="rounded-full border border-[#d8be96] px-4 py-2 hover:bg-[#fff7eb]"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl shadow-lg border border-[#ead7b8] overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition"
              >
                <div className="relative h-64 bg-[#f7ecd8] flex items-center justify-center overflow-hidden">
                  <button
                    onClick={() => handleWishlistToggle(product)}
                    className={`absolute right-4 top-4 z-10 rounded-full px-3 py-2 text-lg shadow-lg ${
                      product.is_wishlisted
                        ? "bg-red-600 text-white"
                        : "bg-white text-[#8b5e34]"
                    }`}
                    title={product.is_wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    aria-label={product.is_wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {product.is_wishlisted ? "♥" : "♡"}
                  </button>
                  {product.image ? (
                    <img
                      src={getMediaUrl(product.image)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-7xl">Chips</div>
                  )}
                </div>

                <div className="p-7">
                  <h3 className="text-2xl font-bold text-[#8b5e34] mb-2">
                    {product.name}
                  </h3>

                  <p className="text-[#6d4c2f] mb-4 min-h-[48px]">
                    {product.description || "Freshly cooked banana chips"}
                  </p>

                  <div className="mb-4 flex items-center justify-between rounded-xl bg-[#fffaf2] px-3 py-2 text-sm">
                    <span className="font-black text-[#8b5e34]">
                      ★ {Number(product.average_rating || 0).toFixed(1)}
                    </span>
                    <span className="text-[#6d4c2f]">
                      {product.review_count || 0} review(s)
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl font-black text-[#8b5e34]">
                      PHP {product.price}
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

          {visibleProducts.length === 0 && (
            <div className="text-center py-24">
              <div className="text-6xl mb-6">Products</div>
              <h3 className="text-3xl font-bold text-[#8b5e34] mb-3">
                No matching products
              </h3>
              <p className="text-[#6d4c2f]">
                Try adjusting your search or stock filters.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="w-[340px] sm:w-[380px] h-[520px] bg-white border border-[#ead7b8] rounded-3xl shadow-2xl mb-4 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">Taste Assistant</h3>
                <p className="text-sm text-[#fff1df]">
                  Ask about flavors and best sellers
                </p>
              </div>

              <button
                onClick={() => setChatOpen(false)}
                className="text-white text-xl font-bold hover:opacity-80"
              >
                x
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#fffaf2] space-y-3">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                      msg.sender === "user"
                        ? "bg-[#8b5e34] text-white rounded-br-md"
                        : "bg-white text-[#6d4c2f] border border-[#ead7b8] rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <p
                      className={`mt-2 text-[11px] ${
                        msg.sender === "user" ? "text-[#fff1df]" : "text-[#9a7654]"
                      }`}
                    >
                      {formatChatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md text-sm shadow-sm bg-white text-[#6d4c2f] border border-[#ead7b8]">
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={chatEndRef}></div>
            </div>

            <div className="p-4 border-t border-[#ead7b8] bg-white">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {aiQuickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleAskAI(prompt)}
                    disabled={aiLoading}
                    className="shrink-0 rounded-full border border-[#d8be96] bg-[#fffaf2] px-3 py-2 text-xs font-bold text-[#8b5e34] hover:bg-[#f5e4c9] disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  rows="2"
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about flavors..."
                  className="flex-1 border border-[#d8be96] rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-[#d6b585] resize-none"
                />

                <button
                  onClick={() => handleAskAI()}
                  disabled={aiLoading}
                  className="bg-[#8b5e34] text-white px-4 rounded-2xl font-semibold hover:bg-[#714a28] transition disabled:opacity-60"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setChatOpen((prev) => !prev)}
          className="w-16 h-16 rounded-full bg-[#8b5e34] text-white shadow-2xl flex items-center justify-center text-2xl hover:bg-[#714a28] transition"
          title="Taste Assistant"
        >
          🤖
        </button>
      </div>
    </div>
  );
}

export default Home;
