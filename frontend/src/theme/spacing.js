// 4dp grid.
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  xs: 3, // stamps
  sm: 6, // badges
  md: 10, // inputs, buttons
  lg: 12, // cards
  xl: 16, // sheets
  full: 9999, // chips, nav indicator
};

// Elevation is declared once per element: a hairline border OR a shadow.
export const ELEVATION = {
  raised: {
    shadowColor: '#3A2A12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const TOUCH = 48; // minimum target, dp
