const db = require("../config/db");
const getTopSellingProducts = require("../utils/topSellingProducts");

exports.getAllUsers = (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;
  const search = req.query.search || "";
  const offset = (page - 1) * limit;

  const whereClause = search ? "WHERE name LIKE ? OR email LIKE ?" : "";
  const queryParams = search ? [`%${search}%`, `%${search}%`] : [];

  db.query(
    `SELECT COUNT(*) AS total FROM users ${whereClause}`,
    queryParams,
    (countErr, countResult) => {
      if (countErr) {
        return res.status(500).json({ message: "Server error" });
      }

      const total = countResult[0].total;

      db.query(
        `SELECT id, name, email, created_at
         FROM users
         ${whereClause}
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset],
        (err, results) => {
          if (err) {
            return res.status(500).json({ message: "Server error" });
          }

          res.json({
            users: results,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            },
          });
        }
      );
    }
  );
};

exports.getActivityLogs = (req, res) => {
  db.query(
    `SELECT id, user_id, user_name, user_email, action, details, created_at
     FROM activity_logs
     ORDER BY created_at DESC, id DESC
     LIMIT 30`,
    (err, results) => {
      if (err) {
        console.error("Failed to fetch activity logs:", err);
        return res.status(500).json({ message: "Failed to fetch activity logs" });
      }

      res.json({ logs: results });
    }
  );
};

exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  db.query(
    "UPDATE users SET name = ?, email = ? WHERE id = ?",
    [name, email, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Update failed" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User updated successfully" });
    }
  );
};

exports.deleteUser = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Delete failed" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  });
};

exports.getAdminSummary = (req, res) => {
  const summary = {};

  db.query("SELECT COUNT(*) AS totalUsers FROM users", (err, usersResult) => {
    if (err) return res.status(500).json({ message: "Failed to fetch summary" });
    summary.totalUsers = usersResult[0].totalUsers;

    db.query("SELECT COUNT(*) AS totalProducts FROM products", (err, productsResult) => {
      if (err) return res.status(500).json({ message: "Failed to fetch summary" });
      summary.totalProducts = productsResult[0].totalProducts;

      db.query("SELECT COUNT(*) AS totalOrders FROM orders", (err, ordersResult) => {
        if (err) return res.status(500).json({ message: "Failed to fetch summary" });
        summary.totalOrders = ordersResult[0].totalOrders;

        db.query(
          "SELECT COALESCE(SUM(total), 0) AS totalSales FROM orders WHERE status = 'delivered'",
          (err, salesResult) => {
            if (err) return res.status(500).json({ message: "Failed to fetch summary" });
            summary.totalSales = Number(salesResult[0].totalSales || 0);

            db.query(
              `SELECT 
                  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingOrders,
                  SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmedOrders,
                  SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shippedOrders,
                  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS deliveredOrders,
                  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledOrders
               FROM orders`,
              (err, statusResult) => {
                if (err) return res.status(500).json({ message: "Failed to fetch summary" });

                summary.pendingOrders = Number(statusResult[0].pendingOrders || 0);
                summary.confirmedOrders = Number(statusResult[0].confirmedOrders || 0);
                summary.shippedOrders = Number(statusResult[0].shippedOrders || 0);
                summary.deliveredOrders = Number(statusResult[0].deliveredOrders || 0);
                summary.cancelledOrders = Number(statusResult[0].cancelledOrders || 0);

                db.query(
                  "SELECT COUNT(*) AS lowStockProducts FROM products WHERE stock > 0 AND stock <= 5",
                  (err, lowStockResult) => {
                    if (err) return res.status(500).json({ message: "Failed to fetch summary" });
                    summary.lowStockProducts = lowStockResult[0].lowStockProducts;

                    db.query(
                      "SELECT COUNT(*) AS outOfStockProducts FROM products WHERE stock <= 0",
                      (err, outStockResult) => {
                        if (err) return res.status(500).json({ message: "Failed to fetch summary" });
                        summary.outOfStockProducts = outStockResult[0].outOfStockProducts;

                        db.query(
                          "SELECT COALESCE(SUM(stock), 0) AS totalStockUnits FROM products",
                          (err, stockUnitsResult) => {
                            if (err) return res.status(500).json({ message: "Failed to fetch summary" });

                            summary.totalStockUnits = Number(stockUnitsResult[0].totalStockUnits || 0);

                            db.query(
                              "SELECT COALESCE(AVG(total), 0) AS averageOrderValue FROM orders WHERE status = 'delivered'",
                              (err, aovResult) => {
                                if (err) return res.status(500).json({ message: "Failed to fetch summary" });

                                summary.averageOrderValue = Number(aovResult[0].averageOrderValue || 0);

                                db.query(
                                  `SELECT COUNT(*) AS repeatCustomers
                                   FROM (
                                     SELECT user_id
                                     FROM orders
                                     GROUP BY user_id
                                     HAVING COUNT(*) > 1
                                   ) AS repeated`,
                                  (err, repeatResult) => {
                                    if (err) return res.status(500).json({ message: "Failed to fetch summary" });

                                    summary.repeatCustomers = Number(repeatResult[0].repeatCustomers || 0);

                                    db.query(
                                      `SELECT COUNT(*) AS customersWithOrders
                                       FROM (
                                         SELECT DISTINCT user_id
                                         FROM orders
                                       ) AS order_customers`,
                                      (err, customersWithOrdersResult) => {
                                        if (err) return res.status(500).json({ message: "Failed to fetch summary" });

                                        const customersWithOrders = Number(customersWithOrdersResult[0].customersWithOrders || 0);
                                        summary.newCustomers = Math.max(customersWithOrders - summary.repeatCustomers, 0);
                                        summary.returningCustomers = summary.repeatCustomers;
                                        summary.repeatPurchaseRate =
                                          customersWithOrders > 0
                                            ? Number(((summary.repeatCustomers / customersWithOrders) * 100).toFixed(2))
                                            : 0;

                                        res.json(summary);
                                      }
                                    );
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
  });
};

exports.getTransactionHistory = (req, res) => {
  db.query(
    `SELECT 
        o.id AS order_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.total,
        o.status,
        o.address,
        o.phone,
        o.payment_method,
        o.created_at,
        p.name AS product_name,
        oi.quantity,
        oi.price
     FROM orders o
     JOIN users u ON o.user_id = u.id
     JOIN order_items oi ON o.id = oi.order_id
     JOIN products p ON oi.product_id = p.id
     ORDER BY o.created_at DESC, o.id DESC`,
    (err, results) => {
      if (err) {
        console.error("Transaction history error:", err);
        return res.status(500).json({ message: "Failed to fetch transactions" });
      }

      const groupedTransactions = {};

      results.forEach((row) => {
        if (!groupedTransactions[row.order_id]) {
          groupedTransactions[row.order_id] = {
            id: row.order_id,
            customer_name: row.customer_name,
            customer_email: row.customer_email,
            total: row.total,
            status: row.status,
            address: row.address,
            phone: row.phone,
            payment_method: row.payment_method,
            created_at: row.created_at,
            items: [],
          };
        }

        groupedTransactions[row.order_id].items.push({
          product_name: row.product_name,
          quantity: row.quantity,
          price: row.price,
        });
      });

      res.json({ transactions: Object.values(groupedTransactions) });
    }
  );
};

exports.getSalesChartData = (req, res) => {
  db.query(
    `SELECT 
        DATE(created_at) AS order_date,
        COUNT(*) AS total_orders,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) AS total_sales
     FROM orders
     GROUP BY DATE(created_at)
     ORDER BY order_date ASC`,
    (err, results) => {
      if (err) {
        console.error("Sales chart error:", err);
        return res.status(500).json({ message: "Failed to fetch sales chart data" });
      }

      res.json({ salesChart: results });
    }
  );
};

exports.getOrderStatusChartData = (req, res) => {
  db.query(
    `SELECT status, COUNT(*) AS total
     FROM orders
     GROUP BY status`,
    (err, results) => {
      if (err) {
        console.error("Order status chart error:", err);
        return res.status(500).json({ message: "Failed to fetch order status chart data" });
      }

      res.json({ orderStatusChart: results });
    }
  );
};

exports.getTopProductsChartData = async (req, res) => {
  try {
    const results = await getTopSellingProducts(5);
    res.json({ topProductsChart: results });
  } catch (err) {
    console.error("Top products chart error:", err);
    res.status(500).json({ message: "Failed to fetch top products chart data" });
  }
};

exports.getAdvancedInsights = (req, res) => {
  const insights = {};

  db.query(
    `SELECT 
        COALESCE(SUM(CASE WHEN status = 'delivered' AND DATE(created_at) = CURDATE() THEN total ELSE 0 END), 0) AS dailyRevenue,
        COALESCE(SUM(CASE WHEN status = 'delivered' AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN total ELSE 0 END), 0) AS weeklyRevenue,
        COALESCE(SUM(CASE WHEN status = 'delivered' AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN total ELSE 0 END), 0) AS monthlyRevenue,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END), 0) AS dailyOrders,
        COALESCE(SUM(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END), 0) AS weeklyOrders,
        COALESCE(SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN 1 ELSE 0 END), 0) AS monthlyOrders
     FROM orders`,
    (err, salesSummaryResult) => {
      if (err) {
        console.error("Advanced insights sales summary error:", err);
        return res.status(500).json({ message: "Failed to fetch advanced insights" });
      }

      insights.dailyRevenue = Number(salesSummaryResult[0].dailyRevenue || 0);
      insights.weeklyRevenue = Number(salesSummaryResult[0].weeklyRevenue || 0);
      insights.monthlyRevenue = Number(salesSummaryResult[0].monthlyRevenue || 0);
      insights.dailyOrders = Number(salesSummaryResult[0].dailyOrders || 0);
      insights.weeklyOrders = Number(salesSummaryResult[0].weeklyOrders || 0);
      insights.monthlyOrders = Number(salesSummaryResult[0].monthlyOrders || 0);

      db.query(
        `SELECT
            COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURDATE() THEN oi.quantity ELSE 0 END), 0) AS dailyUnitsSold,
            COALESCE(SUM(CASE WHEN YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1) THEN oi.quantity ELSE 0 END), 0) AS weeklyUnitsSold,
            COALESCE(SUM(CASE WHEN YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE()) THEN oi.quantity ELSE 0 END), 0) AS monthlyUnitsSold
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id`,
        (err, unitsResult) => {
          if (err) {
            console.error("Advanced insights units error:", err);
            return res.status(500).json({ message: "Failed to fetch advanced insights" });
          }

          insights.dailyUnitsSold = Number(unitsResult[0].dailyUnitsSold || 0);
          insights.weeklyUnitsSold = Number(unitsResult[0].weeklyUnitsSold || 0);
          insights.monthlyUnitsSold = Number(unitsResult[0].monthlyUnitsSold || 0);

          db.query(
            `SELECT 
                id,
                name,
                stock
             FROM products
             ORDER BY stock ASC, name ASC`,
            (err, stockLevelsResult) => {
              if (err) {
                console.error("Advanced insights stock error:", err);
                return res.status(500).json({ message: "Failed to fetch advanced insights" });
              }

              insights.stockLevels = stockLevelsResult;

              res.json(insights);
            }
          );
        }
      );
    }
  );
};
