// SupportDesk AI Design System Colors
// Strict solid-colour palette as specified:
// - Primary Navy: #14213D
// - Secondary Navy: #1F3155
// - Accent Teal: #16B8A6
// - Background: #F5F7FA
// - White: #FFFFFF
// - Main Text: #172033
// - Secondary Text: #697586
// - Border: #E2E8F0
// - Success: #16865C
// - Warning: #D97706
// - Error: #DC3545

export const COLORS = {
  primaryNavy: '#14213D',
  secondaryNavy: '#1F3155',
  accentTeal: '#16B8A6',
  background: '#F5F7FA',
  lightBg: '#F5F7FA',
  white: '#FFFFFF',
  card: '#FFFFFF',
  cardBackground: '#FFFFFF',
  mainText: '#172033',
  primaryText: '#172033',
  secondaryText: '#697586',
  border: '#E2E8F0',
  success: '#16865C',
  warning: '#D97706',
  error: '#DC3545',

  // Semantic Status Colors (Solid badges)
  status: {
    open: {
      bg: '#EBF4FF',
      text: '#1F3155',
      border: '#C7D2FE',
    },
    pending: {
      bg: '#FEF3C7',
      text: '#D97706',
      border: '#FDE68A',
    },
    resolved: {
      bg: '#E6F4EA',
      text: '#16865C',
      border: '#A7F3D0',
    },
    closed: {
      bg: '#F1F5F9',
      text: '#697586',
      border: '#E2E8F0',
    },
  },

  // Priority Colors
  priority: {
    urgent: {
      bg: '#FEE2E2',
      text: '#DC3545',
      dot: '#DC3545',
    },
    high: {
      bg: '#FFEDD5',
      text: '#C2410C',
      dot: '#EA580C',
    },
    medium: {
      bg: '#FEF9C3',
      text: '#D97706',
      dot: '#D97706',
    },
    low: {
      bg: '#F1F5F9',
      text: '#697586',
      dot: '#697586',
    },
  },

  // Channel Badges (Solid background + solid text)
  channel: {
    email: {
      bg: '#EFF6FF',
      text: '#1F3155',
      label: 'Email',
    },
    whatsapp: {
      bg: '#DCFCE7',
      text: '#16865C',
      label: 'WhatsApp',
    },
    chat: {
      bg: '#CCFBF1',
      text: '#0F766E',
      label: 'Live Chat',
    },
    web: {
      bg: '#F1F5F9',
      text: '#172033',
      label: 'Web Form',
    },
  },

  // Internal Collaboration Note
  internalNote: {
    bg: '#FEF3C7',
    border: '#D97706',
    text: '#92400E',
  },

  // AI Copilot Badge
  ai: {
    bg: '#E0F2FE',
    text: '#0369A1',
    border: '#BAE6FD',
  },
};
