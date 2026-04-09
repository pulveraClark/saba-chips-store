import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "../assets/services/productService.js";
import { useProducts } from "../context/ProductContext.jsx";

function AdminProducts() {
  const { products, refreshProducts } = useProducts();
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

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

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      await refreshProducts();
    } catch (err) {
      alert("Failed to fetch products");
    } finally {
      setLoading(false);
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
      alert("Product updated!");
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
      alert(err?.response?.data?.message || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this product?")) {
      try {
        await deleteProduct(id);
        alert("Product deleted!");
        await refreshProducts();
      } catch (err) {
        alert(err?.response?.data?.message || "Delete failed");
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
      alert("Product created!");
      setNewProduct({
        name: "",
        price: "",
        description: "",
        image: null,
        stock: "",
      });
      await refreshProducts();
    } catch (err) {
      alert(err?.response?.data?.message || "Create failed");
    }
  };

  if (loading) {
    return <div className="p-12 text-center">Loading products...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <Link
            to="/admin"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            ← Back to Users
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 text-center">
            Product Management
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Add New Product</h2>

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
                setNewProduct({
                  ...newProduct,
                  description: e.target.value,
                })
              }
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  image: e.target.files[0],
                })
              }
            />

            <button
              onClick={handleCreate}
              className="btn-primary col-span-full py-4 text-lg"
            >
              + Add Product
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-bold">
              📦 Products ({products.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b align-top ${
                      product.stock <= 0
                        ? "bg-red-50"
                        : product.stock <= 5
                        ? "bg-yellow-50"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4">{product.id}</td>

                    <td className="px-6 py-4">
                      {editingId === product.id ? (
                        <div className="space-y-2">
                          {editForm.existingImage && (
                            <img
                              src={`http://localhost:5000${editForm.existingImage}`}
                              alt={editForm.name}
                              className="w-16 h-16 object-cover rounded-lg border"
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
                          src={`http://localhost:5000${product.image}`}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingId === product.id ? (
                        <input
                          className="input-field"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              name: e.target.value,
                            })
                          }
                        />
                      ) : (
                        product.name
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingId === product.id ? (
                        <input
                          className="input-field"
                          type="number"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price: e.target.value,
                            })
                          }
                        />
                      ) : (
                        `₱${product.price}`
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingId === product.id ? (
                        <input
                          className="input-field"
                          type="number"
                          value={editForm.stock}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              stock: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <span
                          className={`font-semibold px-3 py-1 rounded-full text-sm ${
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

                    <td className="px-6 py-4 max-w-xs">
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
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {product.description || "No description"}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {editingId === product.id ? (
                        <div className="flex flex-col gap-2">
                          <button onClick={handleUpdate} className="btn-primary">
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
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded"
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
        </div>
      </div>
    </div>
  );
}

export default AdminProducts;