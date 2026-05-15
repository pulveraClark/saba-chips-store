import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { addToCart } from "../assets/services/cartService.js";
import { getProductById } from "../assets/services/productService.js";
import { getProductReviews } from "../assets/services/reviewService.js";
import {
  addWishlistItem,
  removeWishlistItem,
} from "../assets/services/wishlistService.js";
import { useCart } from "../context/CartContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import { useProducts } from "../context/ProductContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { getMediaUrl } from "../utils/media.js";

const iconPaths = {
  heart:
    "M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z",
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

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { refreshCartCount } = useCart();
  const { notify } = useNotification();
  const { products, refreshProducts } = useProducts();
  const { refreshWishlistCount } = useWishlist();

  useEffect(() => {
    void loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      let productData = products.find((item) => String(item.id) === String(id));

      if (!productData) {
        productData = await getProductById(id);
      }

      const reviewsData = await getProductReviews(id);
      setProduct(productData || null);
      setReviews(reviewsData || []);
      setQuantity(Math.max(1, Math.min(productData?.stock || 1, 1)));
    } catch (err) {
      console.error("Failed to load product details:", err);
      notify({
        type: "error",
        title: "Product unavailable",
        message: "Unable to load the product details right now.",
      });
      setProduct(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCart(product.id, quantity);
      await refreshCartCount();
      await refreshProducts();

      notify({
        type: "success",
        title: "Added to Cart",
        message: `${product.name} was added to your cart.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Add to Cart Failed",
        message: err?.response?.data?.message || "Please login to add to cart",
      });
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    try {
      if (product.is_wishlisted) {
        await removeWishlistItem(product.id);
        setProduct((prev) =>
          prev ? { ...prev, is_wishlisted: false } : prev
        );
        notify({
          type: "info",
          title: "Wishlist updated",
          message: `${product.name} was removed from your wishlist.`,
        });
      } else {
        await addWishlistItem(product.id);
        setProduct((prev) => (prev ? { ...prev, is_wishlisted: true } : prev));
        notify({
          type: "success",
          title: "Wishlist updated",
          message: `${product.name} was saved to your wishlist.`,
        });
      }

      await refreshProducts();
      await refreshWishlistCount();
    } catch (err) {
      notify({
        type: "error",
        title: "Wishlist Failed",
        message: err?.response?.data?.message || "Unable to update wishlist.",
      });
    }
  };

  const decreaseQuantity = () => {
    setQuantity((value) => Math.max(1, value - 1));
  };

  const increaseQuantity = () => {
    setQuantity((value) => Math.min(Number(product?.stock || 1), value + 1));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8] px-4">
        <div className="rounded-2xl border border-[#ead7b8] bg-white px-6 py-4 text-xl font-black text-[#8b5e34] shadow-sm">
          Loading product information...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8] px-4">
        <div className="rounded-2xl border border-[#ead7b8] bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-xl font-black text-[#8b5e34]">Product not found</p>
          <p className="mt-3 text-sm text-[#6d4c2f]">This product may no longer be available.</p>
          <Link
            to="/home"
            className="mt-6 inline-flex rounded-2xl bg-[#8b5e34] px-6 py-3 text-sm font-black text-white transition hover:bg-[#714a28]"
          >
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  const stock = Number(product.stock || 0);
  const rating = Number(product.average_rating || 0).toFixed(1);
  const isNearlySoldOut = stock > 0 && stock <= 5;

  return (
    <main className="min-h-screen bg-[#f8f2e8] py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9a7654]">
              Product details
            </p>
            <h1 className="mt-3 text-4xl font-black text-[#5f432c] md:text-5xl">
              {product.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6d4c2f]">
              {product.description || "A tasty saba chips pack made for everyday snacking."}
            </p>
          </div>
          <Link
            to="/home"
            className="inline-flex items-center justify-center rounded-2xl border border-[#d8be96] bg-white px-5 py-3 font-black text-[#8b5e34] transition hover:bg-[#fff7eb]"
          >
            Back to store
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.85fr]">
          <section className="space-y-8">
            <div className="overflow-hidden rounded-[2rem] border border-[#ead7b8] bg-white shadow-sm">
              <div className="relative h-[520px] bg-[#f7ecd8]">
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition ${
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
                    name="heart"
                    className="h-6 w-6"
                    fill={product.is_wishlisted ? "currentColor" : "none"}
                  />
                </button>

                {product.image ? (
                  <img
                    src={getMediaUrl(product.image)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <div className="rounded-[1.5rem] border border-[#ead7b8] bg-[#fffaf2] px-8 py-10">
                      <p className="text-2xl font-black text-[#8b5e34]">No image available</p>
                      <p className="mt-3 text-sm text-[#6d4c2f]">We do not have a product photo for this item.</p>
                    </div>
                  </div>
                )}

                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#fff4df] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#8b5e34] shadow-sm">
                    {product.category || "Classic"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] shadow-sm ${
                      stock <= 0
                        ? "bg-[#f8d7da] text-[#9f3a38]"
                        : isNearlySoldOut
                        ? "bg-[#fff4df] text-[#8b5e34]"
                        : "bg-[#def7e6] text-[#326443]"
                    }`}
                  >
                    {stock <= 0 ? "Sold out" : isNearlySoldOut ? "Limited stock" : "In stock"}
                  </span>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-[#ead7b8] bg-[#fffaf2] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7654]">Price</p>
                    <p className="mt-3 text-3xl font-black text-[#5f432c]">
                      PHP {Number(product.price || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-[#ead7b8] bg-[#fffaf2] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7654]">Stock</p>
                    <p className="mt-3 text-3xl font-black text-[#5f432c]">
                      {stock <= 0 ? "0" : stock}
                    </p>
                    <p className="mt-1 text-sm text-[#6d4c2f]">packs available</p>
                  </div>
                  <div className="rounded-3xl border border-[#ead7b8] bg-[#fffaf2] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7654]">Rating</p>
                    <p className="mt-3 text-3xl font-black text-[#5f432c]">{rating}</p>
                    <p className="mt-1 text-sm text-[#6d4c2f]">{product.review_count || 0} reviews</p>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-[#ead7b8] bg-[#fffaf2] p-6">
                  <h2 className="text-lg font-black text-[#5f432c]">What makes this product special</h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#6d4c2f]">
                    {product.description || "Freshly cooked banana chips with local flavor. Perfect for gifting, snacking, and sharing."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#ead7b8] bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7654]">Customer reviews</p>
                  <p className="mt-2 text-sm text-[#6d4c2f]">Latest feedback from shoppers</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#5f432c]">{rating}</p>
                  <p className="text-sm text-[#6d4c2f]">{product.review_count || 0} reviews</p>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-2xl bg-[#fffaf2] p-6 text-center text-sm text-[#6d4c2f]">
                  No reviews yet. Be the first to share your experience.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-3xl border border-[#ead7b8] bg-[#fffaf2] p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#5f432c]">{review.customer_name || "Customer"}</p>
                        <p className="text-sm font-bold text-[#9a7654]">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[#8b5e34]">
                        <span className="rounded-full bg-[#fff4df] px-3 py-1 text-xs font-black uppercase tracking-[0.2em]">{review.rating}/5</span>
                        <span className="text-sm text-[#6d4c2f]">{review.comment || "No comment"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-[2rem] border border-[#ead7b8] bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7654]">Order details</p>
                <p className="mt-2 text-sm text-[#6d4c2f]">Choose your quantity and add this product to your cart.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#fffaf2] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7654]">Available packs</p>
                  <p className="mt-2 text-sm font-black text-[#5f432c]">{stock <= 0 ? "None" : `${stock} pack(s)`}</p>
                </div>
                <div className="rounded-2xl bg-[#fffaf2] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7654]">Reviews</p>
                  <p className="mt-2 text-sm font-black text-[#5f432c]">{product.review_count || 0}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[#d8be96] bg-[#fffaf2] p-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-[#8b5e34] hover:bg-white disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="min-w-[60px] text-center text-lg font-black text-[#5f432c]">{quantity}</span>
                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={quantity >= stock}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-[#8b5e34] hover:bg-white disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={stock <= 0}
                className={`mt-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-4 font-black transition ${
                  stock <= 0
                    ? "cursor-not-allowed bg-gray-200 text-gray-500"
                    : "bg-[#8b5e34] text-white hover:bg-[#714a28]"
                }`}
              >
                {stock <= 0 ? "Sold out" : "Add to cart"}
              </button>
            </div>

            <div className="rounded-[2rem] border border-[#ead7b8] bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7654]">Need help?</p>
              <p className="mt-3 text-sm leading-relaxed text-[#6d4c2f]">
                Send us a message if you have questions about shipping, stock, or product ingredients.
              </p>
              <Link
                to="/messages"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[#8b5e34] px-4 py-3 text-sm font-black text-white transition hover:bg-[#714a28]"
              >
                Contact support
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default ProductPage;
