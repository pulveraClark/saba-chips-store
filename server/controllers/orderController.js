const db = require("../config/db");

exports.checkout = (req, res) => {
  const userId = req.session.userId;
  const { address, phone, paymentMethod } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!address || !phone) {
    return res.status(400).json({ message: "Address and phone are required" });
  }

  db.query(
    `SELECT 
        ci.id,
        ci.product_id,
        ci.quantity,
        p.name,
        p.price,
        p.stock
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.user_id = ?`,
    [userId],
    (err, cartItems) => {
      if (err) {
        console.error("Cart fetch failed:", err);
        return res.status(500).json({ message: "Failed to load cart" });
      }

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Cart empty" });
      }

      // Check stock before checkout
      const insufficientStockItem = cartItems.find(
        (item) => item.quantity > item.stock
      );

      if (insufficientStockItem) {
        return res.status(400).json({
          message: `Not enough stock for ${insufficientStockItem.name}. Available stock: ${insufficientStockItem.stock}`,
        });
      }

      const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      db.query(
        `INSERT INTO orders (user_id, total, address, phone, payment_method)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, total, address, phone, paymentMethod || "Cash on Delivery"],
        (err, orderResult) => {
          if (err) {
            console.error("Order insert failed:", err);
            return res.status(500).json({ message: "Checkout failed" });
          }

          const orderId = orderResult.insertId;
          const orderItems = cartItems.map((item) => [
            orderId,
            item.product_id,
            item.quantity,
            item.price,
          ]);

          db.query(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
            [orderItems],
            (err) => {
              if (err) {
                console.error("Order items insert failed:", err);
                return res.status(500).json({ message: "Order items failed" });
              }

              // Deduct stock for each purchased item
              const stockUpdates = cartItems.map(
                (item) =>
                  new Promise((resolve, reject) => {
                    db.query(
                      "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
                      [item.quantity, item.product_id, item.quantity],
                      (stockErr, result) => {
                        if (stockErr) {
                          return reject(stockErr);
                        }
                        if (result.affectedRows === 0) {
                          return reject(
                            new Error(`Stock update failed for product ${item.product_id}`)
                          );
                        }
                        resolve();
                      }
                    );
                  })
              );

              Promise.all(stockUpdates)
                .then(() => {
                  db.query(
                    "DELETE FROM cart_items WHERE user_id = ?",
                    [userId],
                    (deleteErr) => {
                      if (deleteErr) {
                        console.error("Cart clear failed:", deleteErr);
                      }

                      res.json({
                        message: "Order placed successfully!",
                        orderId,
                        total,
                      });
                    }
                  );
                })
                .catch((stockUpdateErr) => {
                  console.error("Stock deduction failed:", stockUpdateErr);
                  return res.status(500).json({
                    message: "Order placed but stock update failed",
                  });
                });
            }
          );
        }
      );
    }
  );
};

exports.getUserOrders = (req, res) => {
  const userId = req.session.userId;

  db.query(
    `SELECT o.id, o.total, o.status, o.created_at, oi.quantity, p.name, oi.price
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN products p ON oi.product_id = p.id
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Failed to fetch orders:", err);
        return res.status(500).json({ message: "Failed to fetch orders" });
      }

      const orders = {};

      results.forEach((row) => {
        if (!orders[row.id]) {
          orders[row.id] = {
            id: row.id,
            total: row.total,
            status: row.status,
            created_at: row.created_at,
            items: [],
          };
        }

        orders[row.id].items.push({
          product: row.name,
          quantity: row.quantity,
          price: row.price,
        });
      });

      res.json({ orders: Object.values(orders) });
    }
  );
};

exports.getAllOrders = (req, res) => {
  db.query(
    `SELECT 
        o.id,
        o.user_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.total,
        o.status,
        o.address,
        o.phone,
        o.payment_method,
        o.created_at
     FROM orders o
     JOIN users u ON o.user_id = u.id
     ORDER BY o.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error("Failed to fetch all orders:", err);
        return res.status(500).json({ message: "Failed to fetch all orders" });
      }

      res.json({ orders: results });
    }
  );
};

exports.updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["pending", "confirmed", "shipped", "delivered"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) {
        console.error("Failed to update order status:", err);
        return res.status(500).json({ message: "Failed to update order status" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ message: "Order status updated successfully" });
    }
  );
};