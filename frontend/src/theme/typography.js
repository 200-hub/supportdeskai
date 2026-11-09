// One family: Schibsted Grotesk. On Android a custom font's weight comes from
// its file, not fontWeight, so every role names its own fontFamily.
// Spread a role into a style: `title: { ...TYPE.title, color: COLORS.ink }`.

export const FONTS = {
  regular: 'SchibstedGrotesk_400Regular',
  medium: 'SchibstedGrotesk_500Medium',
  semibold: 'SchibstedGrotesk_600SemiBold',
  bold: 'SchibstedGrotesk_700Bold',
  black: 'SchibstedGrotesk_800ExtraBold',
};

// Material 3 roles, ~1.2 step ratio.
export const TYPE = {
  display: { fontFamily: FONTS.black, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  headline: { fontFamily: FONTS.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  title: { fontFamily: FONTS.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  titleSmall: { fontFamily: FONTS.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  body: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: FONTS.medium, fontSize: 15, lineHeight: 22 },
  bodySmall: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: FONTS.semibold, fontSize: 13, lineHeight: 16 },
  labelSmall: { fontFamily: FONTS.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.1 },
  // Ticket numbers, times, counts. No tabular-nums: this face widens punctuation with it.
  numeric: { fontFamily: FONTS.semibold, fontSize: 13, lineHeight: 16 },
};
