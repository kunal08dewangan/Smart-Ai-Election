import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// ─── Global Mocks ─────────────────────────────────────────────────────────────

// Mock lazy-loaded components so tests don't need dynamic import resolution
vi.mock('./components/ChatAssistant', () => ({
  default: ({ role, currentTab }) => (
    <div data-testid="chat-assistant" data-role={role} data-tab={currentTab}>
      Mock Chat
    </div>
  ),
}));

vi.mock('./components/LearningJourney', () => ({
  default: ({ role }) => (
    <div data-testid="learning-journey" data-role={role}>
      Mock Learning
    </div>
  ),
}));

vi.mock('./components/SimulationMode', () => ({
  default: () => <div data-testid="simulation-mode">Mock Simulation</div>,
}));

// Mock window.gtag for Google Analytics tracking tests
const mockGtag = vi.fn();
Object.defineProperty(window, 'gtag', { value: mockGtag, writable: true });

// ─── App Component Tests ──────────────────────────────────────────────────────

describe('App Component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────
  describe('Initial Rendering', () => {
    it('renders the header with ElectionVerse branding', () => {
      render(<App />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText(/ElectionVerse/i)).toBeInTheDocument();
    });

    it('renders the role selector dropdown', () => {
      render(<App />);
      const select = screen.getByRole('combobox', { name: /Select User Role/i });
      expect(select).toBeInTheDocument();
    });

    it('renders the tab navigation', () => {
      render(<App />);
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Learning Journey/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Voting Simulation/i })).toBeInTheDocument();
    });

    it('renders the chat assistant section', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByTestId('chat-assistant')).toBeInTheDocument();
      });
    });

    it('renders the Learning Journey by default', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByTestId('learning-journey')).toBeInTheDocument();
      });
    });

    it('renders skip navigation link for accessibility', () => {
      render(<App />);
      expect(screen.getByText(/skip to main content/i)).toBeInTheDocument();
    });
  });

  // ── Role Selection ─────────────────────────────────────────────────────
  describe('Role Selector', () => {
    it('defaults to First-Time Voter role', () => {
      render(<App />);
      const select = screen.getByRole('combobox', { name: /Select User Role/i });
      expect(select.value).toBe('First-Time Voter');
    });

    it('includes all three role options', () => {
      render(<App />);
      const select = screen.getByRole('combobox', { name: /Select User Role/i });
      const options = within(select).getAllByRole('option');
      const values = options.map((o) => o.value);
      expect(values).toContain('First-Time Voter');
      expect(values).toContain('Election Officer');
      expect(values).toContain('Candidate');
    });

    it('passes updated role to child components', async () => {
      render(<App />);
      const select = screen.getByRole('combobox', { name: /Select User Role/i });
      fireEvent.change(select, { target: { value: 'Election Officer' } });

      await waitFor(() => {
        const assistant = screen.getByTestId('chat-assistant');
        expect(assistant.getAttribute('data-role')).toBe('Election Officer');
      });
    });

    it('fires Google Analytics event on role change', () => {
      render(<App />);
      const select = screen.getByRole('combobox', { name: /Select User Role/i });
      fireEvent.change(select, { target: { value: 'Candidate' } });
      expect(mockGtag).toHaveBeenCalledWith('event', 'role_changed', { role: 'Candidate' });
    });
  });

  // ── Tab Navigation ─────────────────────────────────────────────────────
  describe('Tab Navigation', () => {
    it('Learning Journey tab is selected by default', () => {
      render(<App />);
      const tab = screen.getByRole('tab', { name: /Learning Journey/i });
      expect(tab.getAttribute('aria-selected')).toBe('true');
    });

    it('switches to Voting Simulation on tab click', async () => {
      render(<App />);
      const simTab = screen.getByRole('tab', { name: /Voting Simulation/i });
      fireEvent.click(simTab);

      await waitFor(() => {
        expect(screen.getByTestId('simulation-mode')).toBeInTheDocument();
      });
    });

    it('Simulation tab becomes aria-selected after click', () => {
      render(<App />);
      const simTab = screen.getByRole('tab', { name: /Voting Simulation/i });
      fireEvent.click(simTab);
      expect(simTab.getAttribute('aria-selected')).toBe('true');
    });

    it('Learning Journey tab loses aria-selected after switching', () => {
      render(<App />);
      const learningTab  = screen.getByRole('tab', { name: /Learning Journey/i });
      const simulationTab = screen.getByRole('tab', { name: /Voting Simulation/i });
      fireEvent.click(simulationTab);
      expect(learningTab.getAttribute('aria-selected')).toBe('false');
    });

    it('fires Google Analytics event on tab change', () => {
      render(<App />);
      const simTab = screen.getByRole('tab', { name: /Voting Simulation/i });
      fireEvent.click(simTab);
      expect(mockGtag).toHaveBeenCalledWith('event', 'tab_changed', { tab_name: 'simulation' });
    });

    it('can switch back to Learning Journey from Simulation', async () => {
      render(<App />);
      const simTab      = screen.getByRole('tab', { name: /Voting Simulation/i });
      const learningTab = screen.getByRole('tab', { name: /Learning Journey/i });

      fireEvent.click(simTab);
      fireEvent.click(learningTab);

      await waitFor(() => {
        expect(screen.getByTestId('learning-journey')).toBeInTheDocument();
      });
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────
  describe('Accessibility', () => {
    it('has a single h1 heading', () => {
      render(<App />);
      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(1);
    });

    it('main content section has role="main"', () => {
      render(<App />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('header has role="banner"', () => {
      render(<App />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('tab panel has role="tabpanel"', () => {
      render(<App />);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('tabpanel is labelled by active tab', () => {
      render(<App />);
      const panel = screen.getByRole('tabpanel');
      const labelledBy = panel.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
    });
  });

  // ── Google Analytics ───────────────────────────────────────────────────
  describe('Google Analytics Integration', () => {
    it('fires page_view event on mount', () => {
      render(<App />);
      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({
        page_title: 'ElectionVerse',
      }));
    });
  });
});
