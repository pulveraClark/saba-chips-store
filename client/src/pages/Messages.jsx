import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getChatEventsUrl,
  getConversations,
  getMessages,
  sendMessage,
} from "../assets/services/chatService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

function Messages() {
  const { user, isAdmin } = useAuth();
  const { notify } = useNotification();
  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const selectedConversation = useMemo(
    () => conversations.find((item) => Number(item.user_id) === Number(selectedUserId)),
    [conversations, selectedUserId]
  );
  const unreadConversationCount = conversations.filter(
    (conversation) => Number(conversation.unread_count || 0) > 0
  ).length;

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data || []);
      setSelectedUserId((current) => current || data?.[0]?.user_id || null);
    } catch {
      notify({
        type: "error",
        title: "Messages unavailable",
        message: "Could not load conversations.",
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const fetchMessages = useCallback(async (userId) => {
    try {
      const data = await getMessages(isAdmin ? userId : null);
      setMessages(data || []);
    } catch {
      setMessages([]);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedUserId || !isAdmin) {
      fetchMessages(selectedUserId);
    }
  }, [fetchMessages, selectedUserId, isAdmin]);

  useEffect(() => {
    const source = new EventSource(getChatEventsUrl(), { withCredentials: true });

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type !== "chat:update") return;

      if (selectedUserId || !isAdmin) {
        void fetchMessages(selectedUserId);
      }
      void fetchConversations();
    };

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [fetchConversations, fetchMessages, selectedUserId, isAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatMessageTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

  const handleSend = async (e) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message) return;

    try {
      setSending(true);
      await sendMessage({
        receiverId: isAdmin ? selectedUserId : undefined,
        message,
      });
      setDraft("");
      await fetchConversations();
      await fetchMessages(selectedUserId);
    } catch (err) {
      notify({
        type: "error",
        title: "Message not sent",
        message: err?.response?.data?.message || "Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f2e8] flex items-center justify-center text-[#8b5e34] text-xl font-bold">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link to={isAdmin ? "/admin" : "/home"} className="text-[#8b5e34] font-semibold">
              Back
            </Link>
            <h1 className="text-4xl font-black text-[#8b5e34] mt-2">💬</h1>
          </div>
          <button
            onClick={() => {
              void fetchConversations();
              void fetchMessages(selectedUserId);
            }}
            className="rounded-xl bg-[#8b5e34] px-4 py-3 text-white font-bold hover:bg-[#714a28]"
            title="Sync now"
          >
            ↻
          </button>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <aside className="bg-white border border-[#ead7b8] rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-[#8b5e34] text-white font-black">
              {isAdmin ? "Customer chats" : "Support"}
              {unreadConversationCount > 0 && (
                <span className="ml-2 rounded-full bg-white px-2 py-1 text-xs text-[#8b5e34]">
                  {unreadConversationCount}
                </span>
              )}
            </div>
            <div className="divide-y divide-[#f1e3ca]">
              {conversations.length === 0 ? (
                <div className="p-6 text-[#6d4c2f]">No conversations yet.</div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.user_id}
                    onClick={() => setSelectedUserId(conversation.user_id)}
                    className={`w-full text-left p-4 hover:bg-[#fffaf2] ${
                      Number(selectedUserId) === Number(conversation.user_id)
                        ? "bg-[#f5e4c9]"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between gap-3">
                      <p className="font-black text-[#8b5e34]">
                        {conversation.name}
                        {conversation.unread_count > 0 && (
                          <span className="ml-2 text-sm text-red-700">
                            ({conversation.unread_count})
                          </span>
                        )}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="rounded-full bg-red-600 text-white text-xs font-bold px-2 py-1">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#6d4c2f] truncate">
                      {conversation.last_message || conversation.email}
                    </p>
                    {conversation.last_message_at && (
                      <p className="mt-1 text-xs text-[#9a7654]">
                        {formatMessageTime(conversation.last_message_at)}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="bg-white border border-[#ead7b8] rounded-2xl shadow-xl min-h-[620px] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#ead7b8]">
              <h2 className="text-2xl font-black text-[#8b5e34]">
                {isAdmin ? selectedConversation?.name || "Select a customer" : "Saba Chips Admin"}
              </h2>
              <p className="text-sm text-[#6d4c2f]">
                {isAdmin ? selectedConversation?.email : "Ask about orders, delivery, and support."}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#fffaf2]">
              {messages.length === 0 ? (
                <div className="text-center text-[#6d4c2f] py-20">
                  No messages yet.
                </div>
              ) : (
                messages.map((item) => {
                  const mine = Number(item.sender_id) === Number(user?.id);
                  return (
                    <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                          mine
                            ? "bg-[#8b5e34] text-white"
                            : "bg-white text-gray-900 border border-[#ead7b8]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{item.message}</p>
                        <p className={`mt-2 text-xs ${mine ? "text-[#fff1df]" : "text-[#7a5331]"}`}>
                          {formatMessageTime(item.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef}></div>
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-[#ead7b8] bg-white">
              <div className="flex gap-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  rows={2}
                  disabled={isAdmin && !selectedUserId}
                  className="flex-1 resize-none rounded-2xl border border-[#d8be96] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b5e34]"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim() || (isAdmin && !selectedUserId)}
                  className="rounded-2xl bg-[#8b5e34] px-6 py-3 text-white font-black hover:bg-[#714a28] disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Messages;
