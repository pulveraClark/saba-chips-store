const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const logActivity = require("../utils/logActivity");
const queryAsync = require("../utils/queryAsync");
const notifyLowStockProducts = require("../utils/stockAlerts");
const getTopSellingProducts = require("../utils/topSellingProducts");

exports.getAllProducts = async (req, res) => {
  try {
    const userId = req.session?.userId || null;
    const products = await queryAsync(
      `SELECT
         p.*,
         COALESCE(AVG(pr.rating), 0) AS average_rating,
         COUNT(pr.id) AS review_count,
         ${userId ? "MAX(CASE WHEN w.id IS NULL THEN 0 ELSE 1 END)" : "0"} AS is_wishlisted
       FROM products p
       LEFT JOIN product_reviews pr ON pr.product_id = p.id
       ${userId ? "LEFT JOIN wishlists w ON w.product_id = p.id AND w.user_id = ?" : ""}
       GROUP BY p.id
       ORDER BY p.created_at DESC, p.id DESC`,
      userId ? [userId] : []
    );

    res.json({
      products: products.map((product) => ({
        ...product,
        average_rating: Number(product.average_rating || 0),
        review_count: Number(product.review_count || 0),
        is_wishlisted: Boolean(product.is_wishlisted),
      })),
    });
  } catch (err) {
    console.error("Failed to fetch products:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

exports.getTopSellingProducts = async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const products = await getTopSellingProducts(limit);

    res.json({
      products: products.map((product) => ({
        ...product,
        total_quantity: Number(product.total_quantity || 0),
      })),
    });
  } catch (err) {
    console.error("Failed to fetch top selling products:", err);
    res.status(500).json({ message: "Failed to fetch top selling products" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const userId = req.session?.userId || null;
    const query = `SELECT
         p.*,
         COALESCE(AVG(pr.rating), 0) AS average_rating,
         COUNT(pr.id) AS review_count,
         ${userId ? "MAX(CASE WHEN w.id IS NULL THEN 0 ELSE 1 END)" : "0"} AS is_wishlisted
       FROM products p
       LEFT JOIN product_reviews pr ON pr.product_id = p.id
       ${userId ? "LEFT JOIN wishlists w ON w.product_id = p.id AND w.user_id = ?" : ""}
       WHERE p.id = ?
       GROUP BY p.id`;

    const params = userId ? [userId, req.params.id] : [req.params.id];
    const rows = await queryAsync(query, params);

    if (!rows.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = rows[0];
    res.json({
      product: {
        ...product,
        average_rating: Number(product.average_rating || 0),
        review_count: Number(product.review_count || 0),
        is_wishlisted: Boolean(product.is_wishlisted),
      },
    });
  } catch (err) {
    console.error("Failed to fetch product details:", err);
    res.status(500).json({ message: "Failed to fetch product details" });
  }
};

exports.createProduct = (req, res) => {
  const { name, price, description, stock, category = "classic" } = req.body;
  const image = req.file?.storageUrl || null;
  const currentUser = req.session.user;

  if (!name || !price) {
    return res.status(400).json({ message: "Name and price required" });
  }

  db.query(
    "INSERT INTO products (name, price, description, image, stock, category) VALUES (?, ?, ?, ?, ?, ?)",
    [name, price, description, image, stock || 999, category],
    (err, result) => {
      if (err) {
        console.error("Create product failed:", err);
        return res.status(500).json({ message: "Create failed" });
      }

      logActivity({
        userId: currentUser?.id,
        userName: currentUser?.name,
        userEmail: currentUser?.email,
        action: "Product created",
        details: `${currentUser?.name || "Admin"} created product: ${name}`,
      });

      notifyLowStockProducts([result.insertId]).catch((alertErr) => {
        console.error("Low stock notification failed:", alertErr);
      });

      res.status(201).json({
        message: "Product created",
        product: {
          id: result.insertId,
          name,
          price,
          description,
          image,
          stock,
          category,
        },
      });
    }
  );
};

exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const {
    name,
    price,
    description,
    stock,
    category = "classic",
    image: existingImage,
  } = req.body;
  const currentUser = req.session.user;

  db.query("SELECT * FROM products WHERE id = ?", [id], (selectErr, rows) => {
    if (selectErr) {
      console.error("Fetch old product failed:", selectErr);
      return res.status(500).json({ message: "Update failed" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const oldProduct = rows[0];
    let imagePath = existingImage || oldProduct.image;

    if (req.file) {
      imagePath = req.file.storageUrl;
    }

    db.query(
      "UPDATE products SET name=?, price=?, description=?, image=?, stock=?, category=? WHERE id=?",
      [name, price, description, imagePath, stock, category, id],
      (err, result) => {
        if (err) {
          console.error("Update product failed:", err);
          return res.status(500).json({ message: "Update failed" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Product not found" });
        }

        if (
          req.file &&
          oldProduct.image &&
          oldProduct.image !== imagePath &&
          oldProduct.image.startsWith("/uploads/")
        ) {
          const oldImageFullPath = path.join(__dirname, "..", oldProduct.image);

          fs.unlink(oldImageFullPath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Failed to delete old image:", unlinkErr.message);
            }
          });
        }

        logActivity({
          userId: currentUser?.id,
          userName: currentUser?.name,
          userEmail: currentUser?.email,
          action: "Product updated",
          details: `${currentUser?.name || "Admin"} updated product: ${name}`,
        });

        notifyLowStockProducts([id]).catch((alertErr) => {
          console.error("Low stock notification failed:", alertErr);
        });

        res.json({
          message: "Product updated",
          product: {
            id,
            name,
            price,
            description,
            image: imagePath,
            stock,
            category,
          },
        });
      }
    );
  });
};

exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  const currentUser = req.session.user;

  db.query("SELECT * FROM products WHERE id = ?", [id], (selectErr, rows) => {
    if (selectErr) {
      console.error("Fetch product before delete failed:", selectErr);
      return res.status(500).json({ message: "Delete failed" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = rows[0];

    db.query("DELETE FROM products WHERE id=?", [id], (err, result) => {
      if (err) {
        console.error("Delete product failed:", err);
        return res.status(500).json({ message: "Delete failed" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.image && product.image.startsWith("/uploads/")) {
        const imageFullPath = path.join(__dirname, "..", product.image);

        fs.unlink(imageFullPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Failed to delete image file:", unlinkErr.message);
          }
        });
      }

      logActivity({
        userId: currentUser?.id,
        userName: currentUser?.name,
        userEmail: currentUser?.email,
        action: "Product deleted",
        details: `${currentUser?.name || "Admin"} deleted product: ${product.name}`,
      });

      res.json({ message: "Product deleted successfully" });
    });
  });
};

exports.restockProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const quantity = Number(req.body.quantity);
    const currentUser = req.session.user;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Restock quantity must be a positive number" });
    }

    const result = await queryAsync(
      "UPDATE products SET stock = stock + ? WHERE id = ?",
      [quantity, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const products = await queryAsync("SELECT name, stock FROM products WHERE id = ?", [id]);

    logActivity({
      userId: currentUser?.id,
      userName: currentUser?.name,
      userEmail: currentUser?.email,
      action: "Product restocked",
      details: `${currentUser?.name || "Admin"} added ${quantity} stock to ${products[0]?.name || `Product #${id}`}`,
    });

    res.json({
      message: "Product restocked",
      product: products[0],
    });
  } catch (err) {
    console.error("Restock product failed:", err);
    res.status(500).json({ message: "Restock failed" });
  }
};
