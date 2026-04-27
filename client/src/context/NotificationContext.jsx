import { createContext, useContext, useMemo, useState } from "react";

const NotificationContext = createContext();

const stylesByType = {
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
};

/* eslint-disable react-refresh/only-export-components */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const notify = ({ type = "info", title, message, duration = 3000 }) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, type, title, message }]);

    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const value = useMemo(
    () => ({ notify, removeNotification }),
    []
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[min(92vw,380px)] flex-col gap-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-4 shadow-2xl backdrop-blur ${stylesByType[notification.type] || stylesByType.info}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {notification.title && (
                  <p className="text-sm font-black">{notification.title}</p>
                )}
                {notification.message && (
                  <p className="mt-1 text-sm font-medium">{notification.message}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="rounded-full px-2 py-1 text-sm font-bold opacity-70 hover:opacity-100"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
