import React, { useEffect, useRef, useState, useCallback, memo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = "https://election-ai-assistant-production.up.railway.app/api/chat";

const SUPPORTED_LANGUAGES = [
  { value: "English",       label: "English",               gtCode: "en" },
  { value: "Hindi",         label: "हिंदी (Hindi)",          gtCode: "hi" },
  { value: "Marathi",       label: "मराठी (Marathi)",        gtCode: "mr" },
  { value: "Punjabi",       label: "ਪੰਜਾਬੀ (Punjabi)",       gtCode: "pa" },
  { value: "Chhattisgarhi", label: "छत्तीसगढ़ी (CG)",        gtCode: "hi" },
];

const INITIAL_BOT_MESSAGE = {
  sender: "bot",
  text: "Please choose your language / कृपया भाषा चुनें:\n1. English\n2. हिंदी\n3. Marathi\n4. Punjabi\n5. Chhattisgarhi",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

// Offline fallback responses — covers all main user intents
const OFFLINE_RESPONSES = {
  "voter id":   "Apna Voter ID enter karein (e.g. EV-2026-1001)",
  "ev-1001":    "Name: Rohan Sharma | Age: 25 | Area: Pune\n✅ Aap vote dene ke liye eligible hain",
  "ev-1002":    "Name: Priya Patel | Age: 32 | Area: Surat\n✅ Aap vote dene ke liye eligible hain",
  "ev-1003":    "Name: Aryan Gupta | Age: 17 | Area: Delhi\n❌ Eligible nahi hain — under age",
  "details":    "Aapki details:\nName: Rohan Sharma | Age: 25 | Area: Pune\nKya aap ise correct karna chahte hain? (Yes/No)",
  "process":    "Voting Process:\n1. Polling booth par jana\n2. Voter ID dikhana\n3. Finger par ink lagana\n4. EVM machine par vote dena\n5. VVPAT slip verify karna\n\nKya samajh aaya? (Yes/No)",
  "yes":        "Bahut badhiya! 😊 Aur kuch janna chahte hain?",
  "no":         "Aasan shabdo mein: Booth → ID → Ink → Button → Slip check. Clear?",
  "doubt":      "Aapka kya sawal hai? (e.g. 'Vote kab de sakte hain?')",
  "kab":        "→ Age 18+ hona chahiye\n→ Example: 2006 born → 2024 eligible\n→ Summary: 18 saal ke baad vote de sakte hain",
  "complaint":  "Aapko kya problem aa rahi hai?\n- Naam voter list mein nahi\n- Galat details\n- Booth nahi mil raha",
  "naam":       "Solution: nvsp.in par Form 6 bharein. Next: Online portal par jaayein.",
  "demo":       "Voting Demo:\n🔘 Candidate A (Development Party)\n🔘 Candidate B (Progress Party)\n(Type 'Vote A' or 'Vote B')",
  "vote a":     "✅ Candidate A ko aapka vote successfully cast ho gaya!",
  "vote b":     "✅ Candidate B ko aapka vote successfully cast ho gaya!",
};

const getOfflineReply = (input) => {
  const lower = input.toLowerCase();
  for (const [key, reply] of Object.entries(OFFLINE_RESPONSES)) {
    if (lower.includes(key)) return reply;
  }
  return "Main samajh nahi paaya. Kya aap apna sawal alag tarike se puch sakte hain?";
};

// ─── Google Text-to-Speech Utility ───────────────────────────────────────────
const LANG_CODES = { Hindi: "hi-IN", Marathi: "mr-IN", Punjabi: "pa-IN" };

const speakText = (text, langStr, voiceEnabled) => {
  if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_CODES[langStr] || "en-IN";
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <div style={styles.typingWrapper} role="status" aria-label="AI is typing">
    <div style={styles.typingIndicator} aria-hidden="true">
      {["dot-1", "dot-2", "dot-3"].map((cls) => (
        <span key={cls} style={styles.typingDot} className={cls} />
      ))}
    </div>
  </div>
);

const MessageBubble = memo(({ msg }) => (
  <div
    style={{
      ...styles.messageWrapper,
      alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
    }}
  >
    <div
      role={msg.sender === "bot" ? "article" : undefined}
      aria-label={msg.sender === "bot" ? "AI response" : "Your message"}
      style={{
        ...styles.message,
        background:
          msg.sender === "user"
            ? "linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)"
            : "rgba(0, 180, 219, 0.15)",
        color: "white",
        borderBottomRightRadius: msg.sender === "user" ? "4px" : "16px",
        borderBottomLeftRadius:  msg.sender === "user" ? "16px" : "4px",
        border:     msg.sender === "bot" ? "1px solid rgba(0, 180, 219, 0.3)" : "none",
        boxShadow:  msg.sender === "user" ? "0 4px 15px rgba(0, 180, 219, 0.3)" : "none",
        whiteSpace: "pre-line",
      }}
    >
      <div style={styles.messageText}>{msg.text}</div>
      <time
        style={styles.time}
        dateTime={msg.isoTime || msg.time}
        aria-label={`Sent at ${msg.time}`}
      >
        {msg.time}
      </time>
    </div>
  </div>
));
MessageBubble.displayName = "MessageBubble";

// ─── Main Component ───────────────────────────────────────────────────────────
function ChatAssistant({ role, currentTab }) {
  const [message, setMessage]       = useState("");
  const [chat, setChat]             = useState([INITIAL_BOT_MESSAGE]);
  const [loading, setLoading]       = useState(false);
  const [language, setLanguage]     = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const chatEndRef  = useRef(null);
  const inputRef    = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ─── Language Selection ─────────────────────────────────────────────────
  const handleLanguageSelect = useCallback((selectedLang) => {
    setLanguage(selectedLang);

    // Inject Google Translate widget for selected language
    const gtCode = SUPPORTED_LANGUAGES.find((l) => l.value === selectedLang)?.gtCode;
    if (gtCode && gtCode !== "en" && typeof window !== "undefined" && window.google?.translate) {
      try {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", includedLanguages: gtCode, autoDisplay: false },
          "google-translate-element"
        );
      } catch (_) {
        // Translate widget optional — gracefully degrade
      }
    }

    const greetingMsg =
      "Hello! 👋\nMain aapki kya help kar sakta hoon?\n\n" +
      "1. 🪪 Voter ID check karna\n" +
      "2. 📋 Voter details dekhna\n" +
      "3. 🗳️ Voting process samajhna\n" +
      "4. ❓ Sawal / Doubt puchna\n" +
      "5. 🚨 Complaint karna\n" +
      "6. 🎥 Voting demo dekhna";

    setChat((prev) => [
      ...prev,
      {
        sender: "user",
        text: selectedLang,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        sender: "bot",
        text: greetingMsg,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    speakText(greetingMsg, selectedLang, voiceEnabled);
  }, [voiceEnabled]);

  // ─── Send Message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async (customMsg = null) => {
    const textToSend = customMsg || message;
    if (!textToSend.trim()) return;

    if (!language) {
      const input = textToSend.toLowerCase();
      if (input.includes("hindi")         || input === "2") return handleLanguageSelect("Hindi");
      if (input.includes("marathi")       || input === "3") return handleLanguageSelect("Marathi");
      if (input.includes("punjabi")       || input === "4") return handleLanguageSelect("Punjabi");
      if (input.includes("chhattisgarhi") || input === "5") return handleLanguageSelect("Chhattisgarhi");
      return handleLanguageSelect("English");
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg = { sender: "user", text: textToSend, time: timeStr, isoTime: now.toISOString() };
    const newChat = [...chat, userMsg];

    setChat(newChat);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          language,
          context: `Role: Smart AI Election Assistant for India. Tab: ${currentTab}.`,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const botReply = data.reply || data.error || "Sorry, I could not understand that.";

      const botMsg = {
        sender: "bot",
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChat([...newChat, botMsg]);
      speakText(botReply, language, voiceEnabled);

    } catch (err) {
      const fallback = getOfflineReply(textToSend);
      const offlineMsg = {
        sender: "bot",
        text: `🤖 Offline Mode:\n${fallback}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChat([...newChat, offlineMsg]);
      speakText(`Offline Mode: ${fallback}`, language, voiceEnabled);
    }

    setLoading(false);
    inputRef.current?.focus();
  }, [message, language, chat, currentTab, voiceEnabled, handleLanguageSelect]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) window.speechSynthesis?.cancel();
      return !prev;
    });
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <section
      id="chat-assistant"
      aria-label="ElectionVerse AI Chat Assistant"
      style={styles.container}
    >
      {/* Hidden Google Translate element for language support */}
      <div id="google-translate-element" aria-hidden="true" style={{ display: "none" }} />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.headerTitle}>
          <span role="img" aria-label="AI robot icon">🤖</span> ElectionVerse AI
          <span style={{ fontSize: "10px", opacity: 0.6, marginLeft: "6px" }}>
            Powered by Google Gemini
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            id="voice-toggle-btn"
            onClick={toggleVoice}
            aria-pressed={voiceEnabled}
            aria-label={voiceEnabled ? "Disable voice output" : "Enable voice output"}
            style={{
              ...styles.languageSelect,
              padding: "4px 8px",
              background: voiceEnabled ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color:      voiceEnabled ? "#4ade80" : "#f87171",
              border:     "none",
              cursor:     "pointer",
            }}
          >
            {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
          </button>

          <label htmlFor="language-select" className="sr-only">Select Language</label>
          <select
            id="language-select"
            value={language || "English"}
            onChange={(e) => {
              if (!language) handleLanguageSelect(e.target.value);
              else setLanguage(e.target.value);
            }}
            style={styles.languageSelect}
            aria-label="Select conversation language"
          >
            {SUPPORTED_LANGUAGES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </header>

      {/* ── Chat Area ──────────────────────────────────────────────── */}
      <div
        id="chat-log"
        style={styles.chatBox}
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Chat messages"
        tabIndex={0}
      >
        {chat.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={chatEndRef} aria-hidden="true" />
      </div>

      {/* ── Quick Action Chips ─────────────────────────────────────── */}
      {language && (
        <nav
          aria-label="Quick action shortcuts"
          style={styles.chipsContainer}
        >
          {[
            ["1. Voter ID Check",  "1. Voter ID check karna"],
            ["2. Details",         "2. Voter details dekhna"],
            ["3. Process",         "3. Voting process samajhna"],
            ["4. Doubt Solver",    "4. Sawal / Doubt puchna"],
            ["5. Complaints",      "5. Complaint karna"],
            ["6. Demo",            "6. Voting demo dekhna"],
          ].map(([label, msg]) => (
            <button
              key={label}
              id={`chip-${label.replace(/\W+/g, "-")}`}
              onClick={() => sendMessage(msg)}
              style={styles.chip}
              aria-label={`Quick action: ${label}`}
              disabled={loading}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {/* ── Input Area ─────────────────────────────────────────────── */}
      <div style={styles.inputContainer} role="form" aria-label="Message input">
        <div style={styles.inputWrapper}>
          <label htmlFor="chat-input" className="sr-only">Type your message</label>
          <input
            id="chat-input"
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language
                ? `Type your message in ${language}…`
                : "Type language name or 1/2/3…"
            }
            style={styles.input}
            aria-label="Chat message input"
            aria-describedby="send-btn"
            autoComplete="off"
            maxLength={500}
          />
          <button
            id="send-btn"
            onClick={() => sendMessage()}
            style={styles.button}
            disabled={loading || !message.trim()}
            aria-label="Send message"
            aria-busy={loading}
          >
            <svg
              aria-hidden="true"
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  container: {
    height: "100%",
    minHeight: "500px",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg, #0a192f 0%, #020c1b 100%)",
    color: "white",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0, 180, 219, 0.2)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    border: "1px solid rgba(0, 180, 219, 0.2)",
  },
  header: {
    padding: "16px 20px",
    background: "rgba(10, 25, 47, 0.8)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(0, 180, 219, 0.2)",
  },
  headerTitle: {
    fontWeight: "700",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(90deg, #00B4DB, #0083B0)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  languageSelect: {
    background: "rgba(255,255,255,0.1)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    outline: "none",
    cursor: "pointer",
    backdropFilter: "blur(5px)",
  },
  chatBox: {
    flex: 1,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowY: "auto",
    scrollBehavior: "smooth",
  },
  messageWrapper: {
    maxWidth: "80%",
    display: "flex",
    flexDirection: "column",
  },
  message: {
    padding: "12px 16px",
    borderRadius: "16px",
    position: "relative",
    lineHeight: "1.5",
    fontSize: "15px",
  },
  messageText: { wordBreak: "break-word" },
  time: {
    fontSize: "10px",
    opacity: 0.7,
    marginTop: "6px",
    textAlign: "right",
    display: "block",
  },
  typingWrapper: {
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.1)",
    padding: "12px 16px",
    borderRadius: "16px",
    borderBottomLeftRadius: "4px",
    width: "fit-content",
  },
  typingIndicator: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    height: "20px",
  },
  typingDot: {
    width: "6px",
    height: "6px",
    background: "#00B4DB",
    borderRadius: "50%",
    animation: "typing 1.4s infinite ease-in-out both",
    display: "inline-block",
  },
  chipsContainer: {
    display: "flex",
    gap: "8px",
    padding: "0 20px 10px 20px",
    overflowX: "auto",
    whiteSpace: "nowrap",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  chip: {
    background: "rgba(0, 180, 219, 0.15)",
    border: "1px solid rgba(0, 180, 219, 0.4)",
    color: "#00B4DB",
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 0.2s",
  },
  inputContainer: {
    padding: "16px 20px",
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "rgba(0, 180, 219, 0.1)",
    border: "1px solid rgba(0, 180, 219, 0.3)",
    borderRadius: "24px",
    padding: "4px 4px 4px 16px",
    transition: "border-color 0.3s",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "15px",
    outline: "none",
    padding: "8px 0",
  },
  button: {
    background: "linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform 0.2s, opacity 0.2s, boxShadow 0.2s",
    flexShrink: 0,
    boxShadow: "0 4px 15px rgba(0, 180, 219, 0.4)",
  },
};

// ─── Inject Global Keyframe Styles ────────────────────────────────────────────
const GLOBAL_STYLES = `
@keyframes typing {
  0%, 80%, 100% { transform: translateY(0); }
  40%           { transform: translateY(-5px); }
}
.dot-1 { animation-delay: 0s; }
.dot-2 { animation-delay: 0.2s; }
.dot-3 { animation-delay: 0.4s; }
@keyframes spin { to { transform: rotate(360deg); } }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0;
  margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
`;

if (typeof document !== "undefined" && !document.getElementById("chat-assistant-styles")) {
  const style = document.createElement("style");
  style.id = "chat-assistant-styles";
  style.textContent = GLOBAL_STYLES;
  document.head.appendChild(style);
}

export default memo(ChatAssistant);