import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminSummary,
  getTransactionHistory,
  getSalesChartData,
  getOrderStatusChartData,
  getTopProductsChartData,
  getAdvancedInsights,
} from "../assets/services/adminService.js";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function AdminReports() {
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    averageOrderValue: 0,
    newCustomers: 0,
    returningCustomers: 0,
    repeatPurchaseRate: 0,
    totalStockUnits: 0,
  });

  const [advancedInsights, setAdvancedInsights] = useState({
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    dailyOrders: 0,
    weeklyOrders: 0,
    monthlyOrders: 0,
    dailyUnitsSold: 0,
    weeklyUnitsSold: 0,
    monthlyUnitsSold: 0,
    stockLevels: [],
  });

  const [transactions, setTransactions] = useState([]);
  const [salesChart, setSalesChart] = useState([]);
  const [orderStatusChart, setOrderStatusChart] = useState([]);
  const [topProductsChart, setTopProductsChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsRefreshing, setTransactionsRefreshing] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);

  const TRANSACTIONS_PER_PAGE = 5;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (showRefresh = false) => {
    try {
      if (showRefresh) setTransactionsRefreshing(true);

      const [
        summaryData,
        advancedData,
        transactionData,
        salesData,
        statusData,
        topProductsData,
      ] = await Promise.all([
        getAdminSummary(),
        getAdvancedInsights(),
        getTransactionHistory(),
        getSalesChartData(),
        getOrderStatusChartData(),
        getTopProductsChartData(),
      ]);

      setSummary(summaryData || {});
      setAdvancedInsights(advancedData || {});
      setTransactions(transactionData || []);
      setSalesChart(salesData || []);
      setOrderStatusChart(statusData || []);
      setTopProductsChart(topProductsData || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
      setTransactionsRefreshing(false);
    }
  };

  const salesLineData = {
    labels: salesChart.map((item) => item.order_date),
    datasets: [
      {
        label: "Delivered Sales",
        data: salesChart.map((item) => Number(item.total_sales)),
        borderColor: "#8b5e34",
        backgroundColor: "rgba(139, 94, 52, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const orderStatusDoughnutData = {
    labels: orderStatusChart.map((item) => item.status),
    datasets: [
      {
        label: "Orders",
        data: orderStatusChart.map((item) => Number(item.total)),
        backgroundColor: ["#facc15", "#60a5fa", "#a78bfa", "#4ade80", "#f87171"],
        borderWidth: 1,
      },
    ],
  };

  const topProductsBarData = {
    labels: topProductsChart.map((item) => item.name),
    datasets: [
      {
        label: "Units Sold",
        data: topProductsChart.map((item) => Number(item.total_quantity)),
        backgroundColor: "#b8834d",
      },
    ],
  };

  const transactionsTotalPages = Math.max(
    1,
    Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE)
  );

  const paginatedTransactions = transactions.slice(
    (transactionsPage - 1) * TRANSACTIONS_PER_PAGE,
    transactionsPage * TRANSACTIONS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f2e8]">
        <div className="text-2xl text-[#8b5e34] animate-pulse">
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] rounded-[2rem] p-8 text-white shadow-xl mb-8">
          <Link
            to="/admin"
            className="inline-block text-[#fff1df] hover:text-white mb-4"
          >
            ← Back to Admin Hub
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            Reports & Insights
          </h1>
          <p className="text-[#fff1df] text-lg max-w-2xl">
            Summary reports, transaction history, and analytics charts for your
            store.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Total Users</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">{summary.totalUsers}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Total Products</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">{summary.totalProducts}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Total Orders</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">{summary.totalOrders}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Delivered Sales</p>
            <h2 className="text-4xl font-black text-[#8b5e34]">
              ₱{Number(summary.totalSales).toLocaleString()}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8] mb-8">
          <h2 className="text-2xl font-black text-[#8b5e34] mb-4">
            Order Status Counts
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-200">
              <p className="text-sm text-yellow-700 mb-2">Pending</p>
              <h3 className="text-3xl font-black text-yellow-700">{summary.pendingOrders || 0}</h3>
            </div>
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
              <p className="text-sm text-blue-700 mb-2">Confirmed</p>
              <h3 className="text-3xl font-black text-blue-700">{summary.confirmedOrders || 0}</h3>
            </div>
            <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
              <p className="text-sm text-purple-700 mb-2">Shipped</p>
              <h3 className="text-3xl font-black text-purple-700">{summary.shippedOrders || 0}</h3>
            </div>
            <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
              <p className="text-sm text-green-700 mb-2">Delivered</p>
              <h3 className="text-3xl font-black text-green-700">{summary.deliveredOrders || 0}</h3>
            </div>
            <div className="bg-red-50 rounded-2xl p-5 border border-red-200">
              <p className="text-sm text-red-700 mb-2">Cancelled</p>
              <h3 className="text-3xl font-black text-red-700">{summary.cancelledOrders || 0}</h3>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <h3 className="text-xl font-black text-[#8b5e34] mb-4">Daily Summary</h3>
            <div className="space-y-3 text-[#6d4c2f]">
              <div className="flex justify-between">
                <span>Revenue</span>
                <span className="font-bold">₱{Number(advancedInsights.dailyRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Orders</span>
                <span className="font-bold">{advancedInsights.dailyOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Units Sold</span>
                <span className="font-bold">{advancedInsights.dailyUnitsSold || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <h3 className="text-xl font-black text-[#8b5e34] mb-4">Weekly Summary</h3>
            <div className="space-y-3 text-[#6d4c2f]">
              <div className="flex justify-between">
                <span>Revenue</span>
                <span className="font-bold">₱{Number(advancedInsights.weeklyRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Orders</span>
                <span className="font-bold">{advancedInsights.weeklyOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Units Sold</span>
                <span className="font-bold">{advancedInsights.weeklyUnitsSold || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <h3 className="text-xl font-black text-[#8b5e34] mb-4">Monthly Summary</h3>
            <div className="space-y-3 text-[#6d4c2f]">
              <div className="flex justify-between">
                <span>Revenue</span>
                <span className="font-bold">₱{Number(advancedInsights.monthlyRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Orders</span>
                <span className="font-bold">{advancedInsights.monthlyOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Units Sold</span>
                <span className="font-bold">{advancedInsights.monthlyUnitsSold || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Average Order Value</p>
            <h2 className="text-3xl font-black text-[#8b5e34]">
              ₱{Number(summary.averageOrderValue || 0).toLocaleString()}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">New Customers</p>
            <h2 className="text-3xl font-black text-[#8b5e34]">{summary.newCustomers || 0}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Returning Customers</p>
            <h2 className="text-3xl font-black text-[#8b5e34]">{summary.returningCustomers || 0}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Repeat Purchase Rate</p>
            <h2 className="text-3xl font-black text-[#8b5e34]">
              {Number(summary.repeatPurchaseRate || 0)}%
            </h2>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Total Stock Units</p>
            <h2 className="text-3xl font-black text-[#8b5e34]">{summary.totalStockUnits || 0}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Low Stock Alerts</p>
            <h2 className="text-3xl font-black text-yellow-600">{summary.lowStockProducts || 0}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8]">
            <p className="text-sm text-[#7a5331] mb-2">Out of Stock</p>
            <h2 className="text-3xl font-black text-red-600">{summary.outOfStockProducts || 0}</h2>
          </div>
        </div>

        <div className="grid xl:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-[#ead7b8] xl:col-span-1">
            <h2 className="text-xl font-black text-[#8b5e34] mb-4">
              Sales Trend
            </h2>
            <div className="h-[260px]">
              <Line
                data={salesLineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top",
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-lg border border-[#ead7b8] xl:col-span-1">
            <h2 className="text-xl font-black text-[#8b5e34] mb-4">
              Order Status Distribution
            </h2>
            <div className="h-[260px] flex items-center justify-center">
              <div className="w-[220px] h-[220px]">
                <Doughnut
                  data={orderStatusDoughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-lg border border-[#ead7b8] xl:col-span-1">
            <h2 className="text-xl font-black text-[#8b5e34] mb-4">
              Top Selling Products
            </h2>
            <div className="h-[260px]">
              <Bar
                data={topProductsBarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top",
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#ead7b8] mb-8">
          <h2 className="text-2xl font-black text-[#8b5e34] mb-4">
            Current Stock Levels
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {(advancedInsights.stockLevels || []).map((product) => (
              <div
                key={product.id}
                className={`rounded-2xl p-4 border ${
                  Number(product.stock) <= 0
                    ? "bg-red-50 border-red-200"
                    : Number(product.stock) <= 5
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-[#fffaf2] border-[#ead7b8]"
                }`}
              >
                <p className="font-semibold text-gray-900">{product.name}</p>
                <p
                  className={`text-sm font-bold mt-2 ${
                    Number(product.stock) <= 0
                      ? "text-red-700"
                      : Number(product.stock) <= 5
                      ? "text-yellow-700"
                      : "text-[#8b5e34]"
                  }`}
                >
                  Stock: {product.stock}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#ead7b8]">
          <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] p-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-black">Transaction History</h2>
              <button
                onClick={() => fetchReports(true)}
                disabled={transactionsRefreshing}
                className="px-4 py-3 rounded-2xl bg-white text-[#8b5e34] font-bold hover:bg-[#f8f2e8] disabled:opacity-60"
              >
                {transactionsRefreshing ? "↻..." : "↻"}
              </button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-16 text-[#6d4c2f]">
              No transactions found.
            </div>
          ) : (
            <>
              <div className="space-y-6 p-6">
                {paginatedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-[#fffaf2] border border-[#ead7b8] rounded-3xl p-6 shadow-sm"
                  >
                    <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Order ID</p>
                        <p className="font-black text-[#8b5e34] text-xl">
                          #{transaction.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Customer</p>
                        <p className="font-semibold text-gray-900">
                          {transaction.customer_name}
                        </p>
                        <p className="text-sm text-[#6d4c2f]">
                          {transaction.customer_email}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Total</p>
                        <p className="font-black text-[#8b5e34] text-xl">
                          ₱{Number(transaction.total).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Payment</p>
                        <p className="text-[#6d4c2f]">
                          {transaction.payment_method}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Date</p>
                        <p className="text-[#6d4c2f]">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-5">
                      <div>
                        <p className="text-sm text-[#7a5331] mb-2">Ordered Items</p>
                        <div className="flex flex-wrap gap-2">
                          {transaction.items?.map((item, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-2 rounded-full bg-[#f5e4c9] text-[#8b5e34] text-sm font-semibold"
                            >
                              {item.product_name} ×{item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end">
                        <p className="text-sm text-[#7a5331] mb-2">Status</p>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold capitalize w-fit ${
                            transaction.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : transaction.status === "confirmed"
                              ? "bg-blue-100 text-blue-700"
                              : transaction.status === "shipped"
                              ? "bg-purple-100 text-purple-700"
                              : transaction.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : transaction.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[#ead7b8]">
                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Address</p>
                        <p className="text-[#6d4c2f]">{transaction.address}</p>
                      </div>

                      <div>
                        <p className="text-sm text-[#7a5331] mb-1">Phone</p>
                        <p className="text-[#6d4c2f]">{transaction.phone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#f1e3ca] bg-[#fffaf2]">
                <p className="text-[#6d4c2f] font-medium">
                  Page {transactionsPage} of {transactionsTotalPages} • {transactions.length} total transactions
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setTransactionsPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={transactionsPage === 1}
                    className="px-5 py-2 rounded-xl bg-[#8b5e34] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>

                  <button
                    onClick={() =>
                      setTransactionsPage((prev) =>
                        prev < transactionsTotalPages ? prev + 1 : prev
                      )
                    }
                    disabled={transactionsPage >= transactionsTotalPages}
                    className="px-5 py-2 rounded-xl bg-[#8b5e34] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminReports;