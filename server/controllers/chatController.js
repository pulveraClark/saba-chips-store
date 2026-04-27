const queryAsync = require("../utils/queryAsync");
const { getAdminUser } = require("../utils/realtimeData");

const isCurrentUserAdmin = (req) => req.session.user?.email === "admin@sabachips.com";

exports.getConversations = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!isCurrentUserAdmin(req)) {
      const admin = await getAdminUser();
      const latestRows = admin
        ? await queryAsync(
            `SELECT message, created_at
             FROM chat_messages
             WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
             ORDER BY created_at DESC, id DESC
             LIMIT 1`,
            [userId, admin.id, admin.id, userId]
          )
        : [];
      const unreadRows = admin
        ? await queryAsync(
            `SELECT COUNT(*) AS unread_count
             FROM chat_messages
             WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
            [admin.id, userId]
          )
        : [];

      return res.json({
        conversations: admin
          ? [
              {
                user_id: admin.id,
                name: "Saba Chips Admin",
                email: admin.email,
                last_message: latestRows[0]?.message || null,
                last_message_at: latestRows[0]?.created_at || null,
                unread_count: Number(unreadRows[0]?.unread_count || 0),
              },
            ]
          : [],
      });
    }

    const conversations = await queryAsync(
      `SELECT
         u.id AS user_id,
         u.name,
         u.email,
         latest.message AS last_message,
         latest.created_at AS last_message_at,
         COALESCE(unread.unread_count, 0) AS unread_count
       FROM users u
       JOIN (
         SELECT
           CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user_id,
           MAX(id) AS latest_id
         FROM chat_messages
         WHERE sender_id = ? OR receiver_id = ?
         GROUP BY other_user_id
       ) latest_ids ON latest_ids.other_user_id = u.id
       JOIN chat_messages latest ON latest.id = latest_ids.latest_id
       LEFT JOIN (
         SELECT sender_id, COUNT(*) AS unread_count
         FROM chat_messages
         WHERE receiver_id = ? AND is_read = 0
         GROUP BY sender_id
       ) unread ON unread.sender_id = u.id
       WHERE u.email <> 'admin@sabachips.com'
       ORDER BY latest.created_at DESC, latest.id DESC`,
      [userId, userId, userId, userId]
    );

    res.json({ conversations });
  } catch (err) {
    console.error("Failed to fetch conversations:", err);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const admin = await getAdminUser();
    const otherUserId = isCurrentUserAdmin(req) ? Number(req.params.userId) : admin?.id;

    if (!otherUserId) {
      return res.status(404).json({ message: "Chat recipient not found" });
    }

    const messages = await queryAsync(
      `SELECT id, sender_id, receiver_id, message, is_read, created_at
       FROM chat_messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC, id ASC`,
      [currentUserId, otherUserId, otherUserId, currentUserId]
    );

    await queryAsync(
      "UPDATE chat_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?",
      [otherUserId, currentUserId]
    );

    res.json({ messages });
  } catch (err) {
    console.error("Failed to fetch chat messages:", err);
    res.status(500).json({ message: "Failed to fetch chat messages" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.session.userId;
    const message = req.body.message?.trim();

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const admin = await getAdminUser();
    const receiverId = isCurrentUserAdmin(req) ? Number(req.body.receiverId) : admin?.id;

    if (!receiverId || receiverId === senderId) {
      return res.status(400).json({ message: "Invalid message recipient" });
    }

    const result = await queryAsync(
      "INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
      [senderId, receiverId, message]
    );

    res.status(201).json({ message: "Message sent", id: result.insertId });
  } catch (err) {
    console.error("Failed to send message:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};
