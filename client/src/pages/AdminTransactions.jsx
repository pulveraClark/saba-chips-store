import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTransactionHistory } from "../assets/services/adminService.js";
import { sortByNewest } from "../utils/sortByNewest.js";
import { exportToCsv, exportToExcel } from "../utils/exportData.js";
import { formatDeliveryFee } from "../utils/deliveryFees.js";

function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const TRANSACTIONS_PER_PAGE = 5;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const transactionData = await getTransactionHistory();
      setTransactions(transactionData || []);
    } catch (err) {
      console.error("Failed to fetch transaction history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sortedTransactions = sortByNewest(transactions);

  const transactionColumns = [
    { key: "orderId", label: "Order ID" },
    { key: "customerName", label: "Customer Name" },
    { key: "customerEmail", label: "Customer Email" },
    { key: "total", label: "Total" },
    { key: "deliveryFee", label: "Delivery Fee" },
    { key: "status", label: "Status" },
    { key: "paymentMethod", label: "Payment Method" },
    { key: "address", label: "Address" },
    { key: "phone", label: "Phone" },
    { key: "createdAt", label: "Created At" },
    { key: "items", label: "Items" },
  ];

  const transactionRows = sortedTransactions.map((transaction) => ({
    orderId: transaction.id,
    customerName: transaction.customer_name,
    customerEmail: transaction.customer_email,
    total: Number(transaction.total || 0).toFixed(2),
    deliveryFee: Number(transaction.delivery_fee || 0).toFixed(2),
    status: transaction.status,
    paymentMethod: transaction.payment_method,
    address: transaction.address,
    phone: transaction.phone,
    createdAt: new Date(transaction.created_at).toLocaleString(),
    items: (transaction.items || [])
      .map((item) => `${item.product_name} x${item.quantity}`)
      .join(", "),
  }));

  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / TRANSACTIONS_PER_PAGE));
  const paginatedTransactions = sortedTransactions.slice(
    (page - 1) * TRANSACTIONS_PER_PAGE,
    page * TRANSACTIONS_PER_PAGE
  );

  const handleExportCsv = () => {
    exportToCsv("transaction-history.csv", transactionColumns, transactionRows);
  };

  const handleExportExcel = () => {
    exportToExcel("transaction-history.xls", "Transaction History", transactionColumns, transactionRows);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f2e8]">
        <div className="text-2xl text-[#8b5e34] animate-pulse">Loading transaction history...</div>
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
          <h1 className="text-4xl md:text-5xl font-black mb-3">Transaction History</h1>
          <p className="text-[#fff1df] text-lg max-w-2xl">
            Browse the full transaction history, export records, and review order details.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-lg border border-[#ead7b8] mb-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(220px,360px)_1fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-black text-[#8b5e34]">Export Transactions</h2>
              <p className="text-[#6d4c2f]">Download your transaction history in CSV or Excel format.</p>
            </div>
            <details className="rounded-2xl border border-[#ead7b8] bg-[#fffaf2] p-3" open>
              <summary className="cursor-pointer list-none font-black text-[#8b5e34]">
                Export options
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <button
                  onClick={handleExportCsv}
                  className="min-h-12 rounded-xl bg-[#8b5e34] px-4 py-3 font-bold text-white hover:bg-[#714a28]"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="min-h-12 rounded-xl bg-[#b8834d] px-4 py-3 font-bold text-white hover:bg-[#9e6d3b]"
                >
                  Export Excel
                </button>
              </div>
            </details>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-3xl border border-[#ead7b8] bg-white p-10 text-center text-[#6d4c2f] shadow-lg">
            No transactions found.
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#ead7b8]">
            <div className="bg-gradient-to-r from-[#8b5e34] to-[#b8834d] p-6 text-white">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-3xl font-black">Transactions</h2>
                <button
                  onClick={() => fetchTransactions(true)}
                  disabled={refreshing}
                  className="px-4 py-3 rounded-2xl bg-white text-[#8b5e34] font-bold hover:bg-[#f8f2e8] disabled:opacity-60"
                >
                  {refreshing ? "↻..." : "↻"}
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {paginatedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-[#fffaf2] border border-[#ead7b8] rounded-3xl p-6 shadow-sm"
                >
                  <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
                    <div>
                      <p className="text-sm text-[#7a5331] mb-1">Order ID</p>
                      <p className="font-black text-[#8b5e34] text-xl">#{transaction.id}</p>
                    </div>

                    <div>
                      <p className="text-sm text-[#7a5331] mb-1">Customer</p>
                      <p className="font-semibold text-gray-900">{transaction.customer_name}</p>
                      <p className="text-sm text-[#6d4c2f]">{transaction.customer_email}</p>
                    </div>

                    <div>
                      <p className="text-sm text-[#7a5331] mb-1">Total</p>
                      <p className="font-black text-[#8b5e34] text-xl">₱{Number(transaction.total).toLocaleString()}</p>
                      <p className="text-sm font-bold text-[#6d4c2f]">
                        Delivery: {formatDeliveryFee(transaction.delivery_fee || 0)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[#7a5331] mb-1">Payment</p>
                      <p className="text-[#6d4c2f]">{transaction.payment_method}</p>
                    </div>

                    <div>
                      <p className="text-sm text-[#7a5331] mb-1">Date</p>
                      <p className="text-[#6d4c2f]">{new Date(transaction.created_at).toLocaleString()}</p>
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
                Page {page} of {totalPages} • {transactions.length} total transactions
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
                  onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                  disabled={page >= totalPages}
                  className="px-5 py-2 rounded-xl bg-[#8b5e34] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTransactions;
