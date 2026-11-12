---
name: SupportDesk AI
description: One ticket inbox for every support channel, kept like a well-ordered index-card file.
colors:
  ground: "#F3E6D7"
  ground-deep: "#E9D8C4"
  paper: "#FFFAF3"
  paper-pressed: "#F8EFE3"
  ink: "#1F1A2B"
  ink-muted: "#5F566B"
  ink-faint: "#766C80"
  on-dark: "#FFFAF3"
  rule: "#E4D3BF"
  rule-strong: "#CDB79E"
  violet: "#9B7ED6"
  violet-ink: "#4A3290"
  violet-wash: "#E8DFF7"
  violet-wash-pressed: "#DACDF2"
  lemon: "#E4FF3B"
  lemon-pressed: "#D2EC2A"
  lemon-wash: "#F5FFC4"
  lemon-ink: "#3F4700"
  success: "#23613F"
  success-wash: "#DCEBD9"
  warning: "#8A5A00"
  warning-wash: "#F8E7C2"
  error: "#B3261E"
  error-wash: "#F6DAD5"
  error-pressed: "#97201A"
  note-border: "#D3E46A"
typography:
  display:
    fontFamily: "Schibsted Grotesk"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: "40px"
    letterSpacing: "-0.8px"
  headline:
    fontFamily: "Schibsted Grotesk"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.5px"
  title:
    fontFamily: "Schibsted Grotesk"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: "26px"
    letterSpacing: "-0.3px"
  title-small:
    fontFamily: "Schibsted Grotesk"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "22px"
    letterSpacing: "-0.1px"
  body:
    fontFamily: "Schibsted Grotesk"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "22px"
  body-strong:
    fontFamily: "Schibsted Grotesk"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: "22px"
  body-small:
    fontFamily: "Schibsted Grotesk"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
  label:
    fontFamily: "Schibsted Grotesk"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "16px"
  label-small:
    fontFamily: "Schibsted Grotesk"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: "14px"
    letterSpacing: "0.1px"
  numeric:
    fontFamily: "Schibsted Grotesk"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "16px"
rounded:
  xs: "3px"
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  xxxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.lemon}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-primary-pressed:
    backgroundColor: "{colors.lemon-pressed}"
  button-tonal:
    backgroundColor: "{colors.violet-wash}"
    textColor: "{colors.violet-ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-tonal-pressed:
    backgroundColor: "{colors.violet-wash-pressed}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.violet-ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-disabled:
    backgroundColor: "{colors.ground-deep}"
    textColor: "{colors.ink-faint}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "52px"
  ticket-card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "0 16px 12px"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.violet-wash}"
    textColor: "{colors.violet-ink}"
  nav-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label-small}"
  nav-indicator:
    backgroundColor: "{colors.violet-wash}"
    rounded: "{rounded.full}"
    width: "56px"
    height: "32px"
  sla-stamp-safe:
    backgroundColor: "transparent"
    textColor: "{colors.violet-ink}"
    typography: "{typography.numeric}"
    rounded: "{rounded.xs}"
  sla-stamp-at-risk:
    backgroundColor: "{colors.lemon}"
    textColor: "{colors.error}"
  sla-stamp-breached:
    backgroundColor: "{colors.error-wash}"
    textColor: "{colors.error}"
  sla-stamp-done:
    backgroundColor: "transparent"
    textColor: "{colors.ink-faint}"
  bubble-outgoing:
    backgroundColor: "{colors.violet-ink}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  bubble-assistant:
    backgroundColor: "{colors.violet-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  bubble-incoming:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  internal-note:
    backgroundColor: "{colors.lemon-wash}"
    textColor: "{colors.lemon-ink}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: SupportDesk AI

## Overview

**Creative North Star: "The Index-Card File"**

SupportDesk AI is a support desk kept like a well-ordered card file on a beige desk. Every ticket is a card of warm card stock with a violet header rule; every SLA clock is a rubber date-stamp pressed slightly off-square; and one Electric Lemon highlighter marks the only places that say "act here". The world is paper, ink and stamp, not glass and gradients: surfaces are flat, separated by hairline rules, and the only lift belongs to things that float over the desk (sheets, dialogs, the fanned cards on the welcome screen).

Density is set for an agent working a queue all shift: 4dp cells, 48dp touch targets, compact labels, and a single family carrying everything from the 34px display line to 11px stamp text. The customer screens use the same vocabulary at a calmer pace, so a stamp reading "Due 45m" means the same thing to the customer and to the agent answering them. The system explicitly refuses the navy-and-teal SaaS card kit with gradient stat tiles. It is light only, on the pinned Porcelain Beige ground.

The embeddable web chat widget (`frontend/front.html`) carries the same palette, family, radii and bubble language as CSS custom properties, so the customer meets the same desk on the web.

**Key Characteristics:**
- Porcelain Beige desk ground, card-stock paper surfaces, hairline rules.
- Violet stamp ink: Heather Purple for fills, icons and rules; Violet Ink for anything that must be read.
- One Electric Lemon highlighter, reserved for the primary action and things waiting on the user.
- Schibsted Grotesk only, proportional figures throughout.
- Elevation is a hairline border or a shadow, never both.
- The SLA stamp is the signature: a double-ruled, tilted rubber stamp with four states.

## Colors

A warm paper-and-ink palette: beige desk, cream card stock, violet stamp ink and one acid-yellow highlighter.

### Primary
- **Electric Lemon** (lemon): the highlighter. Fills the one primary button per screen state, send buttons, the nav bar count badge, attention counts on filter chips, unread notification pips, the "needs attention" flag in reports, and the at-risk SLA stamp. Pressed state is **Lemon Pressed**. **Lemon Wash** with **Lemon Ink** text is the soft form of the same signal (the "waiting on you" banner, live-chat channel tag, internal notes).

### Secondary
- **Heather Purple** (violet): stamp ink as fill and line. The ticket card's header rule, analytics bars, AI sparkle icons, empty-state icons, loading spinners, text selection colour. Never text.
- **Violet Ink** (violet-ink): the readable form of the violet. Links, selected labels, tonal and ghost button text, the safe SLA stamp, focused input outlines, outgoing chat bubbles, avatar initials.
- **Violet Wash** (violet-wash): selection backgrounds: active nav pill, selected chips, tonal buttons, the assistant's chat bubble, avatars, "open" status and AI-provenance tags.

### Tertiary (state)
- **Success / Success Wash**: resolved status, WhatsApp channel tag.
- **Warning / Warning Wash**: pending status, the "Unassigned" assignee label.
- **Error / Error Wash**: urgent priority, form errors, danger buttons (pressed: **Error Pressed**), at-risk and breached SLA stamp ink, breached stamp fill.
- Status, priority and channel each have a fixed bg/text/border triple in `src/theme/colors.js` (`COLORS.status`, `COLORS.priority`, `COLORS.channel`); use those, do not mix new ones.

### Neutral
- **Porcelain Beige** (ground): the desk. Screen backgrounds and the top app bar.
- **Ground Deep** (ground-deep): the second neutral layer: pressed rows and icon buttons, disabled button fills, disabled inputs, closed status.
- **Card Stock** (paper): cards, sheets, inputs, nav bar, incoming chat bubbles. **Paper Pressed** is the pressed ticket card.
- **Ink** (ink): headings and body text, and text on lemon.
- **Ink Muted** (ink-muted): secondary text, inactive nav icons and labels.
- **Ink Faint** (ink-faint): placeholders, timestamps, meta, done SLA stamps, disabled button text.
- **On Dark** (on-dark): text on Violet Ink and Error fills.
- **Rule** (rule): hairlines on paper and ground; card and chip borders.
- **Rule Strong** (rule-strong): input and outline-button borders at rest.

### Named Rules
**The One Highlighter Rule.** Electric Lemon means "act here" and nothing else: the primary action (one per screen state) and things waiting on the user (unread, attention counts, at-risk SLA). It is never decoration, never a brand stripe, never a chart series.

**The Ink-Not-Heather Rule.** Heather Purple (#9B7ED6) is never used for text; at 3.2:1 on paper it is fill, icon and rule only. Any violet text uses Violet Ink.

## Typography

**Display Font:** Schibsted Grotesk (fallback: system-ui, sans-serif on the web)
**Body Font:** Schibsted Grotesk
**Label/Mono Font:** Schibsted Grotesk (no mono face)

**Character:** One grotesk with a newspaper's firmness carries the whole system; hierarchy comes from weight (400 to 800) and tight negative tracking on the large sizes, not from a second family.

On Android a custom font's weight comes from its file, so each role names its own file (`SchibstedGrotesk_400Regular` through `SchibstedGrotesk_800ExtraBold`) rather than relying on `fontWeight`. Spread a `TYPE` role into a style and add colour: `{ ...TYPE.title, color: COLORS.ink }`.

### Hierarchy
- **Display** (800, 34/40, -0.8): the welcome screen headline and other single hero lines.
- **Headline** (700, 26/32, -0.5): screen-level headings and greeting lines.
- **Title** (700, 20/26, -0.3): app bar titles, section and sheet titles.
- **Title Small** (600, 16/22, -0.1): ticket subjects, large button labels, list item titles.
- **Body** (400, 15/22): message text, inputs, descriptions.
- **Body Strong** (500, 15/22): emphasised body copy.
- **Body Small** (400, 13/18): card descriptions, helper and error text, dates.
- **Label** (600, 13/16): field labels, buttons (medium buttons bump to 15/20), badges, chips.
- **Label Small** (600, 11/14, +0.1): nav labels, channel names, chat meta, small badges.
- **Numeric** (600, 13/16): ticket ids, SLA stamp text, counts and badge numbers.

### Named Rules
**The One Family Rule.** Schibsted Grotesk is the only typeface, in the app and the web widget. No second display face, no mono.

**The Proportional Figures Rule.** No `tabular-nums` (`fontVariant`/`font-variant-numeric`) anywhere: this face widens punctuation with it. Ids, times and counts use the Numeric role at weight 600 instead.

## Layout

A 4dp grid (`SPACING` xs 4, sm 8, md 12, lg 16, xl 20, xxl 24, xxxl 32). Screens use a 16dp side gutter, cards stack with 12dp between them and keep 16dp horizontal internal padding. Every touch target is at least 48dp (`TOUCH`); icon buttons are 48dp circles, filter chips sit 36dp tall inside a 48dp hit row, nav items are 56dp tall.

Screens are single-column phone layouts: a ground-coloured top app bar (64dp, title left, actions right, hairline under it), optional search and a horizontally scrolling chip row, then the card list, with a Material 3 navigation bar at the foot. The web widget is a single centred 400px-max panel, up to 640px tall, with a 16px page gutter.

## Elevation & Depth

The system is flat by default and conveys depth with tone and hairlines: ground, then paper on ground, then a 1px Rule border. Exactly one shadow exists in the app, `ELEVATION.raised`, and it is reserved for surfaces that float above the desk: the assign dialog, bottom sheets, and the fanned ticket cards on the welcome screen. Those floating surfaces carry no border. The web widget's panel uses a two-layer version of the same warm-brown shadow.

### Shadow Vocabulary
- **Raised** (`shadowColor #3A2A12, offset 0/2, opacity 0.12, radius 8, Android elevation 3`): dialogs, bottom sheets, welcome-screen card fan.
- **Widget panel** (`box-shadow: 0 2px 8px rgba(58,42,18,0.12), 0 12px 32px rgba(58,42,18,0.10)`): the web chat widget shell only.

### Named Rules
**The Border-Or-Shadow Rule.** Elevation is declared once per element: a hairline border or a shadow, never both. Cards, chips, inputs and bars use a border; dialogs and sheets use the shadow.

## Shapes

Gently rounded, card-like corners: 10px on inputs and buttons, 12px on cards and the waiting banner, 16px on sheets, dialogs, chat bubbles and the widget panel. Small marks are sharper: 6px for badges, 3px for SLA stamps and analytics bars. Chips, the nav indicator, avatars and count badges are full pills or circles. Chat bubbles cut one corner to 3px on the speaker's side (bottom-right for outgoing, bottom-left for incoming and assistant). Priority is a small 45-degree-rotated square pip, not a pill. Slight tilts are part of the world: the SLA stamp sits at -2.5 degrees and the welcome-screen cards fan at -4, 2.5 and -1.5 degrees; nothing else rotates.

## Components

### Buttons
Firm, flat and quiet except for the one that matters.
- **Shape:** gently rounded (10px); heights 40 (sm, with 4dp hit slop), 48 (md) and 56 (lg); 20dp horizontal padding (12 on sm).
- **Primary:** Electric Lemon with Ink text. One per screen state.
- **Tonal:** Violet Wash with Violet Ink text, for common secondary actions (Claim, Ask the assistant, Add photos).
- **Outline:** transparent with a 1px Rule Strong border and Ink text.
- **Ghost:** text-only Violet Ink.
- **Danger:** Error fill with On Dark text.
- **Pressed:** each variant swaps to its pressed fill (Lemon Pressed, Violet Wash Pressed, Ground Deep, Violet Wash, Error Pressed).
- **Disabled / loading:** Ground Deep fill, Ink Faint text; loading shows a small spinner in the variant's text colour.

### Chips
- **Style:** 36dp pill on Card Stock with a 1px Rule border, Ink label, optional count.
- **State:** selected becomes Violet Wash (border too) with Violet Ink label. A count that needs the user's attention fills Electric Lemon.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Card Stock; pressed Paper Pressed (ticket card) or Ground Deep (summary card).
- **Shadow Strategy:** none; a 1px Rule border (see Elevation).
- **Internal Padding:** 16dp horizontal, 12dp bottom on the ticket card; 16dp all round on summary cards.

### Inputs / Fields
- **Style:** Card Stock fill, 1px Rule Strong outline, 10px radius, 52dp min height (112dp multiline), 12dp horizontal padding, Label above in Ink.
- **Focus:** outline thickens to 2px Violet Ink; caret Violet Ink, selection Heather Purple.
- **Error / Disabled:** Error outline plus an alert icon and Body Small error text below; disabled fills Ground Deep.

### Navigation
- **Top app bar:** 64dp, Porcelain Beige with a hairline Rule underneath, Title left, 48dp circular icon buttons right.
- **Nav bar:** Card Stock with a hairline Rule on top. The active tab has a 56x32 Violet Wash pill behind a filled Violet Ink icon and an Ink label; inactive tabs show the outline icon and label in Ink Muted. Counts of things waiting appear as an 18dp Electric Lemon badge with Ink numerals and a 1.5px paper ring (99+ cap).

### Ticket Card (signature)
The index card. A 44dp header row holds the `#id` in Numeric Ink, the channel icon and name in Ink Muted, and a small SLA stamp at the right, all sitting on a 1px Heather Purple header rule. Below: the subject in Title Small (2 lines), description in Body Small Ink Muted, optional customer row (28dp avatar, name, company), optional assignee row (Unassigned in Warning with Claim/Assign buttons), and a footer of status badge, priority pip and date.

### SLA Stamp (signature)
The SLA clock as a rubber date-stamp: a 1.5px outer frame, a 0.75px inner frame 1.5px inside it, 3px corners, Numeric text, tilted -2.5 degrees. Label reads "Due {time}", "Breached {time}", or the resolved/closed text.
- **Safe:** Violet Ink frame and text on whatever lies beneath.
- **At-risk:** Error ink on an Electric Lemon fill: the highlighter over red ink.
- **Breached:** Error ink on Error Wash, label prefixed "Breached".
- **Done:** faded Ink Faint ink, triggered when the remaining text says resolved or closed.

### Chat Bubbles
16px bubbles with one 3px corner on the speaker's side. Outgoing: Violet Ink with On Dark text. Assistant: Violet Wash with a Heather Purple sparkle and an "Assistant" label, plus "Demo reply" when canned. Agent/incoming: Card Stock with a Rule border. Internal notes are a lemon slip: Lemon Wash, a Note Border hairline, Lemon Ink text and a lock icon.

### Badges
Status is a 6px-radius tonal pill from `COLORS.status`. Priority is a rotated square pip plus coloured label from `COLORS.priority`, deliberately not a second pill beside status.

## Do's and Don'ts

### Do:
- **Do** use Electric Lemon (#E4FF3B) only for the primary action (one per screen state) and things waiting on the user.
- **Do** set violet text in Violet Ink (#4A3290); keep Heather Purple (#9B7ED6) for fills, icons and rules.
- **Do** use Schibsted Grotesk for everything, with each role naming its own weight file on Android.
- **Do** give every element either a 1px Rule border or `ELEVATION.raised`, choosing by whether it sits on the desk or floats above it.
- **Do** show SLA time with the SLA stamp in its four states (safe, at-risk, breached, done).
- **Do** keep spacing on the 4dp grid and touch targets at 48dp or more.
- **Do** take status, priority and channel colours from their fixed triples in `src/theme/colors.js`.

### Don't:
- **Don't** set any text in Heather Purple.
- **Don't** use Electric Lemon as decoration, a brand band or a chart series; analytics bars are Heather Purple.
- **Don't** add a second typeface or a mono face.
- **Don't** turn on `tabular-nums`.
- **Don't** combine a border and a shadow on one element.
- **Don't** use the navy-and-teal SaaS kit or gradient stat tiles.
- **Don't** add a dark theme; the ground is pinned Porcelain Beige.
