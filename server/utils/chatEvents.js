const clientsByUser = new Map();

const addChatClient = (userId, res) => {
  const key = Number(userId);
  if (!clientsByUser.has(key)) {
    clientsByUser.set(key, new Set());
  }

  clientsByUser.get(key).add(res);

  res.on("close", () => {
    const clients = clientsByUser.get(key);
    if (!clients) return;

    clients.delete(res);
    if (clients.size === 0) {
      clientsByUser.delete(key);
    }
  });
};

const sendChatEvent = (userId, payload) => {
  const clients = clientsByUser.get(Number(userId));
  if (!clients) return;

  const data = `data: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((client) => {
    client.write(data);
  });
};

const broadcastChatUpdate = ({ senderId, receiverId, messageId }) => {
  const payload = {
    type: "chat:update",
    senderId,
    receiverId,
    messageId,
    createdAt: new Date().toISOString(),
  };

  sendChatEvent(senderId, payload);
  sendChatEvent(receiverId, payload);
};

module.exports = {
  addChatClient,
  broadcastChatUpdate,
};
