const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ================================
// CONFIG
// ================================

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Phục vụ tĩnh các tệp trong thư mục (index.html, css, js...)
app.use(express.static(path.join(__dirname)));

// ================================
// HEALTH CHECK
// ================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    app: "KAISOUL TOOL",
    status: "online"
  });
});

// ================================
// GEMINI CHAT (KẾT NỐI THẬT)
// ================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY chưa được cấu hình trên server."
      });
    }

    // Xử lý lịch sử trò chuyện đúng định dạng của @google/genai
    const formattedHistory = history.map((item) => ({
      role: item.role === "user" ? "user" : "model",
      parts: [{ text: item.text || item.message || "" }]
    }));

    // Khởi tạo phiên Chat với model gemini-2.5-flash
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: formattedHistory
    });

    const result = await chat.sendMessage({ message });

    return res.json({
      success: true,
      reply: result.text
    });

  } catch (error) {
    console.error("KAISOUL API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Lỗi kết nối Gemini API: " + error.message
    });
  }
});

// ================================
// FALLBACK ROUTE (CÚ PHÁP CHUẨN EXPRESS V5)
// ================================

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ================================
// START SERVER
// ================================

app.listen(PORT, () => {
  console.log("=================================");
  console.log("       KAISOUL TOOL");
  console.log("=================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log("Backend: ONLINE (Gemini Ready)");
  console.log("=================================");
});
