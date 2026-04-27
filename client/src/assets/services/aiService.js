import api from "./authService.js";

export const askTasteAssistant = async (message) => {
  const res = await api.post("/api/ai/taste-assistant", { message });
  return res.data;
};
