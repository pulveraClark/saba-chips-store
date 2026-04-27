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
import { getTopSellingProducts } from "../assets/services/productService.js";
import { getMediaUrl } from "../utils/media.js";

const flavors = ["Cheese", "Sour Cream", "Barbecue", "Chili BBQ", "Sour Cheese", "Plain"];

const iconPaths = {
  assistant: "M12 3v3m7 4v5a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3Zm-8 4h.01M15 14h.01M9 18h6",
  bag: "M6 8h12l-1 13H7L6 8Zm3 0a3 3 0 0 1 6 0",
  check: "m5 13 4 4L19 7",
  heart: "M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z",
  heartOutline:
    "M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z",
  minus: "M5 12h14",
  plus: "M12 5v14m-7-7h14",
  search: "m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
  send: "M22 2 11 13m11-11-7 20-4-9-9-4 20-7Z",
  star: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z",
};

function Icon({ name, className = "h-5 w-5", fill = "none" }) {
  return (
    <svg
      className={className}
      fill={fill}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

function Home() {
  const [loading, setLoading] = useState(true);
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [quantities, setQuantities] = useState({});
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      text: "Hi! Ask me about flavors, prices, stock, best sellers, or what to buy first.",
      createdAt: new Date().toISOString(),
    },
  ]);

  const aiQuickPrompts = [
    "What flavors are available?",
    "Show current best sellers",
    "Show prices",
    "Recommend a first order",
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
    const timer = window.setInterval(() => {
      refreshTopSellingProducts();
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, aiLoading, chatOpen]);

  const loadProducts = async () => {
    try {
      const [, topSelling] = await Promise.all([
        refreshProducts(),
        getTopSellingProducts(5),
      ]);
      setTopSellingProducts(topSelling || []);
    } catch (err) {
      console.error("Products fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshTopSellingProducts = async () => {
    try {
      const topSelling = await getTopSellingProducts(5);
      setTopSellingProducts(topSelling || []);
    } catch (err) {
      console.error("Top selling products refresh failed:", err);
    }
  };

  const productQuantity = (product) => quantities[product.id] || 1;

  const setProductQuantity = (product, quantity) => {
    const stock = Number(product.stock || 0);
    const nextQuantity = Math.max(1, Math.min(Number(quantity) || 1, stock || 1));
    setQuantities((prev) => ({ ...prev, [product.id]: nextQuantity }));
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, productQuantity(product));
      await refreshCartCount();
      await refreshProducts();
      const topSelling = await getTopSellingProducts(5);
      setTopSellingProducts(topSelling || []);

      notify({
        type: "success",
        title: "Added to Cart",
        message: `${product.name || "Product"} was added to your cart.`,
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

  const availableProducts = products.filter((product) => Number(product.stock) > 0);
  const lowStockCount = products.filter(
    (product) => Number(product.stock) > 0 && Number(product.stock) <= 5
  ).length;
  const highestSoldQuantity = Number(topSellingProducts[0]?.total_quantity || 0);
  const bestSellerIds = new Set(
    topSellingProducts
      .filter(
        (product) =>
          highestSoldQuantity > 0 &&
          Number(product.total_quantity || 0) === highestSoldQuantity
      )
      .map((product) => Number(product.id))
  );
  const bestSeller = topSellingProducts[0]
    ? products.find((product) => Number(product.id) === Number(topSellingProducts[0].id)) ||
      topSellingProducts[0]
    : null;

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
      if (sortBy === "rating") {
        return Number(b.average_rating || 0) - Number(a.average_rating || 0);
      }
      return (
        new Date(b.created_at || 0) - new Date(a.created_at || 0) ||
        Number(b.id) - Number(a.id)
      );
    });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8]">
        <div className="rounded-2xl border border-[#ead7b8] bg-white px-6 py-4 text-xl font-black text-[#8b5e34] shadow-sm">
          Loading fresh products...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f8f2e8]">
      <section className="bg-[#f8f2e8] pt-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ead7b8] bg-white px-4 py-2 text-sm font-black text-[#8b5e34] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#6f8f3d]"></span>
              Freshly cooked in Catarman, Liloan
            </div>

            <h1 className="mb-6 text-5xl font-black leading-tight text-[#5f432c] md:text-7xl">
              Real Cebu comfort snack, packed fresh for your day.
            </h1>

            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-[#6d4c2f] md:text-xl">
              Crispy Saba Chips in classic and flavored packs, made for quick
              cravings, pasalubong, office snacks, and family merienda.
            </p>

            <div className="mb-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Free delivery", "Consolacion, Liloan, Compostela"],
                ["Current stock", `${availableProducts.length} items available`],
                ["Fast updates", "Order status and messages"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#ead7b8] bg-white/85 p-4 shadow-sm"
                >
                  <p className="text-sm font-black text-[#8b5e34]">{label}</p>
                  <p className="mt-1 text-sm text-[#6d4c2f]">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#products"
                className="inline-flex items-center justify-center rounded-2xl bg-[#8b5e34] px-8 py-4 font-black text-white shadow-lg transition hover:bg-[#714a28]"
              >
                Shop Available Packs
              </a>
              <Link
                to="/cart"
                className="inline-flex items-center justify-center rounded-2xl border border-[#d8be96] bg-white px-8 py-4 font-black text-[#8b5e34] transition hover:bg-[#fff7eb]"
              >
                View Cart
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-[#ead7b8] bg-white shadow-2xl">
              <div className="relative h-[430px] bg-[#ead7b8]">
                <img
                  src="/saba-banner.jpg"
                  alt="Saba Chips packs"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3f2a18]/85 to-transparent p-6 text-white">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#ffe2ad]">
                    Saba Chips
                  </p>
                  <p className="mt-2 text-3xl font-black">Fresh local packs</p>
                </div>
              </div>
              {bestSeller && (
                <div className="grid gap-3 border-t border-[#ead7b8] bg-[#fffaf2] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a7654]">
                      Customer favorite
                    </p>
                    <p className="text-xl font-black text-[#5f432c]">
                      {bestSeller.name}
                    </p>
                  </div>
                  <a
                    href="#products"
                    className="rounded-full bg-[#6f8f3d] px-5 py-2 text-center text-sm font-black text-white"
                  >
                    Order now
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#ead7b8] bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-8 md:grid-cols-3">
          {[
            ["Choose your flavor", "Pick from cheese, sour cream, barbecue, chili BBQ, sour cheese, or plain."],
            ["Checkout securely", "Add delivery details and choose Cash on Delivery."],
            ["Track your order", "Get order updates from pending to delivered."],
          ].map(([title, text]) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1dfc2] text-[#8b5e34]">
                <Icon name="check" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black text-[#5f432c]">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#6d4c2f]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="products" className="bg-[#fffaf2] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-[#9a7654]">
                Storefront
              </p>
              <h2 className="text-4xl font-black text-[#5f432c] md:text-5xl">
                Shop Saba Chips
              </h2>
              <p className="mt-3 max-w-2xl text-[#6d4c2f]">
                Browse current stock, order by pack, and save favorites for your
                next merienda run.
              </p>
            </div>
            {lowStockCount > 0 && (
              <div className="rounded-2xl border border-[#e8c475] bg-[#fff6da] px-5 py-3 text-sm font-bold text-[#8b5e34]">
                {lowStockCount} product(s) are almost sold out
              </div>
            )}
          </div>

          <div className="mb-8 grid gap-4 rounded-[1.5rem] border border-[#ead7b8] bg-white p-4 shadow-sm md:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <label className="relative block">
              <Icon
                name="search"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9a7654]"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search product or flavor"
                className="w-full rounded-2xl border border-[#d8be96] bg-[#fffaf2] py-4 pl-12 pr-4 text-[#6d4c2f] focus:outline-none focus:ring-2 focus:ring-[#d6b585]"
              />
            </label>

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
              <option value="rating">Highest rated</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-[#6d4c2f]">
            <p>{visibleProducts.length} product(s) shown</p>
            {(searchTerm || stockFilter !== "all" || sortBy !== "newest") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStockFilter("all");
                  setSortBy("newest");
                }}
                className="rounded-full border border-[#d8be96] bg-white px-4 py-2 hover:bg-[#fff7eb]"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => {
              const stock = Number(product.stock || 0);
              const rating = Number(product.average_rating || 0).toFixed(1);
              const isBestSeller = bestSellerIds.has(Number(product.id));

              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-[1.5rem] border border-[#ead7b8] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-64 overflow-hidden bg-[#f7ecd8]">
                    <button
                      onClick={() => handleWishlistToggle(product)}
                      className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition ${
                        product.is_wishlisted
                          ? "bg-[#b6402e] text-white"
                          : "bg-white text-[#8b5e34] hover:bg-[#fff4df]"
                      }`}
                      title={
                        product.is_wishlisted
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                      aria-label={
                        product.is_wishlisted
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                    >
                      <Icon
                        name={product.is_wishlisted ? "heart" : "heartOutline"}
                        className="h-5 w-5"
                        fill={product.is_wishlisted ? "currentColor" : "none"}
                      />
                    </button>

                    <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                      {isBestSeller && (
                        <span className="rounded-full bg-[#6f8f3d] px-3 py-1 text-xs font-black text-white shadow-sm">
                          Best seller
                        </span>
                      )}
                      {stock > 0 && stock <= 5 && (
                        <span className="rounded-full bg-[#fff6da] px-3 py-1 text-xs font-black text-[#8b5e34] shadow-sm">
                          Almost sold out
                        </span>
                      )}
                    </div>

                    {product.image ? (
                      <img
                        src={getMediaUrl(product.image)}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-8">
                        <div className="rounded-3xl border border-[#ead7b8] bg-[#fffaf2] px-8 py-6 text-center">
                          <p className="text-2xl font-black text-[#8b5e34]">
                            Saba Chips
                          </p>
                          <p className="mt-2 text-sm text-[#6d4c2f]">
                            Product photo coming soon
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-black text-[#5f432c]">
                          {product.name}
                        </h3>
                        <p className="mt-1 min-h-[44px] text-sm leading-relaxed text-[#6d4c2f]">
                          {product.description || "Freshly cooked banana chips"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {flavors
                        .filter((flavor) =>
                          `${product.name || ""} ${product.description || ""}`
                            .toLowerCase()
                            .includes(flavor.toLowerCase())
                        )
                        .slice(0, 2)
                        .map((flavor) => (
                          <span
                            key={flavor}
                            className="rounded-full bg-[#fff7eb] px-3 py-1 text-xs font-black text-[#8b5e34]"
                          >
                            {flavor}
                          </span>
                        ))}
                    </div>

                    <div className="mb-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#fffaf2] p-3">
                        <p className="text-xs font-bold text-[#9a7654]">Rating</p>
                        <p className="mt-1 inline-flex items-center gap-1 font-black text-[#8b5e34]">
                          <Icon
                            name="star"
                            className="h-4 w-4"
                            fill="currentColor"
                          />
                          {rating}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#fffaf2] p-3">
                        <p className="text-xs font-bold text-[#9a7654]">Stock</p>
                        <p className="mt-1 font-black text-[#8b5e34]">
                          {stock <= 0 ? "Sold out" : `${stock} left`}
                        </p>
                      </div>
                    </div>

                    <div className="mb-5 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a7654]">
                          Price
                        </p>
                        <p className="text-3xl font-black text-[#5f432c]">
                          PHP {Number(product.price || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center rounded-2xl border border-[#d8be96] bg-[#fffaf2] p-1">
                        <button
                          onClick={() =>
                            setProductQuantity(product, productQuantity(product) - 1)
                          }
                          disabled={stock <= 0 || productQuantity(product) <= 1}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8b5e34] hover:bg-white disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Icon name="minus" className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 text-center font-black text-[#5f432c]">
                          {productQuantity(product)}
                        </span>
                        <button
                          onClick={() =>
                            setProductQuantity(product, productQuantity(product) + 1)
                          }
                          disabled={stock <= 0 || productQuantity(product) >= stock}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8b5e34] hover:bg-white disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Icon name="plus" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={stock <= 0}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-black transition ${
                        stock <= 0
                          ? "cursor-not-allowed bg-gray-200 text-gray-500"
                          : "bg-[#8b5e34] text-white hover:bg-[#714a28]"
                      }`}
                    >
                      <Icon name="bag" className="h-5 w-5" />
                      {stock <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleProducts.length === 0 && (
            <div className="rounded-[1.5rem] border border-[#ead7b8] bg-white px-8 py-20 text-center">
              <h3 className="text-3xl font-black text-[#8b5e34]">
                No matching products
              </h3>
              <p className="mt-3 text-[#6d4c2f]">
                Try adjusting your search or stock filters.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-[#9a7654]">
              Delivery coverage
            </p>
            <h2 className="text-3xl font-black text-[#5f432c]">
              Free delivery in nearby areas.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Consolacion", "Liloan", "Compostela"].map((area) => (
              <div
                key={area}
                className="rounded-2xl border border-[#ead7b8] bg-[#fffaf2] p-5"
              >
                <p className="font-black text-[#8b5e34]">{area}</p>
                <p className="mt-1 text-sm text-[#6d4c2f]">Free local delivery</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        {chatOpen && (
          <div className="mb-4 flex h-[min(620px,calc(100vh-7rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[1.75rem] border border-[#d8be96] bg-white shadow-2xl sm:w-[420px]">
            <div className="bg-[#8b5e34] px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <Icon name="assistant" className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-tight">
                      Taste Assistant
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-[#fff1df]">
                      <span className="h-2 w-2 rounded-full bg-[#b7d67a]"></span>
                      Sales-aware product helper
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setChatOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-black hover:bg-white/15"
                  aria-label="Close taste assistant"
                >
                  x
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[#fffaf2] p-4 [scrollbar-width:thin]">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[84%] rounded-[1.25rem] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "rounded-br-md bg-[#8b5e34] text-white"
                        : "rounded-bl-md border border-[#ead7b8] bg-white text-[#5f432c]"
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
                  <div className="max-w-[84%] rounded-[1.25rem] rounded-bl-md border border-[#ead7b8] bg-white px-4 py-3 text-sm text-[#6d4c2f] shadow-sm">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#8b5e34]"></span>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#b8834d] [animation-delay:150ms]"></span>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#d8be96] [animation-delay:300ms]"></span>
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef}></div>
            </div>

            <div className="border-t border-[#ead7b8] bg-white p-4">
              <div className="mb-3 grid grid-cols-2 gap-2">
                {aiQuickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleAskAI(prompt)}
                    disabled={aiLoading}
                    className="min-h-10 rounded-2xl border border-[#d8be96] bg-[#fffaf2] px-3 py-2 text-left text-xs font-black leading-snug text-[#8b5e34] transition hover:bg-[#f5e4c9] disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2 rounded-[1.35rem] border border-[#d8be96] bg-[#fffaf2] p-2 focus-within:ring-2 focus-within:ring-[#d6b585]">
                <textarea
                  rows="2"
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about flavors, prices, or best sellers..."
                  className="max-h-24 min-h-[46px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-[#5f432c] placeholder:text-[#a99a8a] focus:outline-none"
                />

                <button
                  onClick={() => handleAskAI()}
                  disabled={aiLoading}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#8b5e34] text-white transition hover:bg-[#714a28] disabled:opacity-60"
                  aria-label="Send message"
                >
                  <Icon name="send" className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setChatOpen((prev) => !prev)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#8b5e34] text-white shadow-2xl transition hover:bg-[#714a28]"
          title="Taste Assistant"
          aria-label="Taste Assistant"
        >
          <Icon name="assistant" className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}

export default Home;
