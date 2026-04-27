const OpenAI = require("openai");
const queryAsync = require("../utils/queryAsync");

exports.askTasteAssistant = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const products = await queryAsync(
      `SELECT name, description, price, stock
       FROM products
       ORDER BY name ASC`
    );

    const productInfo = products.length
      ? products
          .map(
            (product) =>
              `- ${product.name}: PHP ${product.price}, stock ${product.stock}. ${
                product.description || "Freshly cooked banana chips"
              }`
          )
          .join("\n")
      : "No products are currently listed in the system.";

    const lowerMessage = message.toLowerCase();
    if (!process.env.GROQ_API_KEY) {
      const availableProducts = products.filter((product) => Number(product.stock) > 0);
      const bestSellers = availableProducts.filter((product) =>
        /sour cream|barbecue|chili/i.test(product.name)
      );

      if (lowerMessage.includes("available") || lowerMessage.includes("stock")) {
        return res.json({
          reply: availableProducts.length
            ? `Available now: ${availableProducts
                .map((product) => `${product.name} (${product.stock} left)`)
                .join(", ")}.`
            : "No products are currently available.",
        });
      }

      if (lowerMessage.includes("price") || lowerMessage.includes("how much")) {
        return res.json({
          reply: products.length
            ? products.map((product) => `${product.name}: PHP ${product.price}`).join("\n")
            : "Prices are not currently available.",
        });
      }

      return res.json({
        reply: bestSellers.length
          ? `For best sellers, try ${bestSellers
              .slice(0, 3)
              .map((product) => product.name)
              .join(", ")}. You can also ask me about available stock or prices.`
          : "Ask me about available stock, prices, best sellers, or which flavor fits your taste.",
      });
    }

    const systemPrompt = `
You are the Saba Chips Taste Assistant.

Only answer using the store and live product information below.
Do not invent new products, prices, delivery rules, promos, or payment methods.
If something is not in the information below, say it is not currently available in the system.

Store:
- Brand: Saba Chips
- Location: Catarman, Liloan, Cebu
- Product type: Freshly cooked banana chips

Available flavors:
- Cheese
- Sour Cream (Best seller)
- Barbecue (Best seller)
- Chili BBQ (Best seller)
- Sour Cheese
- Plain (No sugar, No Flavor)

Live products from the database:
${productInfo}

Helpful guidance:
- If the user likes spicy flavors, recommend Chili BBQ.
- If the user wants a bestseller, recommend Sour Cream, Barbecue, or Chili BBQ.
- If the user likes cheesy flavors, recommend Cheese or Sour Cheese.
- If the user wants a simple or less flavored option, recommend Plain.
- For first-time buyers, suggest 2 to 3 popular flavors.

Delivery:
- Free delivery within nearby locations.

Rules:
- Keep answers short, clear, and friendly.
- Use simple English.
- Focus on helping the customer choose flavors.
- Mention stock or price when it helps answer the question.
- Do not mention technical details.
`;

    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I could not answer that right now.";

    res.json({ reply });
  } catch (error) {
    console.error("AI assistant error:", error);
    res.status(500).json({ message: "AI assistant failed" });
  }
};
