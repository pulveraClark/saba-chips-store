const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// GET ALL
exports.getAllProducts = (req, res) => {
  db.query(
    "SELECT * FROM products ORDER BY created_at DESC",
    (err, results) => {
      if (err) {
        console.error("Failed to fetch products:", err);
        return res.status(500).json({ message: "Failed to fetch products" });
      }
      res.json({ products: results });
    }
  );
};

// CREATE
exports.createProduct = (req, res) => {
  const { name, price, description, stock } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !price) {
    return res.status(400).json({ message: "Name and price required" });
  }

  db.query(
    "INSERT INTO products (name, price, description, image, stock) VALUES (?, ?, ?, ?, ?)",
    [name, price, description, image, stock || 999],
    (err, result) => {
      if (err) {
        console.error("Create product failed:", err);
        return res.status(500).json({ message: "Create failed" });
      }

      res.status(201).json({
        message: "Product created",
        product: {
          id: result.insertId,
          name,
          price,
          description,
          image,
          stock,
        },
      });
    }
  );
};

// UPDATE
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, price, description, stock, image: existingImage } = req.body;

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
      imagePath = `/uploads/${req.file.filename}`;
    }

    db.query(
      "UPDATE products SET name=?, price=?, description=?, image=?, stock=? WHERE id=?",
      [name, price, description, imagePath, stock, id],
      (err, result) => {
        if (err) {
          console.error("Update product failed:", err);
          return res.status(500).json({ message: "Update failed" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Product not found" });
        }

        // delete old image if new image was uploaded
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

        res.json({
          message: "Product updated",
          product: {
            id,
            name,
            price,
            description,
            image: imagePath,
            stock,
          },
        });
      }
    );
  });
};

// DELETE
exports.deleteProduct = (req, res) => {
  const { id } = req.params;

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

      res.json({ message: "Product deleted successfully" });
    });
  });
};