import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { Vote, BookOpen, User, PlayCircle } from 'lucide-react';

// ─── Code Splitting — Lazy load heavy components for efficiency ───────────────
const ChatAssistant   = lazy(() => import('./components/ChatAssistant'));
const LearningJourney = lazy(() => import('./components/LearningJourney'));
const SimulationMode  = lazy(() => import('./components/SimulationMode'));

// ─── Google Analytics Event Tracking Utility ──────────────────────────────────
/**
 * Fires a Google Analytics 4 event if gtag is available.
 * @param {string} eventName - GA4 event name
 * @param {Object} params    - Additional event parameters
 */
const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = ['First-Time Voter', 'Election Officer', 'Candidate'];
const TABS  = { LEARNING: 'learning', SIMULATION: 'simulation' };

// ─── Loading Fallback ─────────────────────────────────────────────────────────
const LoadingFallback = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading content"
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '300px', color: '#00B4DB', fontSize: '1rem', gap: '12px'
    }}
  >
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
    Loading…
  </div>
);

// ─── Main App Component ───────────────────────────────────────────────────────
function App() {
  const [activeTab, setActiveTab] = useState(TABS.LEARNING);
  const [role, setRole]           = useState(ROLES[0]);

  // ── Track page view on mount (Google Analytics) ──────────────────────────
  useEffect(() => {
    trackEvent('page_view', {
      page_title: 'ElectionVerse',
      page_location: window.location.href,
    });
  }, []);

  const handleRoleChange = useCallback((newRole) => {
    setRole(newRole);
    trackEvent('role_changed', { role: newRole });
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    trackEvent('tab_changed', { tab_name: tab });
  }, []);

  return (
    <div className="app-container">
      {/* Skip navigation link for screen readers */}
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: 'absolute', top: '-40px', left: '0', zIndex: 9999,
          background: '#00B4DB', color: '#000', padding: '8px 16px',
          borderRadius: '0 0 8px 0', fontWeight: 'bold', textDecoration: 'none',
          transition: 'top 0.2s',
        }}
        onFocus={(e) => { e.target.style.top = '0'; }}
        onBlur={(e)  => { e.target.style.top = '-40px'; }}
      >
        Skip to main content
      </a>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="app-header glass-panel" role="banner">
        <div className="logo-container">
          <div className="logo-icon" aria-hidden="true"><Vote size={24} /></div>
          <h1>ElectionVerse</h1>
        </div>

        <nav aria-label="User role selector">
          <div className="role-selector">
            <User size={16} aria-hidden="true" />
            <label htmlFor="role-select" className="sr-only">Select User Role</label>
            <select
              id="role-select"
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="role-dropdown"
              aria-label="Select User Role"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </nav>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <main id="main-content" className="main-content" role="main">

        {/* Left: Content Section */}
        <section className="content-section" aria-label="Learning and simulation content">
          <nav className="tabs glass-panel" role="tablist" aria-label="Content tabs">
            <button
              id="tab-learning"
              role="tab"
              className={`tab-btn ${activeTab === TABS.LEARNING ? 'active' : ''}`}
              onClick={() => handleTabChange(TABS.LEARNING)}
              aria-selected={activeTab === TABS.LEARNING}
              aria-controls="panel-learning"
            >
              <BookOpen size={18} aria-hidden="true" /> Learning Journey
            </button>
            <button
              id="tab-simulation"
              role="tab"
              className={`tab-btn ${activeTab === TABS.SIMULATION ? 'active' : ''}`}
              onClick={() => handleTabChange(TABS.SIMULATION)}
              aria-selected={activeTab === TABS.SIMULATION}
              aria-controls="panel-simulation"
            >
              <PlayCircle size={18} aria-hidden="true" /> Voting Simulation
            </button>
          </nav>

          <div
            id={activeTab === TABS.LEARNING ? 'panel-learning' : 'panel-simulation'}
            role="tabpanel"
            aria-labelledby={activeTab === TABS.LEARNING ? 'tab-learning' : 'tab-simulation'}
            className="scrollable-content fade-in"
          >
            <Suspense fallback={<LoadingFallback />}>
              {activeTab === TABS.LEARNING
                ? <LearningJourney role={role} />
                : <SimulationMode />
              }
            </Suspense>
          </div>
        </section>

        {/* Right: AI Assistant */}
        <section className="assistant-section" aria-label="AI chat assistant">
          <Suspense fallback={<LoadingFallback />}>
            <ChatAssistant role={role} currentTab={activeTab} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}

export default App;
