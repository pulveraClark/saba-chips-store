import axios from "axios";

const api = axios.create({
  withCredentials: true,
});

export const askTasteAssistant = async (message) => {
  const res = await api.post("/api/ai/taste-assistant", { message });
  return res.data;
};