const statusSteps = ["pending", "confirmed", "shipped", "delivered"];

const labels = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function OrderTimeline({ status, timeline = [] }) {
  const activeIndex = status === "cancelled" ? -1 : statusSteps.indexOf(status);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statusSteps.map((step, index) => {
          const active = activeIndex >= index;

          return (
            <div
              key={step}
              className={`rounded-2xl border px-4 py-3 text-center ${
                active
                  ? "border-[#c89a66] bg-[#fff1df] text-[#8b5e34]"
                  : "border-[#ead7b8] bg-white text-[#7a5331]"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em]">
                Step {index + 1}
              </p>
              <p className="mt-1 text-sm font-black">{labels[step]}</p>
            </div>
          );
        })}
      </div>

      {status === "cancelled" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          This order was cancelled.
        </div>
      )}

      <div className="space-y-3">
        {timeline.map((entry, index) => (
          <div
            key={`${entry.status}-${entry.created_at}-${index}`}
            className="rounded-2xl border border-[#ead7b8] bg-white px-4 py-3"
          >
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <p className="font-bold text-[#8b5e34]">
                {labels[entry.status] || entry.status}
              </p>
              <p className="text-sm text-[#7a5331]">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
            <p className="mt-2 text-sm text-[#6d4c2f]">{entry.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderTimeline;
