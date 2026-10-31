// Realistic SupportDesk AI Omnichannel & Customer Support Data

export const INITIAL_USER = {
  name: 'Sarah Connor',
  email: 'sarah.connor@cyberdyne.org',
  phone: '+1 (555) 234-5678',
  company: 'Cyberdyne Systems Corp',
  role: 'customer', // 'customer' | 'agent' | 'admin'
  avatarInitials: 'SC',
};

export const INITIAL_TICKETS = [
  {
    id: 'SD-1042',
    subject: 'Payment webhook failures causing checkout drops',
    description: 'Our production webhook listener is rejecting incoming events with 401 Unauthorized since 09:30 UTC. We need immediate backfill for ~140 missed events.',
    category: 'Billing & Invoices',
    channel: 'email',
    status: 'open',
    priority: 'urgent',
    createdDate: 'Oct 15, 2026',
    customer: {
      name: 'Sarah Connor',
      email: 'sarah.connor@cyberdyne.org',
      company: 'Cyberdyne Systems Corp',
      avatarInitials: 'SC',
      tier: 'Enterprise',
      csatAvg: '4.8',
    },
    assignedTo: 'Sayoni (Senior Support)',
    slaRemaining: '18m',
    slaStatus: 'at-risk',
    updatedAt: '4m ago',
    tags: ['billing', 'webhooks', 'v2-api'],
    aiConfidence: '94%',
    aiSuggestedAction: 'Provide webhook retry endpoint documentation & verify signing secrets.',
    messages: [
      {
        id: 'm1',
        senderType: 'customer',
        senderName: 'Sarah Connor',
        time: '10:14 AM',
        content: 'Hi Support, our production webhook listener is rejecting incoming events with 401 Unauthorized since 09:30 UTC. Are there rotated signing secrets on your end?',
      },
      {
        id: 'm2',
        senderType: 'internal_note',
        senderName: 'Alex Mercer (L2 Infra)',
        time: '10:20 AM',
        content: 'Checked the audit logs: Tenant webhook key was regenerated automatically during their scheduled security rotation at 09:30 UTC. They need to update their secret key in their dashboard.',
      },
      {
        id: 'm3',
        senderType: 'agent',
        senderName: 'Sayoni (Senior Support)',
        time: '10:25 AM',
        content: 'Hello Sarah, thank you for reaching out. We verified that your tenant triggered an automated key rotation at 09:30 UTC. Please head to Settings > Webhooks > Active Endpoints to copy the newly generated signature secret.',
      },
      {
        id: 'm4',
        senderType: 'customer',
        senderName: 'Sarah Connor',
        time: '10:32 AM',
        content: 'Thanks! Found the new secret. However, we have ~140 missed events. Is there a replay API or batch re-trigger endpoint we can call?',
      },
    ],
    timeline: [
      { id: 't1', title: 'Ticket Created via Email', time: '10:14 AM', by: 'Sarah Connor' },
      { id: 't2', title: 'Assigned to Sayoni', time: '10:15 AM', by: 'Intelligent Routing' },
      { id: 't3', title: 'Internal Note Added', time: '10:20 AM', by: 'Alex Mercer' },
      { id: 't4', title: 'First Response Sent', time: '10:25 AM', by: 'Sayoni' },
    ],
    aiSummary: 'Customer experiencing webhook 401s due to automated key rotation. Needs assistance replaying missed events.',
    aiSmartDraft: 'Hi Sarah, yes! You can trigger event backfills directly using POST /v1/webhooks/replay with payload {"since": "2026-10-15T09:30:00Z"}. Alternatively, you can click "Resend Failed Events" in your Webhook Events tab.',
  },
  {
    id: 'SD-1041',
    subject: 'WhatsApp order delivery delay inquiry',
    description: 'Order #ORD-8821 was scheduled for delivery yesterday at 4 PM, but the tracker has not updated since local hub arrival.',
    category: 'Orders & Shipping',
    channel: 'whatsapp',
    status: 'open',
    priority: 'high',
    createdDate: 'Oct 15, 2026',
    customer: {
      name: 'Marcus Vance',
      email: '+1 (555) 392-1084',
      company: 'D2C Retail Customer',
      avatarInitials: 'MV',
      tier: 'Standard',
      csatAvg: '5.0',
    },
    assignedTo: 'Sayoni (Senior Support)',
    slaRemaining: '45m',
    slaStatus: 'safe',
    updatedAt: '12m ago',
    tags: ['shipping', 'order-tracking'],
    aiConfidence: '98%',
    aiSuggestedAction: 'Look up Order #ORD-8821 in logistics portal & send tracked delivery status.',
    messages: [
      {
        id: 'm10',
        senderType: 'customer',
        senderName: 'Marcus Vance',
        time: '10:02 AM',
        content: 'Hello, my order #ORD-8821 was scheduled for delivery yesterday at 4 PM, but the tracker has not moved since arriving at the local distribution center. Can you check?',
      },
    ],
    timeline: [
      { id: 't11', title: 'Ticket Created via WhatsApp Cloud API', time: '10:02 AM', by: 'Marcus Vance' },
      { id: 't12', title: 'Assigned to Sayoni', time: '10:05 AM', by: 'Routing' },
    ],
    aiSummary: 'Customer inquiring about delayed delivery for Order #ORD-8821 stuck at distribution hub.',
    aiSmartDraft: 'Hi Marcus! I checked with our fulfillment hub: shipment #ORD-8821 is out for delivery with the local courier today before 2 PM. You can track real-time van progress here: https://track.supportdesk.io/ORD-8821',
  },
  {
    id: 'SD-1040',
    subject: 'Live Chat: Inability to invite team members to workspace',
    description: 'When typing colleague email in workspace settings, the invite button remains disabled.',
    category: 'Account & Access',
    channel: 'chat',
    status: 'pending',
    priority: 'medium',
    createdDate: 'Oct 14, 2026',
    customer: {
      name: 'Elena Rostova',
      email: 'elena@novasoft.de',
      company: 'NovaSoft GmbH',
      avatarInitials: 'ER',
      tier: 'Growth',
      csatAvg: '4.6',
    },
    assignedTo: 'Sayoni (Senior Support)',
    slaRemaining: '2h 15m',
    slaStatus: 'safe',
    updatedAt: '25m ago',
    tags: ['rbac', 'team-members', 'seats'],
    aiConfidence: '91%',
    aiSuggestedAction: 'Check workspace seat limit and billing tier status.',
    messages: [
      {
        id: 'm20',
        senderType: 'customer',
        senderName: 'Elena Rostova',
        time: '09:45 AM',
        content: 'When I type my colleague email to invite them, the invite button remains greyed out.',
      },
      {
        id: 'm21',
        senderType: 'agent',
        senderName: 'Sayoni (Senior Support)',
        time: '09:50 AM',
        content: 'Hi Elena! Checking your account now. It appears your workspace currently has 10/10 seats allocated. Would you like me to upgrade your seat allocation?',
      },
      {
        id: 'm22',
        senderType: 'customer',
        senderName: 'Elena Rostova',
        time: '09:55 AM',
        content: 'Oh I see! Yes please add 2 more seats to our monthly plan.',
      },
    ],
    timeline: [
      { id: 't21', title: 'Chat Escalated to Ticket', time: '09:45 AM', by: 'System' },
      { id: 't22', title: 'Pending Customer Approval', time: '09:50 AM', by: 'Sayoni' },
    ],
    aiSummary: 'User seat cap reached (10/10). Customer approved adding 2 more seats.',
    aiSmartDraft: 'Added 2 seats to your subscription! You can now invite your colleagues directly under Settings > Team Management.',
  },
  {
    id: 'SD-1039',
    subject: 'Web Form: SAML SSO integration error with Okta',
    description: 'Our Okta SSO integration is failing with AudienceRestriction mismatch error.',
    category: 'Technical & API',
    channel: 'web',
    status: 'open',
    priority: 'high',
    createdDate: 'Oct 14, 2026',
    customer: {
      name: 'David Kim',
      email: 'dkim@enterprise-secure.com',
      company: 'Enterprise Secure Systems',
      avatarInitials: 'DK',
      tier: 'Enterprise',
      csatAvg: '4.9',
    },
    assignedTo: 'Sayoni (Senior Support)',
    slaRemaining: '1h 10m',
    slaStatus: 'safe',
    updatedAt: '40m ago',
    tags: ['sso', 'okta', 'saml2'],
    aiConfidence: '88%',
    aiSuggestedAction: 'Validate ACS URL format and X.509 certificate expiration.',
    messages: [
      {
        id: 'm30',
        senderType: 'customer',
        senderName: 'David Kim',
        time: '09:12 AM',
        content: 'Our Okta SSO integration is failing with "AudienceRestriction mismatch". Our entity ID is configured as urn:supportdesk:enterprise-secure.',
      },
    ],
    timeline: [
      { id: 't31', title: 'Web Form Submitted', time: '09:12 AM', by: 'David Kim' },
    ],
    aiSummary: 'SAML AudienceRestriction mismatch during Okta SSO handshake.',
    aiSmartDraft: 'Hi David, please ensure the SP Entity ID in Okta matches exactly: "urn:supportdeskai:auth:enterprise-secure" (notice supportdeskai instead of supportdesk).',
  },
  {
    id: 'SD-1038',
    subject: 'Request for custom CSAT dashboard export in CSV format',
    description: 'Export raw survey comments alongside numeric scores for executive monthly review.',
    category: 'General Support',
    channel: 'email',
    status: 'resolved',
    priority: 'low',
    createdDate: 'Oct 13, 2026',
    customer: {
      name: 'Chloe Dubois',
      email: 'chloe@atelier-paris.fr',
      company: 'Atelier Paris',
      avatarInitials: 'CD',
      tier: 'Growth',
      csatAvg: '5.0',
    },
    assignedTo: 'Sayoni (Senior Support)',
    slaRemaining: 'Resolved',
    slaStatus: 'safe',
    updatedAt: '2h ago',
    tags: ['analytics', 'csat', 'reports'],
    aiConfidence: '99%',
    aiSuggestedAction: 'Provide step-by-step guidance on Report Exporter.',
    messages: [
      {
        id: 'm40',
        senderType: 'customer',
        senderName: 'Chloe Dubois',
        time: '08:00 AM',
        content: 'Is there any way to export raw survey respondent comments alongside scores for our monthly executive review?',
      },
      {
        id: 'm41',
        senderType: 'agent',
        senderName: 'Sayoni (Senior Support)',
        time: '08:15 AM',
        content: 'Hello Chloe! You can go to Reports > CSAT > Export Raw Data, select your date range, and click "Export CSV with Comments". Let me know if you need any customized filters!',
      },
      {
        id: 'm42',
        senderType: 'customer',
        senderName: 'Chloe Dubois',
        time: '08:30 AM',
        content: 'That worked perfectly. Thank you for the quick help!',
      },
    ],
    timeline: [
      { id: 't41', title: 'Ticket Created', time: '08:00 AM', by: 'Chloe Dubois' },
      { id: 't42', title: 'Resolved by Sayoni', time: '08:30 AM', by: 'Sayoni' },
    ],
    aiSummary: 'Customer requested CSAT comments export; resolved with navigation path.',
    aiSmartDraft: 'Happy to help! Have a great day!',
  },
];

export const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-1',
    title: 'SupportDesk AI Live Assistant',
    lastMessage: 'I can assist you with orders, billing, or connect you to an agent.',
    time: '10:35 AM',
    status: 'active',
    unreadCount: 1,
    messages: [
      {
        id: 'c1',
        senderType: 'assistant',
        senderName: 'SupportDesk AI',
        time: '10:30 AM',
        content: 'Hello Sarah! I am your SupportDesk AI virtual assistant. How can I help you today?',
        isDemo: true,
      },
      {
        id: 'c2',
        senderType: 'customer',
        senderName: 'Sarah Connor',
        time: '10:31 AM',
        content: 'Can you show me how to download our monthly VAT invoices?',
      },
      {
        id: 'c3',
        senderType: 'assistant',
        senderName: 'SupportDesk AI',
        time: '10:32 AM',
        content: 'Certainly! Head to Billing > Invoices in your web dashboard, where you can click "Download PDF" next to any monthly statement. Need a direct link?',
        isDemo: true,
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'Order Logistics & Delivery Agent',
    lastMessage: 'Shipment #ORD-8821 is out for delivery before 2 PM today.',
    time: 'Yesterday',
    status: 'closed',
    unreadCount: 0,
    messages: [
      {
        id: 'c10',
        senderType: 'customer',
        senderName: 'Sarah Connor',
        time: 'Yesterday 3:15 PM',
        content: 'Where is my express replacement kit?',
      },
      {
        id: 'c11',
        senderType: 'agent',
        senderName: 'Marcus (Support)',
        time: 'Yesterday 3:18 PM',
        content: 'Hi Sarah, it has departed our central warehouse and is scheduled for morning arrival.',
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'API Rate Limits & OAuth Setup',
    lastMessage: 'Your rate limit has been temporarily boosted to 500 req/sec.',
    time: 'Oct 12',
    status: 'closed',
    unreadCount: 0,
    messages: [
      {
        id: 'c20',
        senderType: 'customer',
        senderName: 'Sarah Connor',
        time: 'Oct 12 11:00 AM',
        content: 'We need increased burst limit during our black friday flash test.',
      },
      {
        id: 'c21',
        senderType: 'agent',
        senderName: 'Sayoni (Support)',
        time: 'Oct 12 11:20 AM',
        content: 'Temporary boost active for 72 hours. Let us know if you hit any bottlenecks.',
      },
    ],
  },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'New Reply on Ticket #SD-1042',
    description: 'Sayoni posted an update regarding webhook replay endpoints.',
    time: '5m ago',
    type: 'reply',
    isRead: false,
    ticketId: 'SD-1042',
  },
  {
    id: 'notif-2',
    title: 'SLA Alert: Ticket #SD-1042',
    description: '18 minutes remaining before first response SLA breach threshold.',
    time: '12m ago',
    type: 'alert',
    isRead: false,
    ticketId: 'SD-1042',
  },
  {
    id: 'notif-3',
    title: 'Ticket #SD-1038 Marked Resolved',
    description: 'Chloe Dubois confirmed resolution for CSAT report export.',
    time: '2h ago',
    type: 'status',
    isRead: true,
    ticketId: 'SD-1038',
  },
  {
    id: 'notif-4',
    title: 'AI Grounding Index Updated',
    description: 'Knowledge base synced with 5 new release notes and API endpoints.',
    time: '1d ago',
    type: 'ticket',
    isRead: true,
  },
];

export const KNOWLEDGE_TOPICS = [
  { id: 'cat-1', title: 'Account and Login', icon: 'person-circle-outline', count: 12 },
  { id: 'cat-2', title: 'Tickets and Support', icon: 'ticket-outline', count: 18 },
  { id: 'cat-3', title: 'Chat and Conversations', icon: 'chatbubbles-outline', count: 8 },
  { id: 'cat-4', title: 'General Help', icon: 'help-buoy-outline', count: 15 },
];

export const KNOWLEDGE_FAQS = [
  {
    question: 'How do I submit a high-priority ticket?',
    answer: 'Navigate to Create Ticket, select the "Urgent" or "High" priority badge, and describe the business impact. P1 tickets immediately alert the on-call engineering team.',
  },
  {
    question: 'What are the official business hours for live support?',
    answer: 'Live agents operate Mon-Fri 08:00 to 20:00 UTC. Our AI Copilot provides 24/7 grounded answers and can escalate tickets while off-duty.',
  },
  {
    question: 'Can I track tickets created via WhatsApp or Email?',
    answer: 'Yes! All tickets tied to your verified email or phone number automatically sync in the "My Tickets" tab.',
  },
];

export const KNOWLEDGE_ARTICLES = [
  {
    id: 'kb-1',
    title: 'How to re-trigger failed webhooks via API and Console',
    category: 'Tickets and Support',
    reads: '1,420',
    helpful: '98%',
    summary: 'Step-by-step instructions for webhook retries, dead letter replay, and verifying HMAC SHA-256 signatures.',
    content: `Overview:
When an endpoint drops webhooks or returns 5xx/4xx errors, SupportDesk AI buffers failed deliveries in a tenant dead-letter queue for up to 72 hours.

1. Using the Web Console:
Navigate to Settings > Webhooks > Failed Deliveries. Select the timestamp range and click "Replay Batch".

2. Using the REST API:
Send a POST request to /v1/webhooks/replay:
{
  "since": "2026-10-15T09:30:00Z",
  "endpointId": "ep_prod_primary"
}

3. Signature Validation:
Ensure your server calculates HMAC SHA-256 signatures using the current secret found under Settings > Webhooks.`,
  },
  {
    id: 'kb-2',
    title: 'Configuring Okta & Azure AD SAML 2.0 Single Sign-On',
    category: 'Account and Login',
    reads: '890',
    helpful: '95%',
    summary: 'Entity IDs, ACS endpoints, assertion attributes, and troubleshooting AudienceRestriction mismatch errors.',
    content: `SAML 2.0 Configuration Guide:
SupportDesk AI supports IdP-initiated and SP-initiated SSO.

Prerequisites:
- Enterprise Tier subscription
- Administrative rights in Okta / Azure AD

Setup Steps:
1. SP Entity ID: urn:supportdeskai:auth:<your-tenant-slug>
2. ACS URL: https://api.supportdesk.io/v1/auth/saml/callback
3. NameID Format: EmailAddress (urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress)
4. Attributes: Map firstName, lastName, and email to standard SAML assertions.`,
  },
  {
    id: 'kb-3',
    title: 'Managing Team Seats, Roles, and Permission Matrices',
    category: 'General Help',
    reads: '2,150',
    helpful: '99%',
    summary: 'Adding agent seats, assigning custom roles, least-privilege security, and billing proration details.',
    content: `Managing Workspace Seats:
Workspace Owners and Admins can assign roles to agents, supervisors, and view-only analysts.

- Adding Seats: Go to Settings > Workspace > Seats and click "Add Seats".
- Proration: Any mid-cycle seat additions are automatically prorated on your upcoming invoice.
- Permissions: Custom roles allow configuring ticket queue visibility, macro execution, and export permissions.`,
  },
  {
    id: 'kb-4',
    title: 'Setting up WhatsApp Business Cloud API channel',
    category: 'Chat and Conversations',
    reads: '3,200',
    helpful: '97%',
    summary: 'Meta Business Manager verification, phone number registration, and 24h session window policies.',
    content: `WhatsApp Integration:
Connect your official Meta WhatsApp Business Cloud API account to ingest customer WhatsApp chats directly into SupportDesk AI.

Features:
- Live two-way chat synchronization
- Automated template messages for order updates
- Rich media attachment ingestion (PDFs, images)`,
  },
];

export const AGENT_TEAM = [
  { id: 'ag-1', name: 'Sayoni Bhattacharjee', role: 'Senior Support Engineer', status: 'Online', assignedCount: 8 },
  { id: 'ag-2', name: 'Alex Mercer', role: 'L2 Infrastructure Specialist', status: 'Online', assignedCount: 5 },
  { id: 'ag-3', name: 'Marcus Vance', role: 'Customer Success Advocate', status: 'Away', assignedCount: 3 },
];

export const ADMIN_SETTINGS_DATA = {
  organizationName: 'Acme Global Technologies Inc.',
  tenantId: 'tn_9812_prod',
  plan: 'Enterprise Omnichannel SaaS',
  assignmentRule: 'Least-Load & Skill Based',
  slaPolicy: 'Standard Enterprise (15m P1 / 1h P2)',
  businessHours: '09:00 - 18:00 UTC (Mon-Fri)',
  autoCloseHours: '48 Hours after Resolution',
  aiDeflectionEnabled: true,
  emailChannelConnected: true,
  whatsappChannelConnected: true,
  chatWidgetActive: true,
};


export const ANALYTICS_METRICS = {
  avgFirstResponseTime: '8m 42s',
  slaComplianceRate: '96.4%',
  avgResolutionTime: '1h 38m',
  csatScore: '4.9',
  csatTotalReviews: '847',
  channelBreakdown: [
    { channel: 'Email', count: 48, percentage: 43, color: '#14213D' },
    { channel: 'WhatsApp', count: 31, percentage: 27, color: '#16B8A6' },
    { channel: 'Live Chat', count: 22, percentage: 20, color: '#1F3155' },
    { channel: 'Web Form', count: 12, percentage: 10, color: '#697586' },
  ],
};
