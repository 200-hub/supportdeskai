// Ticket Service for SupportDeskAI
import { api } from './apiClient';
import { toUiUser } from './authService';

// The API sends snake_case; screens read the camelCase mock shape (slaRemaining,
// assignedTo, customer.avatarInitials, tags[], senderType...). Add those fields
// alongside the server ones so both keep working.
const parseDate = (iso) =>
  // SQLite returns timestamps without a zone; they are UTC.
  iso ? new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`) : null;
const fmtTime = (iso) =>
  iso ? parseDate(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
const fmtDate = (iso) =>
  iso ? parseDate(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export const toUiMessage = (m) =>
  m && m.sender_type
    ? { ...m, senderType: m.sender_type, senderName: m.sender_name, time: fmtTime(m.created_at) }
    : m;

export const toUiTicket = (t) => {
  if (!t || !t.tenant_id) return t; // already UI-shaped (optimistic or cached)
  let tags = [];
  try {
    tags = JSON.parse(t.tags_json || '[]');
  } catch (_) {}
  return {
    ...t,
    customer: toUiUser(t.customer) || { name: 'Customer', email: '', company: '', avatarInitials: 'CU' },
    assignedTo: t.assignee?.name || '',
    slaRemaining: t.sla_remaining,
    slaStatus: t.sla_status,
    aiConfidence: t.ai_confidence,
    aiSuggestedAction: t.ai_suggested_action,
    createdDate: fmtDate(t.created_at),
    updatedAt: fmtDate(t.updated_at),
    tags,
    messages: (t.messages || []).map(toUiMessage),
    timeline: (t.timeline || []).map((e) => ({ ...e, time: fmtTime(e.created_at) })),
  };
};

const relTime = (iso) => {
  const mins = Math.round((Date.now() - parseDate(iso)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return fmtDate(iso);
};

// Notifications belong to the signed-in user; the server is the source of truth.
export const notificationService = {
  async list(token) {
    const res = await api.get('/api/v1/notifications/', { token });
    if (!res.success || !Array.isArray(res.data)) return null;
    return res.data.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      type: n.type,
      ticketId: n.ticket_id,
      isRead: n.is_read,
      time: relTime(n.created_at),
    }));
  },
  markRead: (id, token) => api.patch(`/api/v1/notifications/${id}/read`, {}, { token }),
};

export const ticketService = {
  /**
   * Fetch paginated list of tickets with optional status, priority, and channel filters.
   */
  async listTickets(params = {}, token = null) {
    const queryParts = [];
    if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params.priority) queryParts.push(`priority=${encodeURIComponent(params.priority)}`);
    if (params.channel) queryParts.push(`channel=${encodeURIComponent(params.channel)}`);
    if (params.page) queryParts.push(`page=${encodeURIComponent(params.page)}`);
    if (params.limit) queryParts.push(`limit=${encodeURIComponent(params.limit)}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await api.get(`/api/v1/tickets/${queryString}`, { token });
    if (res.success && res.data) {
      return { success: true, data: { ...res.data, tickets: (res.data.tickets || []).map(toUiTicket) } };
    }
    return {
      success: false,
      error: res.error || 'Failed to fetch tickets',
      data: { total: 0, page: 1, limit: 20, tickets: [] },
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Fetch single ticket details by ID.
   */
  async getTicket(ticketId, token = null) {
    const res = await api.get(`/api/v1/tickets/${ticketId}`, { token });
    if (res.success && res.data) {
      return { success: true, data: toUiTicket(res.data) };
    }
    return {
      success: false,
      error: res.error || `Failed to fetch ticket ${ticketId}`,
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Open a new support ticket.
   */
  async createTicket(ticketData, token = null) {
    const res = await api.post('/api/v1/tickets/', ticketData, { token });
    if (res.success && res.data) {
      return { success: true, data: toUiTicket(res.data) };
    }
    return {
      success: false,
      error: res.error || 'Failed to create ticket',
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Update an existing ticket (status, priority, assignee, team, tags, etc.).
   */
  async updateTicket(ticketId, updateData, token = null) {
    const res = await api.patch(`/api/v1/tickets/${ticketId}`, updateData, { token });
    if (res.success && res.data) {
      return { success: true, data: toUiTicket(res.data) };
    }
    return {
      success: false,
      error: res.error || `Failed to update ticket ${ticketId}`,
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Soft-delete a ticket (move to trash). Requires Agent or Admin.
   */
  async deleteTicket(ticketId, token = null) {
    const res = await api.delete(`/api/v1/tickets/${ticketId}`, { token });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || `Failed to delete ticket ${ticketId}`,
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Restore a soft-deleted ticket from trash.
   */
  async restoreTicket(ticketId, token = null) {
    const res = await api.post(`/api/v1/tickets/${ticketId}/restore`, {}, { token });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || `Failed to restore ticket ${ticketId}`,
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Mark ticket as spam and close.
   */
  async markSpam(ticketId, token = null) {
    const res = await api.post(`/api/v1/tickets/${ticketId}/spam`, {}, { token });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || `Failed to mark ticket ${ticketId} as spam`,
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Merge source ticket into target ticket.
   */
  async mergeTickets(sourceTicketId, targetTicketId, token = null) {
    const res = await api.post(`/api/v1/tickets/${sourceTicketId}/merge/${targetTicketId}`, {}, { token });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || `Failed to merge tickets ${sourceTicketId} -> ${targetTicketId}`,
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Get messages for a ticket thread.
   */
  async getMessages(ticketId, token = null) {
    const res = await api.get(`/api/v1/tickets/${ticketId}/messages`, { token });
    if (res.success && Array.isArray(res.data)) {
      return { success: true, data: res.data.map(toUiMessage) };
    }
    return {
      success: false,
      error: res.error || 'Failed to fetch messages',
      data: [],
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Send a reply message or internal note.
   */
  async addMessage(ticketId, messageData, token = null) {
    const res = await api.post(`/api/v1/tickets/${ticketId}/messages`, messageData, { token });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to send message',
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Retrieve audit timeline for a ticket.
   */
  async getTimeline(ticketId, token = null) {
    const res = await api.get(`/api/v1/tickets/${ticketId}/timeline`, { token });
    if (res.success && Array.isArray(res.data)) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to fetch ticket timeline',
      data: [],
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Report collision (viewing or typing on ticket).
   */
  async reportCollision(ticketId, isTyping = false, token = null) {
    const res = await api.post(
      `/api/v1/tickets/${ticketId}/collision?is_typing=${Boolean(isTyping)}`,
      {},
      { token }
    );
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to report collision',
    };
  },

  /**
   * Check collision status on ticket.
   */
  async checkCollision(ticketId, token = null) {
    const res = await api.get(`/api/v1/tickets/${ticketId}/collision`, { token });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to check collision',
      data: { active_agent: null, is_typing: false },
    };
  },

  /**
   * Evaluate SLA status, remaining time, and deadlines for a ticket.
   */
  async evaluateSLA(ticketId, token = null) {
    const res = await api.post(`/api/v1/sla/evaluate/${ticketId}`, {}, { token });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || `Failed to evaluate SLA for ticket ${ticketId}`,
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Auto-assign a ticket to eligible agent using routing engine
   */
  async autoAssignTicket(ticketId, strategy = null, token = null) {
    const query = strategy ? `?strategy=${encodeURIComponent(strategy)}` : '';
    const res = await api.post(`/api/v1/routing/assign/${ticketId}${query}`, {}, { token });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || `Failed to auto-assign ticket ${ticketId}`,
      isOffline: res.isNetworkError,
    };
  },
};

