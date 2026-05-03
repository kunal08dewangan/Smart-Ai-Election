// src/test-setup.js
// ─── Global test setup for Vitest + React Testing Library ────────────────────
import '@testing-library/jest-dom';

// Mock window.matchMedia (not implemented in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock SpeechSynthesis (not implemented in jsdom)
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: () => {},
    cancel: () => {},
    getVoices: () => [],
    pause: () => {},
    resume: () => {},
    pending: false,
    speaking: false,
    paused: false,
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = class {
  observe()    {}
  unobserve()  {}
  disconnect() {}
};

// Mock fetch globally for tests that don't override it
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ reply: "Mock AI response" }),
});
