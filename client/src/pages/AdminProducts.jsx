import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "../assets/services/productService.js";
import { useNotification } from "../context/NotificationContext.jsx";
import { useProducts } from "../context/ProductContext.jsx";
import { sortByNewest } from "../utils/sortByNewest.js";
import { getMediaUrl } from "../utils/media.js";

function AdminProducts() {
  const { products, refreshProducts } = useProducts();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const { notify } = useNotification();

  const PRODUCTS_PER_PAGE = 5;

  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    description: "",
    image: null,
    stock: "",
    existingImage: "",
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    image: null,
    stock: "",
  });

  // Products are loaded on mount; subsequent refreshes are manual after mutations.
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      await refreshProducts();
    } catch {
      notify({
        type: "error",
        title: "Load Failed",
        message: "Failed to fetch products.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name || "",
      price: product.price || "",
      description: product.description || "",
      image: null,
      stock: product.stock || "",
      existingImage: product.image || "",
    });
  };

  const handleUpdate = async () => {
    const formData = new FormData();

    formData.append("name", editForm.name);
    formData.append("price", editForm.price);
    formData.append("description", editForm.description);
    formData.append("stock", editForm.stock);

    if (editForm.image instanceof File) {
      formData.append("image", editForm.image);
    } else {
      formData.append("image", editForm.existingImage);
    }

    try {
      await updateProduct(editingId, formData);
      notify({
        type: "success",
        title: "Product Updated",
        message: `${editForm.name} was updated successfully.`,
      });
      setEditingId(null);
      setEditForm({
        name: "",
        price: "",
        description: "",
        image: null,
        stock: "",
        existingImage: "",
      });
      await refreshProducts();
    } catch (err) {
      notify({
        type: "error",
        title: "Update Failed",
        message: err?.response?.data?.message || "Update failed",
      });
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this product?")) {
      try {
        await deleteProduct(id);
        notify({
          type: "success",
          title: "Product Deleted",
          message: "The product was removed successfully.",
        });
        await refreshProducts();
      } catch (err) {
        notify({
          type: "error",
          title: "Delete Failed",
          message: err?.response?.data?.message || "Delete failed",
        });
      }
    }
  };

  const handleCreate = async () => {
    const formData = new FormData();

    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);
    formData.append("description", newProduct.description);
    formData.append("stock", newProduct.stock);

    if (newProduct.image instanceof File) {
      formData.append("image", newProduct.image);
    }

    try {
      await createProduct(formData);
      notify({
        type: "success",
        title: "Product Created",
        message: `${newProduct.name} was added successfully.`,
      });
      setNewProduct({
        name: "",
        price: "",
        description: "",
        image: null,
        stock: "",
      });
      await refreshProducts();
    } catch (err) {
      notify({
        type: "error",
        title: "Create Failed",
        message: err?.response?.data?.message || "Create failed",
      });
    }
  };

  const sortedProducts = sortByNewest(products);
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = sortedProducts.slice(
    (page - 1) * PRODUCTS_PER_PAGE,
    page * PRODUCTS_PER_PAGE
  );

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
    <div className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] rounded-[2rem] p-8 text-white shadow-xl mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                to="/admin"
                className="inline-block text-[#fff1df] hover:text-white mb-4"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl md:text-5xl font-black mb-3">
                Product Management
              </h1>
              <p className="text-[#fff1df] text-lg max-w-2xl">
                Add, update, and manage your store products, stock, images, and descriptions.
              </p>
            </div>

            <button
              onClick={() => loadProducts(true)}
              disabled={refreshing}
              className="px-4 py-3 rounded-2xl bg-white text-[#8b5e34] font-bold hover:bg-[#f8f2e8] disabled:opacity-60"
            >
              {refreshing ? "↻..." : "↻"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#ead7b8] mb-8">
          <h2 className="text-2xl font-black text-[#8b5e34] mb-6">
            Add New Product
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <input
              className="input-field"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />

            <input
              className="input-field"
              type="number"
              placeholder="Price (₱)"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
            />

            <input
              className="input-field"
              type="number"
              placeholder="Stock"
              value={newProduct.stock}
              onChange={(e) =>
                setNewProduct({ ...newProduct, stock: e.target.value })
              }
            />

            <textarea
              className="input-field md:col-span-2"
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
            />

            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-[#6d4c2f]"
              onChange={(e) =>
                setNewProduct({ ...newProduct, image: e.target.files[0] })
              }
            />

            <button
              onClick={handleCreate}
              className="bg-[#8b5e34] text-white py-4 rounded-2xl font-semibold hover:bg-[#714a28] transition col-span-full"
            >
              + Add Product
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#ead7b8]">
          <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] p-6 text-white">
            <h2 className="text-3xl font-black">🛍️ Products</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fff7eb]">
                <tr>
                  <th className="px-6 py-4 text-left text-[#8b5e34] font-bold">ID</th>
                  <th className="px-6 py-4 text-left text-[#8b5e34] font-bold">Image</th>
                  <th className="px-6 py-4 text-left text-[#8b5e34] font-bold">Name</th>
                  <th className="px-6 py-4 text-left text-[#8b5e34] font-bold">Price</th>
                  <th className="px-6 py-4 text-left text-[#8b5e34] font-bold">Stock</th>
                  <th className="px-6 py-4 text-left text-[#8b5e34] font-bold">Description</th>
                  <th className="px-6 py-4 text-center text-[#8b5e34] font-bold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-t border-[#f1e3ca] align-top ${
                      product.stock <= 0
                        ? "bg-red-50"
                        : product.stock <= 5
                        ? "bg-yellow-50"
                        : "hover:bg-[#fffaf2]"
                    }`}
                  >
                    <td className="px-6 py-5">{product.id}</td>

                    <td className="px-6 py-5">
                      {editingId === product.id ? (
                        <div className="space-y-2">
                          {editForm.existingImage && (
                            <img
                              src={getMediaUrl(editForm.existingImage)}
                              alt={editForm.name}
                              className="w-16 h-16 object-cover rounded-xl border border-[#ead7b8]"
                            />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                image: e.target.files[0],
                              })
                            }
                          />
                        </div>
                      ) : product.image ? (
                        <img
                          src={getMediaUrl(product.image)}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-xl border border-[#ead7b8]"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-[#f8f2e8] rounded-xl flex items-center justify-center text-[#8b5e34]">
                          📦
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {editingId === product.id ? (
                        <input
                          className="input-field"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                        />
                      ) : (
                        <span className="font-semibold text-gray-900">
                          {product.name}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {editingId === product.id ? (
                        <input
                          className="input-field"
                          type="number"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({ ...editForm, price: e.target.value })
                          }
                        />
                      ) : (
                        <span className="font-semibold text-[#8b5e34]">
                          ₱{product.price}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {editingId === product.id ? (
                        <input
                          className="input-field"
                          type="number"
                          value={editForm.stock}
                          onChange={(e) =>
                            setEditForm({ ...editForm, stock: e.target.value })
                          }
                        />
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            product.stock <= 0
                              ? "bg-red-100 text-red-700"
                              : product.stock <= 5
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {product.stock <= 0
                            ? "Out of stock"
                            : product.stock <= 5
                            ? `Low: ${product.stock}`
                            : product.stock}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5 max-w-xs">
                      {editingId === product.id ? (
                        <textarea
                          className="input-field"
                          rows="3"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <p className="text-sm text-[#6d4c2f] whitespace-pre-wrap">
                          {product.description || "No description"}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-5 text-center">
                      {editingId === product.id ? (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={handleUpdate}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditForm({
                                name: "",
                                price: "",
                                description: "",
                                image: null,
                                stock: "",
                                existingImage: "",
                              });
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-600 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="bg-[#8b5e34] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#714a28] transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#f1e3ca] bg-[#fffaf2]">
            <p className="text-[#6d4c2f] font-medium">
              Page {page} of {totalPages} • {products.length} total products
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-5 py-2 rounded-xl bg-[#8b5e34] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>

              <button
                onClick={() =>
                  setPage((prev) => (prev < totalPages ? prev + 1 : prev))
                }
                disabled={page >= totalPages}
                className="px-5 py-2 rounded-xl bg-[#8b5e34] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProducts;
