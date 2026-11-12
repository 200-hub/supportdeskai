# Screen redesign brief: SupportDesk AI (shared by all screen agents)

You are restyling screens of an Expo / React Native app (`frontend/`) into a new visual system that has already been built. The theme and shared components are finished. Your job is to make your screens look like they belong to that system, with full commitment and production quality. Do not polish the old navy/teal look.

## Read first
- `frontend/src/theme/colors.js`, `typography.js`, `spacing.js`: the only source of colour, type and spacing.
- `frontend/src/components/common/*.js` and `frontend/src/components/tickets/TicketCard.js`: reuse these. `SlaStamp` is the signature element; use it wherever an SLA, due time or breach is shown.
- `.impeccable/surfaces/frontend-app-js.md`: the direction contract.
- `PRODUCT.md`: who uses each screen.

## The world
A well-kept index-card file on a beige desk. Ground `COLORS.ground` (Porcelain Beige) is every screen's background. Content sits on `COLORS.paper` card stock with 1px `COLORS.rule` hairlines. Violet stamp ink: `COLORS.violetInk` for text, links and selected states; `COLORS.violet` (Heather Purple) only for fills, icons, rules and focus, NEVER text (3.2:1). One highlighter, `COLORS.lemon` (Electric Lemon), has one job: "act here". That means the primary action (`AppButton variant="primary"`, at most one per screen) and counts or flags of things waiting on the user. Never use lemon as decoration.

## Hard rules
1. `TYPOGRAPHY` no longer exists; importing it crashes the app. Every `<Text>` style must spread a `TYPE` role (`TYPE.headline`, `TYPE.title`, `TYPE.titleSmall`, `TYPE.body`, `TYPE.bodyStrong`, `TYPE.bodySmall`, `TYPE.label`, `TYPE.labelSmall`, `TYPE.numeric`, `TYPE.display`). The role carries the font family; on Android, fontWeight does not switch custom fonts, so do not set `fontWeight`. Use `TYPE.numeric` for ids, times and counts.
2. No hex or rgba literals in screen files. Colours come only from `COLORS.*`. If a role is missing, use the closest one; don't add new colours.
3. `AppButton` variants are `primary` (lemon), `tonal`, `outline`, `ghost` and `danger`. The old `teal`/`secondary` no longer exist: map them to `tonal`, or to `primary` if it truly is the screen's main action.
4. `ScreenHeader` is now a light Material top app bar; its `theme` prop is ignored. Remove navy hero banners and coloured header blocks. Screen titles are `TYPE.headline` or the ScreenHeader title.
5. Keep every behaviour: props, state, handlers, service calls, navigation callbacks and data. This is a visual and UX-copy pass, not a logic rewrite. If you find a real functional bug inside your screens (wrong prop, broken handler, crash path), fix it and list it in your report. Do NOT edit `frontend/src/services/**`, `App.js`, theme or components; other agents own those. If a shared component is missing something, report it.
6. Platform quality: touch targets ≥48dp (`TOUCH` from spacing); `Pressable` with `accessibilityRole` and `accessibilityLabel` on every custom tappable; icons from `@expo/vector-icons` Ionicons, never emoji; respect the safe area the way the screen already does.

## Refuse (these read as AI-generated)
Gradients; glass/blur; ALL-CAPS or tracked-out labels; eyebrow/kicker labels above headings; icons in tinted circles or tiles; the hero-metric template (big number + small label + stats + accent); identical icon+title+text card grids; cards inside cards; coloured left/right borders thicker than 1px; a shadow together with a border on the same element; "→" in button text; meta strings joined with " · "; numbered 01/02/03 markers unless the content really is a sequence; decorative motion.

## Do
- Lists of settings, notifications, articles and conversations: rows inside one paper sheet with hairline separators, not a stack of cards. Tickets use `TicketCard`.
- Filters: a horizontal row of chips (paper with a `rule` border; selected = `violetWash` background with `violetInk` text).
- Hierarchy through size and weight, with more space above a section heading than below it (e.g. 32 above, 12 below). 16dp screen gutters. 4dp grid.
- Section headings: `TYPE.titleSmall` in `COLORS.ink`, sentence case, no labels above them.
- Copy: plain, sentence case, buttons name their action ("Create ticket", not "Submit"). Errors say what happened and how to fix it. Don't invent facts or numbers. Existing mock numbers stay, and analytics or dashboard figures that come from `mockData` get a quiet "Demo data" note.
- Empty states via `EmptyState`, with a next action.

## Self-check before reporting
Run `grep -nE "TYPOGRAPHY|#[0-9A-Fa-f]{3,8}\b|rgba\(|fontWeight|variant=\"(teal|secondary)\"|TouchableOpacity" <your files>`. It must return nothing, except `TouchableOpacity` where removing it would change behaviour. Then run `cd frontend && node -e "require('@babel/parser').parse(require('fs').readFileSync('<file>','utf8'),{sourceType:'module',plugins:['jsx']})"` on each file to confirm it parses.

## Report (under 200 words)
Files changed; functional bugs fixed (file:line, cause); anything you needed from shared components; deliberate deviations.
