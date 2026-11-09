# Product

<!-- impeccable:product-schema 1 -->

> Facts marked *(inferred)* were read from the repository; the user said "proceed according to the plan" instead of an interview round on 2026-11-09.

## Platform

android

*(inferred: Expo / React Native app; `apiClient.js` defaults to the Android emulator host. The same code also runs on iOS and web via `expo start --web`.)*

## Users

- **Customers** of a business that uses SupportDesk AI: raise tickets, chat with the AI assistant, read help articles, follow ticket status on their phone.
- **Support agents**: work an inbox of tickets across email, WhatsApp, live chat and web forms; answer under SLA pressure, use the AI copilot for drafts and summaries.
- **Admins**: configure the workspace — users, teams, SLA policies, routing strategy, channels.

## Product Purpose

One ticket inbox for every support channel, with SLA tracking, automatic routing, macros/automations and AI assistance, so a support team answers faster and customers resolve simple questions themselves.

## Positioning

Multi-tenant omnichannel support desk where the AI is grounded in each tenant's own knowledge base and hands off to a human when unsure. *(inferred from README)*

## Operating Context

Agents use it all shift, scanning queues and replying repeatedly; customers open it briefly when something is wrong. Works offline-first: tickets and messages queue locally and sync later (`syncManager`, `offlineStorage`).

## Capabilities and Constraints

- Backend: FastAPI + PostgreSQL in `backend/` (auth, tenants, users/teams, CRM, channels, tickets, SLA, routing, macros, automations, AI, analytics, knowledge).
- Frontend: Expo app in `frontend/` with role-based navigation (customer tabs, agent tabs, admin settings) plus an embeddable web chat widget `frontend/front.html`.
- Agent dashboard, inbox, notifications, profile, analytics, knowledge base and help center still render mock data.
- Terminology: ticket, conversation, macro, SLA, routing rule, channel, workspace, internal note, copilot.

## Brand Commitments

- Name: **SupportDesk AI**.
- Palette pinned by the user (2026-11-09): Porcelain Beige `#F3E6D7`, Heather Purple `#9B7ED6`, Electric Lemon `#E4FF3B`.
- User asked that it must not look AI-generated; professional, premium finish.

## Evidence on Hand

No real customers, testimonials, metrics or logos. All dashboard and analytics numbers are demo data in `frontend/src/data/mockData.js` and must stay labelled as such; do not invent claims.

## Product Principles

1. The queue comes first: an agent sees what is urgent and what breaches SLA before anything else.
2. AI is an assistant with visible provenance, never a disguised human.
3. Offline is a normal state, not an error.
4. Same vocabulary across customer, agent and admin surfaces.
