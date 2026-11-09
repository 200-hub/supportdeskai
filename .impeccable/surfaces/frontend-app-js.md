---
version: 1
slug: "frontend-app-js"
primary_target: "frontend/App.js"
related_targets: ["frontend/src/screens"]
---

# Surface brief: SupportDesk AI app (all screens)

Mode: Operate (customer, agent and admin screens), with the Welcome screen as the one Persuade moment.
Audience: customers on phones raising/following tickets; agents working a queue under SLA; admins configuring a workspace.
Constraints: Expo / React Native, Material 3 structure on Android, palette pinned by user (#F3E6D7, #9B7ED6, #E4FF3B). Light only (pinned beige ground).

## Direction contract

THESIS: A support desk as a well-kept index-card file: every ticket is a card with a violet header rule, every SLA clock is a rubber date-stamp. Refuses the navy-and-teal SaaS card kit with gradient stat tiles.
OWN-WORLD: Porcelain beige desk ground, card-stock paper (#FFFAF3) with hairline rules, violet stamp ink (#4A3290 text, #9B7ED6 fills), one Electric Lemon highlighter reserved for "act here": the primary action and things waiting on you. Schibsted Grotesk only, tabular figures for ids and times. Radii 10–12, elevation by hairline, never shadow+border.
STORY: An agent opens the queue and knows within one glance which card's stamp is red on lemon; a customer sees their ticket stamped "Due 45m" and trusts someone is on it.
FIRST VIEWPORT: Agent queue: top app bar (title left, notification icon right), a row of filter chips, then the ticket card list; each card header = #id, channel, SLA stamp right; Material nav bar with violet-wash pill. Primary action (lemon) sits once per screen.
FORM: Grounded candidate 7 of 7 (index-card file with violet date stamps and a highlighter). Raises: lemon reserved for one job (from terminal-yellow wayfinding); one state vocabulary across all controls (from centre-rail reference setting); 4dp cell discipline (from Crouwel grid). seed:1e101e47d3fa0ef1
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
