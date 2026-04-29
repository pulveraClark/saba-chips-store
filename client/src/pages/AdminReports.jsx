import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminSummary,
  getSalesChartData,
  getOrderStatusChartData,
  getTopProductsChartData,
  getAdvancedInsights,
} from "../assets/services/adminService.js";
import { sortByNewest } from "../utils/sortByNewest.js";
import {
  exportToCsv,
  exportToExcel,
  exportToPdfPrint,
} from "../utils/exportData.js";

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
    paymentVerificationOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    preparingOrders: 0,
    outForDeliveryOrders: 0,
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

  const [salesChart, setSalesChart] = useState([]);
  const [orderStatusChart, setOrderStatusChart] = useState([]);
  const [topProductsChart, setTopProductsChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [summaryData, advancedData, salesData, statusData, topProductsData] =
        await Promise.all([
          getAdminSummary(),
          getAdvancedInsights(),
          getSalesChartData(),
          getOrderStatusChartData(),
          getTopProductsChartData(),
        ]);

      setSummary(summaryData || {});
      setAdvancedInsights(advancedData || {});
      setSalesChart(salesData || []);
      setOrderStatusChart(statusData || []);
      setTopProductsChart(topProductsData || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
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

  const summaryRows = [
    { metric: "Total Users", value: summary.totalUsers || 0 },
    { metric: "Total Products", value: summary.totalProducts || 0 },
    { metric: "Total Orders", value: summary.totalOrders || 0 },
    { metric: "Delivered Sales", value: Number(summary.totalSales || 0).toFixed(2) },
    { metric: "Payment Check Orders", value: summary.paymentVerificationOrders || 0 },
    { metric: "Pending Orders", value: summary.pendingOrders || 0 },
    { metric: "Confirmed Orders", value: summary.confirmedOrders || 0 },
    { metric: "Preparing Orders", value: summary.preparingOrders || 0 },
    { metric: "Out for Delivery Orders", value: summary.outForDeliveryOrders || 0 },
    { metric: "Delivered Orders", value: summary.deliveredOrders || 0 },
    { metric: "Cancelled Orders", value: summary.cancelledOrders || 0 },
    { metric: "Average Order Value", value: Number(summary.averageOrderValue || 0).toFixed(2) },
    { metric: "New Customers", value: summary.newCustomers || 0 },
    { metric: "Returning Customers", value: summary.returningCustomers || 0 },
    { metric: "Repeat Purchase Rate (%)", value: summary.repeatPurchaseRate || 0 },
    { metric: "Total Stock Units", value: summary.totalStockUnits || 0 },
    { metric: "Low Stock Products", value: summary.lowStockProducts || 0 },
    { metric: "Out of Stock Products", value: summary.outOfStockProducts || 0 },
    { metric: "Daily Revenue", value: Number(advancedInsights.dailyRevenue || 0).toFixed(2) },
    { metric: "Weekly Revenue", value: Number(advancedInsights.weeklyRevenue || 0).toFixed(2) },
    { metric: "Monthly Revenue", value: Number(advancedInsights.monthlyRevenue || 0).toFixed(2) },
    { metric: "Daily Orders", value: advancedInsights.dailyOrders || 0 },
    { metric: "Weekly Orders", value: advancedInsights.weeklyOrders || 0 },
    { metric: "Monthly Orders", value: advancedInsights.monthlyOrders || 0 },
    { metric: "Daily Units Sold", value: advancedInsights.dailyUnitsSold || 0 },
    { metric: "Weekly Units Sold", value: advancedInsights.weeklyUnitsSold || 0 },
    { metric: "Monthly Units Sold", value: advancedInsights.monthlyUnitsSold || 0 },
  ];

  const orderStatusCards = [
    {
      label: "Payment Check",
      value: summary.paymentVerificationOrders || 0,
      className: "border-orange-200 bg-orange-50 text-orange-700",
    },
    {
      label: "Pending",
      value: summary.pendingOrders || 0,
      className: "border-yellow-200 bg-yellow-50 text-yellow-700",
    },
    {
      label: "Confirmed",
      value: summary.confirmedOrders || 0,
      className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    {
      label: "Preparing",
      value: summary.preparingOrders || 0,
      className: "border-cyan-200 bg-cyan-50 text-cyan-700",
    },
    {
      label: "Out for Delivery",
      value: summary.outForDeliveryOrders || 0,
      className: "border-purple-200 bg-purple-50 text-purple-700",
    },
    {
      label: "Delivered",
      value: summary.deliveredOrders || 0,
      className: "border-green-200 bg-green-50 text-green-700",
    },
    {
      label: "Cancelled",
      value: summary.cancelledOrders || 0,
      className: "border-red-200 bg-red-50 text-red-700",
    },
  ];

  const summaryColumns = [
    { key: "metric", label: "Metric" },
    { key: "value", label: "Value" },
  ];

  const handleExportSummaryCsv = () => {
    exportToCsv("summary-report.csv", summaryColumns, summaryRows);
  };

  const handleExportSummaryExcel = () => {
    exportToExcel("summary-report.xls", "Summary Report", summaryColumns, summaryRows);
  };

  const handleExportReportsPdf = () => {
    exportToPdfPrint("Saba Chips Summary Report", [
      {
        heading: "Summary Report",
        columns: summaryColumns,
        rows: summaryRows,
      },
    ]);
  };

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
            Summary reports and analytics charts for your
            store.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-lg border border-[#ead7b8] mb-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(220px,360px)_1fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-black text-[#8b5e34]">Export Reports</h2>
              <p className="text-[#6d4c2f]">Download your reports in CSV, Excel, or PDF.</p>
            </div>
            <details className="rounded-2xl border border-[#ead7b8] bg-[#fffaf2] p-3" open>
              <summary className="cursor-pointer list-none font-black text-[#8b5e34]">
                Export options
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <button
                  onClick={handleExportSummaryCsv}
                  className="min-h-12 rounded-xl bg-[#8b5e34] px-4 py-3 font-bold text-white hover:bg-[#714a28]"
                >
                  Summary CSV
                </button>
                <button
                  onClick={handleExportSummaryExcel}
                  className="min-h-12 rounded-xl bg-[#b8834d] px-4 py-3 font-bold text-white hover:bg-[#9e6d3b]"
                >
                  Summary Excel
                </button>
                <button
                  onClick={handleExportReportsPdf}
                  className="min-h-12 rounded-xl bg-[#2f4858] px-4 py-3 font-bold text-white hover:bg-[#243946] sm:col-span-2 xl:col-span-1"
                >
                  Export Summary PDF
                </button>
              </div>
            </details>
          </div>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {orderStatusCards.map((status) => (
              <div
                key={status.label}
                className={`rounded-2xl border p-5 ${status.className}`}
              >
                <p className="mb-2 min-h-10 text-sm font-bold leading-snug">
                  {status.label}
                </p>
                <h3 className="text-3xl font-black">{status.value}</h3>
              </div>
            ))}
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

      </div>
    </div>
  );
}

export default AdminReports;
