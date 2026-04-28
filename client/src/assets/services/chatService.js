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

export const sendMessage = async ({ receiverId, message, image }) => {
  if (image instanceof File) {
    const formData = new FormData();
    if (receiverId) formData.append("receiverId", receiverId);
    formData.append("message", message || "");
    formData.append("image", image);
    const res = await api.post("/api/chat/messages", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  const res = await api.post("/api/chat/messages", { receiverId, message });
  return res.data;
};

export const getChatEventsUrl = () => {
  const baseURL = api.defaults.baseURL || "";
  return `${baseURL}/api/chat/events`;
};
