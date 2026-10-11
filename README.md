# SupportDesk AI — Omnichannel Customer Support Platform

> A multi-tenant customer-support platform designed to bring email, live chat, WhatsApp, and web-form requests into one unified ticket inbox, with SLA management, intelligent routing, workflow automation, customer satisfaction tracking, and AI assistance.

## Overview

**SupportDesk AI** is designed for SaaS companies, e-commerce brands, D2C startups, agencies, and IT teams that manage customer support operations. The platform aims to reduce first-response and resolution times, deflect repetitive questions with a knowledge-grounded AI chatbot, and give support managers visibility into workload, SLA performance, and customer satisfaction.

**Project difficulty:** Advanced / Expert

## Core Features

- **Unified omnichannel inbox** — bring email, live chat, WhatsApp, and web-form requests into a common ticket workflow.
- **Ticket management** — ticket assignment, statuses, priorities, tags, internal notes, public replies, attachments, saved views, merging, splitting, and bulk actions.
- **Real-time collaboration** — live updates, agent presence, typing indicators, and collision detection.
- **SLA management** — first-response, next-response, and resolution targets based on business hours, with at-risk alerts and escalations.
- **Intelligent routing** — round-robin, least-load, skills-based, and sticky assignment strategies.
- **Macros and automations** — reusable replies and event-based or time-based workflows.
- **Knowledge base and help center** — article authoring, versions, translations, search, feedback, and customer self-service.
- **AI copilot** — draft, rewrite, shorten, translate, summarize, and classify support conversations.
- **RAG chatbot** — answer from tenant-specific knowledge sources, provide citations, and hand off to a human when confidence is insufficient.
- **Customer satisfaction (CSAT)** — post-resolution surveys, response tracking, and score summaries.
- **Reports and analytics** — ticket volume, response and resolution times, SLA performance, agent performance, CSAT, and AI usage.
- **Administration and access control** — tenant settings, users, teams, roles, channel configuration, security settings, and audit logs.
- **Integrations and billing** — planned integrations include Slack, Jira, Shopify, webhooks, and Stripe Billing.

## Technology Stack

The following is the **recommended architecture from the project specification**; it does not imply that every component has already been implemented.

| Layer | Recommended technologies |
|---|---|
| Agent app and admin console | Next.js 15, React 19, TypeScript, TanStack Query, Zustand, Tailwind CSS, Radix UI, TipTap |
| Help center | Next.js SSR/ISR with tenant-specific theming |
| Embeddable chat widget | Preact, Vite, Shadow DOM |
| Backend API | NestJS, Node.js 22, REST, OpenAPI |
| Background jobs | BullMQ workers |
| Primary database | PostgreSQL 16 with Row-Level Security (RLS) |
| Vector search | pgvector |
| Cache, presence, and queues | Redis 7 |
| Full-text search | OpenSearch |
| Real-time communication | Socket.IO and Server-Sent Events (SSE) |
| AI | OpenAI and/or Anthropic APIs, embeddings, retrieval and reranking |
| Object storage | Amazon S3 and signed URLs |
| Email | AWS SES |
| WhatsApp | Meta WhatsApp Cloud API |
| Payments | Stripe Billing |
| Infrastructure | Docker, Kubernetes, Terraform, GitHub Actions |
| Observability | OpenTelemetry, Grafana/Prometheus, Loki, Tempo, Sentry |

## High-Level Architecture

```text
Agent App / Admin Console / Help Center / Chat Widget
                         |
                   API Gateway
                         |
               NestJS Core API
                         |
       +-----------------+------------------+
       |                 |                  |
  PostgreSQL          Redis              OpenSearch
  + pgvector       + BullMQ queues       Full-text search
       |                 |
       +---------- Background Workers
                         |
       +-----------------+------------------+
       |                 |                  |
   Email / SES     WhatsApp Cloud API    AI / RAG
                         |
                 Integrations / Billing
```

## Main Application Areas

- **Public site and help center:** landing page, pricing, documentation, searchable articles, ticket submission, and customer ticket portal.
- **Authentication:** signup, login, password recovery, email verification, invitations, two-factor authentication, and enterprise SSO options.
- **Agent workspace:** inbox, live chat, contacts, organizations, knowledge base, reports, and profile settings.
- **Tenant administration:** team and role management, channel configuration, routing, SLAs, automations, AI settings, CSAT, integrations, billing, and security.
- **Platform administration:** tenant health, usage, feature flags, channel health, and platform audit tools.

## Repository Structure

The specification proposes a monorepo organized roughly as follows. Adjust this structure as implementation evolves.

```text
supportdesk-ai/
├── apps/
│   ├── web/                 # Agent workspace and admin console
│   ├── help-center/         # Tenant help center and customer portal
│   ├── widget/              # Embeddable Preact chat widget
│   └── marketing/           # Public marketing website
├── services/
│   ├── api/                 # NestJS core API and modules
│   └── workers/             # Email, SLA, routing, AI, and other workers
├── packages/
│   ├── db/                  # Schema, migrations, RLS policies, seeds
│   ├── contracts/           # Shared schemas, API and WebSocket types
│   ├── ai/                  # Prompts, retrieval, guardrails, evaluations
│   ├── sla-calendar/        # Business-hours and SLA calculations
│   ├── rules/               # Routing and automation rules
│   ├── ui/                  # Shared design-system components
│   └── config/              # Shared tooling configuration
├── infra/                   # Terraform, Kubernetes, observability
├── tests/                   # E2E, load, AI-evaluation, security tests
├── docs/                    # Architecture, API docs, runbooks
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Development Roadmap

The specification outlines a phased implementation:

1. **Foundations** — monorepo, CI, local development environment, authentication, tenants, roles, and design-system shell.
2. **Core ticketing** — tickets, messages, notes, attachments, assignment, custom fields, tags, and agent inbox.
3. **Email channel** — inbound parsing, threading, outbound email, and customer identities.
4. **Real-time and live chat** — Socket.IO, presence, collision detection, widget, and chat-to-ticket flow.
5. **SLA and routing** — business calendars, policies, timers, escalations, and routing strategies.
6. **Productivity** — macros, automations, bulk actions, and search.
7. **Knowledge base** — article management, help center, customer portal, and article suggestions.
8. **AI copilot and RAG bot** — indexing, retrieval, drafting, classification, human handoff, and AI evaluations.
9. **WhatsApp and forms** — Meta integration, webhooks, templates, and web forms.
10. **CSAT and reporting** — surveys, dashboards, exports, and AI-impact reports.
11. **Billing and integrations** — Stripe, usage metering, API keys, and external integrations.
12. **Enterprise hardening** — SSO/SCIM, audit and retention tooling, load testing, and security testing.

## Security Principles

Security requirements in the specification include:

- Enforce tenant isolation in PostgreSQL using RLS and tenant-scoped queries.
- Apply role-based authorization to protected operations.
- Validate request payloads and rate-limit sensitive endpoints.
- Verify provider webhook signatures and handle duplicate events idempotently.
- Sanitize inbound email HTML and validate uploaded files.
- Keep secrets out of source control; use a secret manager in deployed environments.
- Use TLS in transit and encryption at rest.
- Redact sensitive personal information before sending content to AI providers where configured.
- Ground chatbot answers in retrieved knowledge, include citations, and hand off when confidence is insufficient.
- Maintain audit trails for security-sensitive administrative actions.

## Getting Started

This repository's exact setup commands, package scripts, environment variables, and service configuration depend on the implementation. They are **not specified here**, so they should be documented after the initial codebase and development environment are created.

Before running the full platform, the planned architecture may require:

- Node.js 22 for the backend services (as specified in the architecture)
- A package manager and monorepo tooling configured by the repository
- PostgreSQL 16 with the pgvector extension
- Redis 7
- OpenSearch
- Docker and Docker Compose
- Credentials/configuration for any external services you enable, such as AI providers, AWS SES, Meta WhatsApp Cloud API, or Stripe

Do not commit `.env` files, API keys, tokens, database passwords, or other secrets. Add required variable names to a `.env.example` file with placeholder values only.

## Testing and Quality

The specification recommends:

- Unit and integration tests for business logic, authorization, and SLA calculations.
- End-to-end tests with Playwright.
- Load tests with k6.
- Tenant-isolation and security tests.
- AI evaluation sets for answer faithfulness and relevance.
- Monitoring and tracing with OpenTelemetry and related observability tools.

## Project Status

This README describes the **planned project based on the supplied specification**. Features, integrations, deployment infrastructure, and setup instructions should be marked as implemented only after they are available and verified in the repository.

## Contributing

Contributions can be organized around the roadmap above. Before submitting changes:

1. Discuss or document the intended change.
2. Follow the repository's formatting, linting, and testing conventions once configured.
3. Add or update tests for the changed behavior.
4. Never include secrets or real customer data in commits.

## License

No license has been specified yet. Add a `LICENSE` file before distributing or reusing this project publicly.
