const db = require("../config/db");
const logActivity = require("../utils/logActivity");
const queryAsync = require("../utils/queryAsync");
const { createNotification, notifyAdmin } = require("../utils/realtimeData");

const ORDER_TIMELINE_ACTIONS = [
  "Checkout completed",
  "Order status updated",
  "Cancellation requested",
  "Cancellation request reviewed",
];

const buildOrderTimelineMap = async (orderIds) => {
  if (!orderIds.length) {
    return {};
  }

  const logs = await queryAsync(
    `SELECT action, details, created_at
     FROM activity_logs
     WHERE action IN (${ORDER_TIMELINE_ACTIONS.map(() => "?").join(", ")})
     ORDER BY created_at ASC, id ASC`,
    ORDER_TIMELINE_ACTIONS
  );

  const orderIdSet = new Set(orderIds.map((id) => Number(id)));
  const timelineMap = {};

  logs.forEach((log) => {
    const matches = log.details?.match(/Order #(\d+)/i);
    if (!matches) {
      return;
    }

    const orderId = Number(matches[1]);
    if (!orderIdSet.has(orderId)) {
      return;
    }

    if (!timelineMap[orderId]) {
      timelineMap[orderId] = [];
    }

    let status = "pending";
    if (log.action === "Checkout completed") {
      status = "pending";
    } else if (log.action === "Cancellation requested") {
      status = "cancellation requested";
    } else {
      const statusMatch = log.details?.match(/\bto\s+(pending|confirmed|shipped|delivered|cancelled|approved|rejected)\b/i);
      if (statusMatch) {
        status = statusMatch[1].toLowerCase();
      }
    }

    timelineMap[orderId].push({
      action: log.action,
      status,
      details: log.details,
      created_at: log.created_at,
    });
  });

  return timelineMap;
};

const attachOrderTimelines = async (orders) => {
  const timelineMap = await buildOrderTimelineMap(orders.map((order) => order.id));

  return orders.map((order) => {
    const timeline = timelineMap[order.id] || [
      {
        action: "Checkout completed",
        status: order.status || "pending",
        details: `Order #${order.id} timeline unavailable`,
        created_at: order.created_at,
      },
    ];

    return {
      ...order,
      timeline,
    };
  });
};

const syncInventoryForStatusChange = async (orderId, currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) {
    return;
  }

  const items = await queryAsync(
    `SELECT product_id, quantity
     FROM order_items
     WHERE order_id = ?`,
    [orderId]
  );

  if (!items.length) {
    return;
  }

  if (currentStatus !== "cancelled" && nextStatus === "cancelled") {
    await Promise.all(
      items.map((item) =>
        queryAsync("UPDATE products SET stock = stock + ? WHERE id = ?", [
          item.quantity,
          item.product_id,
        ])
      )
    );
  }

  if (currentStatus === "cancelled" && nextStatus !== "cancelled") {
    const stocks = await Promise.all(
      items.map((item) =>
        queryAsync("SELECT id, name, stock FROM products WHERE id = ?", [item.product_id]).then(
          (rows) => ({ ...rows[0], requested: item.quantity })
        )
      )
    );

    const insufficient = stocks.find((product) => product.stock < product.requested);
    if (insufficient) {
      throw new Error(
        `Not enough stock to restore Order #${orderId}. ${insufficient.name} has only ${insufficient.stock} item(s) left.`
      );
    }

    await Promise.all(
      items.map((item) =>
        queryAsync(
          "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
          [item.quantity, item.product_id, item.quantity]
        )
      )
    );
  }
};

exports.checkout = (req, res) => {
  const userId = req.session.userId;
  const currentUser = req.session.user;
  const { address, phone } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!address || !phone) {
    return res.status(400).json({ message: "Address and phone are required" });
  }

  if (!/^(09|\+639)\d{9}$/.test(phone.trim())) {
    return res.status(400).json({ message: "Please enter a valid Philippine mobile number" });
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
        [userId, total, address.trim(), phone.trim(), "Cash on Delivery"],
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

                      const itemsText = cartItems
                        .map((item) => `${item.name} x${item.quantity}`)
                        .join(", ");

                      logActivity({
                        userId,
                        userName: currentUser?.name,
                        userEmail: currentUser?.email,
                        action: "Checkout completed",
                        details: `${currentUser?.name || "User"} placed Order #${orderId} with items: ${itemsText}`,
                      });

                      notifyAdmin({
                        type: "success",
                        title: "New order received",
                        message: `${currentUser?.name || "A customer"} placed Order #${orderId}.`,
                        link: "/admin-orders",
                      }).catch((notifyErr) => {
                        console.error("Admin order notification failed:", notifyErr);
                      });

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
    `SELECT
        o.id,
        o.total,
        o.status,
        o.created_at,
        cr.id AS cancellation_request_id,
        cr.status AS cancellation_status,
        cr.reason AS cancellation_reason,
        cr.admin_note AS cancellation_admin_note,
        cr.created_at AS cancellation_created_at,
        oi.quantity,
        p.name,
        oi.price
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN products p ON oi.product_id = p.id
     LEFT JOIN order_cancellation_requests cr ON cr.id = (
       SELECT id
       FROM order_cancellation_requests
       WHERE order_id = o.id
       ORDER BY created_at DESC, id DESC
       LIMIT 1
     )
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC, o.id DESC`,
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
            cancellation_request: row.cancellation_request_id
              ? {
                  id: row.cancellation_request_id,
                  status: row.cancellation_status,
                  reason: row.cancellation_reason,
                  admin_note: row.cancellation_admin_note,
                  created_at: row.cancellation_created_at,
                }
              : null,
            items: [],
          };
        }

        orders[row.id].items.push({
          product: row.name,
          quantity: row.quantity,
          price: row.price,
        });
      });

      attachOrderTimelines(Object.values(orders))
        .then((ordersWithTimeline) => {
          res.json({ orders: ordersWithTimeline });
        })
        .catch((timelineErr) => {
          console.error("Failed to attach user order timelines:", timelineErr);
          res.json({ orders: Object.values(orders) });
        });
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
        cr.id AS cancellation_request_id,
        cr.status AS cancellation_status,
        cr.reason AS cancellation_reason,
        cr.admin_note AS cancellation_admin_note,
        cr.created_at AS cancellation_created_at,
        o.created_at,
        p.name AS product_name,
        oi.quantity,
        oi.price
     FROM orders o
     JOIN users u ON o.user_id = u.id
     JOIN order_items oi ON o.id = oi.order_id
     JOIN products p ON oi.product_id = p.id
     LEFT JOIN order_cancellation_requests cr ON cr.id = (
       SELECT id
       FROM order_cancellation_requests
       WHERE order_id = o.id
       ORDER BY created_at DESC, id DESC
       LIMIT 1
     )
     ORDER BY o.created_at DESC, o.id DESC`,
    (err, results) => {
      if (err) {
        console.error("Failed to fetch all orders:", err);
        return res.status(500).json({ message: "Failed to fetch all orders" });
      }

      const groupedOrders = {};

      results.forEach((row) => {
        if (!groupedOrders[row.id]) {
          groupedOrders[row.id] = {
            id: row.id,
            user_id: row.user_id,
            customer_name: row.customer_name,
            customer_email: row.customer_email,
            total: row.total,
            status: row.status,
            address: row.address,
            phone: row.phone,
            payment_method: row.payment_method,
            created_at: row.created_at,
            cancellation_request: row.cancellation_request_id
              ? {
                  id: row.cancellation_request_id,
                  status: row.cancellation_status,
                  reason: row.cancellation_reason,
                  admin_note: row.cancellation_admin_note,
                  created_at: row.cancellation_created_at,
                }
              : null,
            items: [],
          };
        }

        groupedOrders[row.id].items.push({
          product_name: row.product_name,
          quantity: row.quantity,
          price: row.price,
        });
      });

      attachOrderTimelines(Object.values(groupedOrders))
        .then((ordersWithTimeline) => {
          res.json({ orders: ordersWithTimeline });
        })
        .catch((timelineErr) => {
          console.error("Failed to attach admin order timelines:", timelineErr);
          res.json({ orders: Object.values(groupedOrders) });
        });
    }
  );
};

exports.updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const currentUser = req.session.user;

  const allowedStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  queryAsync("SELECT id, user_id, status FROM orders WHERE id = ?", [id])
    .then(async (rows) => {
      if (!rows.length) {
        return res.status(404).json({ message: "Order not found" });
      }

      const currentStatus = rows[0].status;
      await syncInventoryForStatusChange(id, currentStatus, status);

      return queryAsync("UPDATE orders SET status = ? WHERE id = ?", [status, id]).then((result) => {
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Order not found" });
        }

        logActivity({
          userId: currentUser?.id,
          userName: currentUser?.name,
          userEmail: currentUser?.email,
          action: "Order status updated",
          details: `${currentUser?.name || "Admin"} updated Order #${id} to ${status}`,
        });

        createNotification({
          userId: rows[0].user_id,
          type: status === "cancelled" ? "warning" : "info",
          title: "Order status updated",
          message: `Order #${id} is now ${status}.`,
          link: "/profile",
        }).catch((notifyErr) => {
          console.error("Customer status notification failed:", notifyErr);
        });

        return res.json({ message: "Order status updated successfully" });
      });
    })
    .catch((err) => {
      console.error("Failed to update order status:", err);
      return res.status(500).json({ message: err.message || "Failed to update order status" });
    });
};

exports.requestCancellation = async (req, res) => {
  try {
    const userId = req.session.userId;
    const currentUser = req.session.user;
    const orderId = req.params.id;
    const reason = req.body.reason?.trim();

    if (!reason) {
      return res.status(400).json({ message: "Cancellation reason is required" });
    }

    const orders = await queryAsync("SELECT id, status FROM orders WHERE id = ? AND user_id = ?", [
      orderId,
      userId,
    ]);

    if (!orders.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (["shipped", "delivered", "cancelled"].includes(orders[0].status)) {
      return res.status(400).json({
        message: "This order can no longer be requested for cancellation",
      });
    }

    const existing = await queryAsync(
      "SELECT id FROM order_cancellation_requests WHERE order_id = ? AND status = 'pending' LIMIT 1",
      [orderId]
    );

    if (existing.length) {
      return res.status(400).json({ message: "A cancellation request is already pending" });
    }

    const result = await queryAsync(
      `INSERT INTO order_cancellation_requests (order_id, user_id, reason)
       VALUES (?, ?, ?)`,
      [orderId, userId, reason]
    );

    logActivity({
      userId,
      userName: currentUser?.name,
      userEmail: currentUser?.email,
      action: "Cancellation requested",
      details: `${currentUser?.name || "User"} requested cancellation for Order #${orderId}`,
    });

    await notifyAdmin({
      type: "warning",
      title: "Cancellation request",
      message: `${currentUser?.name || "A customer"} requested cancellation for Order #${orderId}.`,
      link: "/admin-orders",
    });

    res.status(201).json({
      message: "Cancellation request submitted",
      requestId: result.insertId,
    });
  } catch (err) {
    console.error("Failed to request cancellation:", err);
    res.status(500).json({ message: "Failed to request cancellation" });
  }
};

exports.reviewCancellationRequest = async (req, res) => {
  try {
    const currentUser = req.session.user;
    const requestId = req.params.requestId;
    const decision = req.body.decision;
    const adminNote = req.body.adminNote?.trim() || null;

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be approved or rejected" });
    }

    const requests = await queryAsync(
      `SELECT cr.id, cr.order_id, cr.user_id, cr.status AS request_status, o.status AS order_status
       FROM order_cancellation_requests cr
       JOIN orders o ON cr.order_id = o.id
       WHERE cr.id = ?`,
      [requestId]
    );

    if (!requests.length) {
      return res.status(404).json({ message: "Cancellation request not found" });
    }

    const request = requests[0];
    if (request.request_status !== "pending") {
      return res.status(400).json({ message: "Cancellation request is already reviewed" });
    }

    if (decision === "approved") {
      await syncInventoryForStatusChange(request.order_id, request.order_status, "cancelled");
      await queryAsync("UPDATE orders SET status = 'cancelled' WHERE id = ?", [request.order_id]);
    }

    await queryAsync(
      `UPDATE order_cancellation_requests
       SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [decision, adminNote, currentUser?.id || null, requestId]
    );

    logActivity({
      userId: currentUser?.id,
      userName: currentUser?.name,
      userEmail: currentUser?.email,
      action: "Cancellation request reviewed",
      details: `${currentUser?.name || "Admin"} updated cancellation request for Order #${request.order_id} to ${decision}`,
    });

    await createNotification({
      userId: request.user_id,
      type: decision === "approved" ? "success" : "warning",
      title: "Cancellation request reviewed",
      message:
        decision === "approved"
          ? `Your cancellation request for Order #${request.order_id} was approved.`
          : `Your cancellation request for Order #${request.order_id} was rejected.`,
      link: "/profile",
    });

    res.json({ message: "Cancellation request reviewed" });
  } catch (err) {
    console.error("Failed to review cancellation request:", err);
    res.status(500).json({ message: err.message || "Failed to review cancellation request" });
  }
};
