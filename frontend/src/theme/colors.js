// SupportDesk AI colour roles.
// World: an index-card file on a beige desk — manila card stock, violet
// rubber-stamp ink, one highlighter.
//   Porcelain Beige #F3E6D7  → ground (the desk)
//   Heather Purple  #9B7ED6  → stamp ink fills, icons, rules
//   Electric Lemon  #E4FF3B  → "act here": primary action + things that need you now
// Text never sits in Heather Purple (3.2:1); it uses violetInk (9.6:1).

export const COLORS = {
  // Surfaces
  ground: '#F3E6D7', // Porcelain Beige
  groundDeep: '#E9D8C4', // second neutral layer: pressed rows, disabled fills, panels
  paper: '#FFFAF3', // index-card stock: cards, sheets, inputs, bars

  // Ink
  ink: '#1F1A2B', // body + headings (15:1 on lemon, 15:1 on paper)
  inkMuted: '#5F566B', // secondary text (6.6:1 paper, 5.6:1 ground)
  inkFaint: '#766C80', // placeholders, meta (4.6:1 paper)
  onDark: '#FFFAF3', // text on violetInk / ink fills

  // Rules
  rule: '#E4D3BF', // hairlines on paper and ground
  ruleStrong: '#CDB79E', // input outlines at rest

  // Brand
  violet: '#9B7ED6', // Heather Purple — fills, icons, focus rings (not text)
  violetInk: '#4A3290', // stamp ink — links, selected labels, tonal buttons
  violetWash: '#E8DFF7', // selected backgrounds, nav indicator
  lemon: '#E4FF3B', // Electric Lemon — primary action, attention
  lemonWash: '#F5FFC4', // soft attention background
  lemonInk: '#3F4700', // text on lemonWash

  // Pressed states
  lemonPressed: '#D2EC2A',
  violetWashPressed: '#DACDF2',
  paperPressed: '#F8EFE3',
  errorPressed: '#97201A',

  // State
  success: '#23613F',
  successWash: '#DCEBD9',
  warning: '#8A5A00',
  warningWash: '#F8E7C2',
  error: '#B3261E',
  errorWash: '#F6DAD5',

  status: {
    open: { bg: '#E8DFF7', text: '#4A3290', border: '#CFC0EE' },
    pending: { bg: '#F8E7C2', text: '#8A5A00', border: '#EBCB8B' },
    resolved: { bg: '#DCEBD9', text: '#23613F', border: '#B5D3B0' },
    closed: { bg: '#E9D8C4', text: '#5F566B', border: '#CDB79E' },
  },

  priority: {
    urgent: { bg: '#F6DAD5', text: '#9C2A1C', dot: '#B3261E' },
    high: { bg: '#F5DFC9', text: '#8A4310', dot: '#C2621B' },
    medium: { bg: '#E8DFF7', text: '#4A3290', dot: '#9B7ED6' },
    low: { bg: '#E9D8C4', text: '#5F566B', dot: '#8A7E73' },
  },

  channel: {
    email: { bg: '#E8DFF7', text: '#4A3290', label: 'Email' },
    whatsapp: { bg: '#DCEBD9', text: '#23613F', label: 'WhatsApp' },
    chat: { bg: '#F5FFC4', text: '#3F4700', label: 'Live chat' },
    web: { bg: '#E9D8C4', text: '#1F1A2B', label: 'Web form' },
  },

  // Internal note: a lemon slip clipped to the ticket
  internalNote: { bg: '#F5FFC4', border: '#D3E46A', text: '#3F4700' },

  // AI provenance
  ai: { bg: '#E8DFF7', text: '#4A3290', border: '#CFC0EE' },
};
