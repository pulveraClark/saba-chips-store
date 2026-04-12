const db = require("../config/db");
const logActivity = require("../utils/logActivity");

exports.addToCart = (req, res) => {
  const userId = req.session.userId;
  const currentUser = req.session.user;
  const { productId, quantity = 1 } = req.body;

  db.query(
    "SELECT * FROM products WHERE id = ?",
    [productId],
    (productErr, productRows) => {
      if (productErr) {
        console.error("Product fetch failed:", productErr);
        return res.status(500).json({ message: "Add to cart failed" });
      }

      if (productRows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      const product = productRows[0];

      if (product.stock <= 0) {
        return res.status(400).json({ message: "Product is out of stock" });
      }

      db.query(
        "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
        [userId, productId],
        (cartErr, cartRows) => {
          if (cartErr) {
            console.error("Cart fetch failed:", cartErr);
            return res.status(500).json({ message: "Add to cart failed" });
          }

          const currentQty = cartRows.length > 0 ? cartRows[0].quantity : 0;
          const newQty = currentQty + Number(quantity);

          if (newQty > product.stock) {
            return res.status(400).json({
              message: `Only ${product.stock} item(s) available in stock`,
            });
          }

          db.query(
            `INSERT INTO cart_items (user_id, product_id, quantity)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
            [userId, productId, quantity, quantity],
            (err) => {
              if (err) {
                console.error("Add to cart failed:", err);
                return res.status(500).json({ message: "Add to cart failed" });
              }

              logActivity({
                userId,
                userName: currentUser?.name,
                userEmail: currentUser?.email,
                action: "Added to cart",
                details: `${currentUser?.name || "User"} added ${product.name} x${quantity} to cart`,
              });

              res.json({ message: "Added to cart successfully" });
            }
          );
        }
      );
    }
  );
};

exports.getCart = (req, res) => {
  const userId = req.session.userId;

  db.query(
    `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.description, p.image, p.stock
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.user_id = ?`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Failed to fetch cart:", err);
        return res.status(500).json({ message: "Failed to fetch cart" });
      }
      res.json({ cart: results });
    }
  );
};

exports.updateCartItem = (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const userId = req.session.userId;

  if (Number(quantity) < 1) {
    return res.status(400).json({ message: "Quantity must be at least 1" });
  }

  db.query(
    `SELECT ci.id, p.stock
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.id = ? AND ci.user_id = ?`,
    [id, userId],
    (checkErr, rows) => {
      if (checkErr) {
        console.error("Stock check failed:", checkErr);
        return res.status(400).json({ message: "Update failed" });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      const productStock = rows[0].stock;

      if (Number(quantity) > productStock) {
        return res.status(400).json({
          message: `Only ${productStock} item(s) available in stock`,
        });
      }

      db.query(
        "UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?",
        [quantity, id, userId],
        (err, result) => {
          if (err) {
            console.error("Update cart failed:", err);
            return res.status(400).json({ message: "Update failed" });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cart item not found" });
          }

          res.json({ message: "Cart updated" });
        }
      );
    }
  );
};

exports.removeCartItem = (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  db.query(
    "DELETE FROM cart_items WHERE id = ? AND user_id = ?",
    [id, userId],
    (err, result) => {
      if (err) {
        console.error("Remove cart item failed:", err);
        return res.status(400).json({ message: "Remove failed" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json({ message: "Item removed" });
    }
  );
};

exports.clearCart = (req, res) => {
  const userId = req.session.userId;

  db.query("DELETE FROM cart_items WHERE user_id = ?", [userId], (err) => {
    if (err) {
      console.error("Clear cart failed:", err);
      return res.status(500).json({ message: "Clear failed" });
    }
    res.json({ message: "Cart cleared" });
  });
};