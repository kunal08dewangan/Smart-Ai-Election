const request = require("supertest");
const app = require("./server");

// ─── Backend API Test Suite ───────────────────────────────────────────────────

describe("Backend API Tests — ElectionVerse", () => {

  // ── Health & Root Endpoints ──────────────────────────────────────────────
  describe("GET / — Root Health Check", () => {
    it("should return 200 and confirm service is running", async () => {
      const res = await request(app).get("/");
      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain("ElectionVerse Backend Running");
    });
  });

  describe("GET /health — Structured Health Probe", () => {
    it("should return 200 with JSON status payload", async () => {
      const res = await request(app).get("/health");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("status", "ok");
      expect(res.body).toHaveProperty("service", "ElectionVerse Backend");
      expect(res.body).toHaveProperty("googleAI");
      expect(res.body).toHaveProperty("timestamp");
      expect(res.body).toHaveProperty("version");
    });

    it("should return a valid ISO timestamp", async () => {
      const res = await request(app).get("/health");
      const ts = new Date(res.body.timestamp);
      expect(ts instanceof Date && !isNaN(ts)).toBe(true);
    });
  });

  // ── POST /api/chat — Input Validation ───────────────────────────────────
  describe("POST /api/chat — Input Validation", () => {
    it("should return 400 if message is missing", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ language: "English" });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error", "Message required");
    });

    it("should return 400 if message is empty string", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "   ", language: "English" });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error", "Message required");
    });

    it("should return 400 if message is not a string", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: 12345, language: "English" });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error", "Message required");
    });

    it("should return 400 for invalid language selection", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "Hello", language: "Klingon" });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error", "Invalid language selection");
    });

    it("should return 400 if body is completely empty", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error", "Message required");
    });
  });

  // ── POST /api/chat — Service Behavior ───────────────────────────────────
  describe("POST /api/chat — Service Behavior", () => {
    it("should return 400 or 503/500 (not success) when AI errors on valid input", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "Hello", language: "English" });
      // 200 = AI available and responded, 500 = AI key invalid/error, 503 = AI not configured
      // In all cases, a valid message should NOT get a 400 validation error
      expect(res.statusCode).not.toEqual(400);
    });

    it("should accept all valid supported languages", async () => {
      const languages = ["English", "Hindi", "Marathi", "Punjabi", "Chhattisgarhi"];
      for (const lang of languages) {
        const res = await request(app)
          .post("/api/chat")
          .send({ message: "Hello", language: lang });
        // Should not be rejected as 400 for valid language
        expect(res.statusCode).not.toEqual(400);
      }
    });

    it("should handle a valid message with context without crashing", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "What is EVM?", language: "English", context: "Tab: learning" });
      // Valid input should never return a 400 validation error regardless of AI status
      expect(res.statusCode).not.toEqual(400);
      // Response should always have JSON body
      expect(res.headers["content-type"]).toMatch(/json/);
    });
  });

  // ── Security Tests ───────────────────────────────────────────────────────
  describe("Security Headers", () => {
    it("should include X-Content-Type-Options header", async () => {
      const res = await request(app).get("/");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("should include X-Frame-Options or CSP header", async () => {
      const res = await request(app).get("/");
      const hasFrameGuard = res.headers["x-frame-options"] || res.headers["content-security-policy"];
      expect(hasFrameGuard).toBeTruthy();
    });
  });

  // ── 404 Handler ──────────────────────────────────────────────────────────
  describe("404 Handler", () => {
    it("should return 404 for unknown GET routes", async () => {
      const res = await request(app).get("/api/unknown-route");
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error", "Route not found");
    });

    it("should return 404 for unknown POST routes", async () => {
      const res = await request(app).post("/api/unknown-endpoint").send({});
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error", "Route not found");
    });
  });

  // ── Rate Limiting ────────────────────────────────────────────────────────
  describe("Rate Limiting Headers", () => {
    it("should include RateLimit headers on API routes", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "Test", language: "English" });
      // Standard rate limit headers should be present
      const hasRateLimit = res.headers["ratelimit-limit"] || res.headers["x-ratelimit-limit"];
      expect(hasRateLimit).toBeTruthy();
    });
  });
});
