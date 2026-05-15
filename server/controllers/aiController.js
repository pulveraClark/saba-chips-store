const OpenAI = require("openai");
const queryAsync = require("../utils/queryAsync");
const getTopSellingProducts = require("../utils/topSellingProducts");

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
    const topSellingProducts = await getTopSellingProducts(5);

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

    const topSellingInfo = topSellingProducts.length
      ? topSellingProducts
          .map(
            (product, index) =>
              `${index + 1}. ${product.name} (${product.total_quantity} sold, stock ${product.stock})`
          )
          .join("\n")
      : "No sales-based best sellers yet.";

    const lowerMessage = message.toLowerCase();
    if (!process.env.GROQ_API_KEY) {
      const availableProducts = products.filter((product) => Number(product.stock) > 0);
      const bestSellers = topSellingProducts.filter((product) =>
        Number(product.stock) > 0
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

      if (
        lowerMessage.includes("best") ||
        lowerMessage.includes("seller") ||
        lowerMessage.includes("popular") ||
        lowerMessage.includes("top")
      ) {
        return res.json({
          reply: bestSellers.length
            ? `Current best sellers by units sold: ${bestSellers
                .slice(0, 3)
                .map((product) => `${product.name} (${product.total_quantity} sold)`)
                .join(", ")}.`
            : "No sales-based best sellers yet. You can ask me about available stock or prices.",
        });
      }

      return res.json({
        reply: bestSellers.length
          ? `Popular right now: ${bestSellers
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

Sales-based top selling products from the database:
${topSellingInfo}

Helpful guidance:
- If the user likes spicy flavors, recommend Chili BBQ.
- If the user wants a bestseller, recommend products from the sales-based top selling products list above.
- If the user likes cheesy flavors, recommend Cheese or Sour Cheese.
- If the user wants a simple or less flavored option, recommend Plain.
- For first-time buyers, suggest 2 to 3 products from the sales-based top selling list when available.

Delivery:
- Free delivery only for 4+ packs in Liloan, Compostela, Consolacion, or Mandaue.
- Below 4 packs, delivery fees are Liloan PHP 20, Compostela PHP 30, Consolacion PHP 30, and Mandaue PHP 50.
- Other listed Cebu area fees: Cebu City PHP 60, Talisay PHP 80, Minglanilla PHP 100, Naga PHP 120, Danao PHP 50, Carmen PHP 80, Catmon PHP 120.

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
