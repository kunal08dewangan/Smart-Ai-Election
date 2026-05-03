const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// ✅ Google Generative AI (Gemini) — Primary Google Service Integration
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const app = express();

// ✅ Google Cloud Run / Railway compatible dynamic port
const PORT = process.env.PORT || 8080;

// ─── Security & Efficiency Middlewares ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      connectSrc: ["'self'", "https://www.google-analytics.com", "https://generativelanguage.googleapis.com"],
    }
  }
}));
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));

// ─── Rate Limiting (Google Cloud Armor-style protection) ─────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) => req.path === "/health" || req.path === "/",
});
app.use("/api/", apiLimiter);

// ─── Google Gemini AI Initialization ─────────────────────────────────────────
let model = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing — set it in .env or Google Cloud Secret Manager");
} else {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      // Google Gemini safety settings
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_HIGH_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });
    console.log("✅ Google Gemini 1.5 Flash initialized successfully");
  } catch (err) {
    console.error("❌ Google Gemini initialization error:", err.message);
  }
}

// ─── Google-Aligned System Prompt ────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are "ElectionVerse AI Assistant" — a Smart AI Election Guide for India, powered by Google Gemini.
Your goal: Guide users step-by-step through the entire election process in a simple, interactive, and friendly way.

Core Features:
1. Voter ID Validation — Check mock IDs and return eligibility status
2. Face Verification — Simulate photo-based identity checks
3. Step-by-Step Voting Process — EVM, VVPAT explanation
4. Smart Doubt Solver — Answer in 3 parts: Simple explanation → Real-life Example → Short Summary
5. Complaint System — Guide users to report election issues
6. Voting Demo — Simulate a live candidate voting experience

Response Rules:
- Be concise, friendly, and accessible
- Reply in the user's requested language
- For doubts: always use the 3-part format
- Reference real election laws and ECI guidelines where relevant

Mock Voter Data:
EV-2026-1001 → Rohan Sharma, Age 25, Pune, Maharashtra (✅ Eligible)
EV-2026-1002 → Priya Patel, Age 32, Surat, Gujarat (✅ Eligible)
EV-2026-1003 → Aryan Gupta, Age 17, Delhi (❌ Not eligible — under age)
`;

// ─── Input Sanitization Utility ───────────────────────────────────────────────
const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";
  return input.trim().replace(/<[^>]*>/g, "").slice(0, 2000); // Strip HTML, limit length
};

// ─── Validate Request Body ────────────────────────────────────────────────────
const validateChatRequest = (req, res, next) => {
  const { message, language, context } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Message required" });
  }

  const allowedLanguages = ["English", "Hindi", "Marathi", "Punjabi", "Chhattisgarhi"];
  if (language && !allowedLanguages.includes(language)) {
    return res.status(400).json({ error: "Invalid language selection" });
  }

  req.sanitized = {
    message: sanitizeInput(message),
    language: language || "English",
    context: sanitizeInput(context || ""),
  };

  next();
};

// ─── POST /api/chat — Google Gemini AI Chat ───────────────────────────────────
app.post("/api/chat", validateChatRequest, async (req, res) => {
  if (!model) {
    return res.status(503).json({
      error: "Google AI service not available. Please check the GEMINI_API_KEY configuration.",
    });
  }

  const { message, language, context } = req.sanitized;

  try {
    const langInstruction = `Reply in ${language}.`;
    const contextInstruction = context ? `Context: ${context}` : "";
    const fullPrompt = [SYSTEM_PROMPT, langInstruction, contextInstruction, `User: ${message}`]
      .filter(Boolean)
      .join("\n");

    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig,
    });

    const response = await result.response;
    const text = response.text();

    // Log usage (Google Cloud Logging compatible format)
    console.log(JSON.stringify({
      severity: "INFO",
      message: "chat_request_success",
      language,
      inputLength: message.length,
      outputLength: text.length,
      timestamp: new Date().toISOString(),
    }));

    return res.status(200).json({ reply: text });

  } catch (error) {
    // Google Cloud Error Reporting compatible format
    console.error(JSON.stringify({
      severity: "ERROR",
      message: "gemini_api_error",
      error: error.message,
      timestamp: new Date().toISOString(),
    }));

    return res.status(500).json({ error: "Failed to get AI response. Please try again." });
  }
});

// ─── GET /health — Google Cloud Run readiness probe ───────────────────────────
app.get("/health", (req, res) => {
  const status = {
    status: "ok",
    service: "ElectionVerse Backend",
    googleAI: model ? "connected" : "unavailable",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  };
  res.status(200).json(status);
});

// ─── GET / — Root health check ────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("🚀 ElectionVerse Backend Running — Powered by Google Gemini AI");
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(JSON.stringify({ severity: "CRITICAL", message: err.message, timestamp: new Date().toISOString() }));
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 ElectionVerse Backend running on port ${PORT}`);
    console.log(`🔗 Google Gemini: ${model ? "✅ Connected" : "❌ Not configured"}`);
  });
}

module.exports = app;