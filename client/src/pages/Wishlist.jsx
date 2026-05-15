import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addToCart } from "../assets/services/cartService.js";
import {
  getWishlist,
  removeWishlistItem,
} from "../assets/services/wishlistService.js";
import { useCart } from "../context/CartContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import { useProducts } from "../context/ProductContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { getMediaUrl } from "../utils/media.js";

const iconPaths = {
  arrowLeft: "M19 12H5m6-6-6 6 6 6",
  bag: "M6 8h12l-1 13H7L6 8Zm3 0a3 3 0 0 1 6 0",
  heart:
    "M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z",
  minus: "M5 12h14",
  plus: "M12 5v14m-7-7h14",
  star: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z",
  trash:
    "M4 7h16m-10 4v6m4-6v6M9 7V4h6v3m-9 0 1 14h10l1-14",
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

function Wishlist() {
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [quantities, setQuantities] = useState({});
  const { refreshCartCount } = useCart();
  const { notify } = useNotification();
  const { products, refreshProducts } = useProducts();
  const { refreshWishlistCount } = useWishlist();

  useEffect(() => {
    void loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const [, savedIds] = await Promise.all([refreshProducts(), getWishlist()]);
      setWishlistIds((savedIds || []).map((id) => Number(id)));
    } catch (err) {
      console.error("Wishlist fetch failed:", err);
      notify({
        type: "error",
        title: "Wishlist unavailable",
        message: "Unable to load your saved products right now.",
      });
    } finally {
      setLoading(false);
    }
  };

  const wishlistProducts = useMemo(() => {
    const order = new Map(wishlistIds.map((id, index) => [Number(id), index]));

    return products
      .filter((product) => order.has(Number(product.id)))
      .sort(
        (a, b) =>
          Number(order.get(Number(a.id)) || 0) -
          Number(order.get(Number(b.id)) || 0)
      );
  }, [products, wishlistIds]);

  const productQuantity = (product) => quantities[product.id] || 1;

  const setProductQuantity = (product, quantity) => {
    const stock = Number(product.stock || 0);
    const nextQuantity = Math.max(1, Math.min(Number(quantity) || 1, stock || 1));
    setQuantities((prev) => ({ ...prev, [product.id]: nextQuantity }));
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, productQuantity(product));
      await removeWishlistItem(product.id);
      setWishlistIds((prev) => prev.filter((id) => Number(id) !== Number(product.id)));
      setQuantities((prev) => {
        const nextQuantities = { ...prev };
        delete nextQuantities[product.id];
        return nextQuantities;
      });
      await refreshCartCount();
      await refreshProducts();
      await refreshWishlistCount();

      notify({
        type: "success",
        title: "Moved to Cart",
        message: `${product.name || "Product"} was added to your cart and removed from your wishlist.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Move to Cart Failed",
        message:
          err?.response?.data?.message ||
          "Unable to move this saved product to your cart.",
      });
    }
  };

  const handleRemove = async (product) => {
    try {
      await removeWishlistItem(product.id);
      setWishlistIds((prev) => prev.filter((id) => Number(id) !== Number(product.id)));
      await refreshProducts();
      await refreshWishlistCount();

      notify({
        type: "info",
        title: "Wishlist updated",
        message: `${product.name} was removed from your wishlist.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Wishlist Failed",
        message: err?.response?.data?.message || "Unable to update wishlist.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8] px-4">
        <div className="rounded-2xl border border-[#ead7b8] bg-white px-6 py-4 text-xl font-black text-[#8b5e34] shadow-sm">
          Loading saved products...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f2e8] py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#9a7654]">
              <Icon name="heart" className="h-4 w-4" fill="currentColor" />
              My wishlist
            </p>
            <h1 className="mt-3 text-4xl font-black text-[#5f432c] md:text-5xl">
              Saved Products
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6d4c2f]">
              Products you marked with the heart button are collected here for
              faster checkout later.
            </p>
          </div>
          <Link
            to="/home"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8be96] bg-white px-5 py-3 font-black text-[#8b5e34] transition hover:bg-[#fff7eb]"
          >
            <Icon name="arrowLeft" className="h-5 w-5" />
            Back to store
          </Link>
        </div>

        <div className="mb-8 rounded-[1.5rem] border border-[#ead7b8] bg-white px-5 py-4 shadow-sm">
          <p className="text-sm font-bold text-[#6d4c2f]">
            {wishlistProducts.length} saved product(s)
          </p>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="rounded-[1.5rem] border border-[#ead7b8] bg-white px-8 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4df] text-[#8b5e34]">
              <Icon name="heart" className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-3xl font-black text-[#8b5e34]">
              No saved products yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6d4c2f]">
              Use the heart button on any product card to save it here.
            </p>
            <Link
              to="/home"
              className="mt-8 inline-flex rounded-2xl bg-[#8b5e34] px-6 py-3 text-sm font-black text-white transition hover:bg-[#714a28]"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {wishlistProducts.map((product) => {
              const stock = Number(product.stock || 0);
              const rating = Number(product.average_rating || 0).toFixed(1);

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-[1.5rem] border border-[#ead7b8] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-64 overflow-hidden bg-[#f7ecd8]">
                    <button
                      type="button"
                      onClick={() => handleRemove(product)}
                      className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#b6402e] text-white shadow-lg transition hover:bg-[#9f3426]"
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                    >
                      <Icon name="trash" className="h-5 w-5" />
                    </button>

                    {stock > 0 && stock <= 5 && (
                      <span className="absolute left-4 top-4 z-10 rounded-full bg-[#fff6da] px-3 py-1 text-xs font-black text-[#8b5e34] shadow-sm">
                        Almost sold out
                      </span>
                    )}

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
                    <h2 className="text-2xl font-black text-[#5f432c]">
                      {product.name}
                    </h2>
                    <p className="mt-2 min-h-[44px] text-sm leading-relaxed text-[#6d4c2f]">
                      {product.description || "Freshly cooked banana chips"}
                    </p>

                    <div className="my-5 grid grid-cols-2 gap-3">
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
                          type="button"
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
                          type="button"
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

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={stock <= 0}
                        className={`inline-flex w-full flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-black transition ${
                          stock <= 0
                            ? "cursor-not-allowed bg-gray-200 text-gray-500"
                            : "bg-[#8b5e34] text-white hover:bg-[#714a28]"
                        }`}
                      >
                        <Icon name="bag" className="h-5 w-5" />
                        {stock <= 0 ? "Out of Stock" : "Add to Cart"}
                      </button>

                      <Link
                        to={`/product/${product.id}`}
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-[#d8be96] bg-[#fffaf2] px-4 py-3 text-sm font-black text-[#8b5e34] transition hover:bg-[#f5e4c9] sm:w-auto"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default Wishlist;
