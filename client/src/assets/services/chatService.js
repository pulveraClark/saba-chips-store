import api from "./authService.js";

export const getConversations = async () => {
  const res = await api.get("/api/chat/conversations");
  return res.data.conversations;
};

export const getMessages = async (userId) => {
  const url = userId ? `/api/chat/messages/${userId}` : "/api/chat/messages";
  const res = await api.get(url);
  return res.data.messages;
};

export const sendMessage = async ({ receiverId, message }) => {
  const res = await api.post("/api/chat/messages", { receiverId, message });
  return res.data;
};
