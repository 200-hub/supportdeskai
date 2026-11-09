// Offline-First Sync Manager and Background Reconciler
import { api } from './apiClient';
import { offlineStorage } from './offlineStorage';
import { toUiTicket } from './ticketService';

// 4xx other than auth/timeout/rate-limit will never succeed on retry.
const isPermanentFailure = (res) =>
  !res.isNetworkError && res.status >= 400 && res.status < 500 && ![401, 408, 429].includes(res.status);

export const syncManager = {
  /**
   * Fetch tickets with offline fallback:
   * Tries network first; if offline, returns cached tickets.
   */
  async loadTickets(token) {
    const res = await api.get('/api/v1/tickets/', { token });
    if (res.success && res.data && res.data.tickets) {
      const tickets = res.data.tickets.map(toUiTicket);
      await offlineStorage.cacheTickets(tickets);
      return { online: true, tickets };
    }

    // Network offline or server unreachable - return cached data
    const cached = await offlineStorage.getCachedTickets();
    return {
      online: false,
      tickets: cached || [],
      error: res.error,
    };
  },

  /**
   * Optimistically creates a ticket locally and enqueues sync if offline.
   */
  async createTicket(ticketData, token) {
    const tempId = `SD-${Date.now().toString(16).slice(-4).toUpperCase()}`;
    const optimisticTicket = {
      id: tempId,
      subject: ticketData.subject,
      description: ticketData.description,
      category: ticketData.category || 'General Support',
      channel: ticketData.channel || 'web',
      status: 'open',
      priority: ticketData.priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slaRemaining: '2h',
      slaStatus: 'safe',
      syncStatus: 'pending',
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderType: 'customer',
          senderName: ticketData.customerName || 'Customer',
          content: ticketData.description,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    // Cache locally immediately (optimistic UI update)
    const existing = (await offlineStorage.getCachedTickets()) || [];
    await offlineStorage.cacheTickets([optimisticTicket, ...existing]);

    // Attempt online API call
    if (token) {
      const res = await api.post('/api/v1/tickets/', ticketData, { token });
      if (res.success && res.data) {
        // Replace temp ticket with confirmed server ticket
        const serverTicket = { ...toUiTicket(res.data), syncStatus: 'synced' };
        const updated = (await offlineStorage.getCachedTickets()) || [];
        const reconciled = updated.map((t) => (t.id === tempId ? serverTicket : t));
        await offlineStorage.cacheTickets(reconciled);
        return { success: true, online: true, ticket: serverTicket };
      }
      if (isPermanentFailure(res)) {
        // Rejected by the server (validation, permissions): don't queue it forever.
        const current = (await offlineStorage.getCachedTickets()) || [];
        await offlineStorage.cacheTickets(current.filter((t) => t.id !== tempId));
        return { success: false, online: true, error: res.error, ticket: null };
      }
    }

    // Offline: Enqueue for sync when connection restores
    await offlineStorage.enqueueMutation('CREATE_TICKET', {
      tempId,
      ticketData,
    });

    return {
      success: true,
      online: false,
      ticket: optimisticTicket,
      message: 'Ticket saved locally. Will synchronize once connected.',
    };
  },

  /**
   * Post message offline-first
   */
  async addMessage(ticketId, messageData, token) {
    const optimisticMessage = {
      id: `msg-${Date.now()}`,
      ticketId,
      content: messageData.content,
      senderType: messageData.sender_type || messageData.senderType || 'customer',
      senderName: messageData.sender_name || messageData.senderName || 'Me',
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    // Update local cache
    const existingTickets = (await offlineStorage.getCachedTickets()) || [];
    const target = existingTickets.find((t) => t.id === ticketId);
    if (target) {
      target.messages = target.messages || [];
      target.messages.push(optimisticMessage);
      await offlineStorage.cacheTickets(existingTickets);
    }

    if (token) {
      const res = await api.post(`/api/v1/tickets/${ticketId}/messages`, messageData, { token });
      if (res.success && res.data) {
        optimisticMessage.syncStatus = 'synced';
        optimisticMessage.id = res.data.id;
        return { success: true, online: true, message: optimisticMessage };
      }
      if (isPermanentFailure(res)) {
        return { success: false, online: true, error: res.error, message: optimisticMessage };
      }
    }

    // Offline: queue mutation
    await offlineStorage.enqueueMutation('ADD_MESSAGE', {
      ticketId,
      messageData,
    });

    return { success: true, online: false, message: optimisticMessage };
  },

  /**
   * Process all pending mutations in the queue
   */
  async processOfflineQueue(token) {
    if (!token) return { processed: 0, remaining: 0 };

    const queue = await offlineStorage.getQueue();
    if (queue.length === 0) return { processed: 0, remaining: 0 };

    let processedCount = 0;

    for (const mutation of queue) {
      try {
        let res = null;
        if (mutation.type === 'CREATE_TICKET') {
          res = await api.post('/api/v1/tickets/', mutation.payload.ticketData, { token });
        } else if (mutation.type === 'ADD_MESSAGE') {
          res = await api.post(
            `/api/v1/tickets/${mutation.payload.ticketId}/messages`,
            mutation.payload.messageData,
            { token }
          );
        } else if (mutation.type === 'UPDATE_STATUS') {
          res = await api.patch(
            `/api/v1/tickets/${mutation.payload.ticketId}`,
            mutation.payload.updateData,
            { token }
          );
        }

        if (res && res.success) {
          await offlineStorage.removeMutation(mutation.id);
          processedCount++;
        } else if (res && isPermanentFailure(res)) {
          console.warn(`[SyncManager] Dropping rejected mutation ${mutation.id}: ${res.error}`);
          await offlineStorage.removeMutation(mutation.id);
        }
      } catch (err) {
        console.warn(`[SyncManager] Error processing mutation ${mutation.id}:`, err);
      }
    }

    // Refresh tickets from server after processing queue
    const latest = await api.get('/api/v1/tickets/', { token });
    if (latest.success && latest.data?.tickets) {
      await offlineStorage.cacheTickets(latest.data.tickets.map(toUiTicket));
    }

    const remaining = (await offlineStorage.getQueue()).length;
    return { processed: processedCount, remaining };
  },
};

