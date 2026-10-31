// Admin Settings & Policy Service for SupportDeskAI
import { api } from './apiClient';
import { ADMIN_SETTINGS_DATA } from '../data/mockData';

export const adminService = {
  /**
   * Fetch current tenant/workspace settings
   */
  async getCurrentTenant() {
    const res = await api.get('/api/v1/tenants/current');
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to load workspace settings',
      data: {
        id: ADMIN_SETTINGS_DATA.tenantId,
        name: ADMIN_SETTINGS_DATA.organizationName,
        slug: 'default-tenant',
        plan: ADMIN_SETTINGS_DATA.plan,
      },
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Check slug availability
   */
  async checkSlug(slug) {
    const res = await api.get(`/api/v1/tenants/check-slug?slug=${encodeURIComponent(slug)}`);
    if (res.success && res.data) {
      return { success: true, isAvailable: res.data.is_available };
    }
    return { success: false, error: res.error || 'Failed to verify slug' };
  },

  /**
   * Update workspace branding/plan
   */
  async updateTenant(payload) {
    const res = await api.patch('/api/v1/tenants/current', payload);
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return { success: false, error: res.error || 'Failed to update workspace settings' };
  },

  /**
   * Fetch SLA policies
   */
  async getSLAPolicies() {
    const res = await api.get('/api/v1/sla/policies');
    if (res.success && Array.isArray(res.data)) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to load SLA policies',
      data: [],
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Update or create SLA policy
   */
  async saveSLAPolicy(policy) {
    if (policy.id) {
      const res = await api.patch(`/api/v1/sla/policies/${policy.id}`, {
        name: policy.name,
        priority: policy.priority,
        first_response_time_minutes: policy.first_response_time_minutes,
        resolution_time_minutes: policy.resolution_time_minutes,
        business_hours_only: policy.business_hours_only ?? true,
        is_active: policy.is_active ?? true,
      });
      return res;
    }
    const res = await api.post('/api/v1/sla/policies', policy);
    return res;
  },

  /**
   * Retrieve a single SLA policy by ID
   */
  async getSLAPolicy(policyId) {
    const res = await api.get(`/api/v1/sla/policies/${policyId}`);
    return res;
  },

  /**
   * Delete an SLA policy by ID
   */
  async deleteSLAPolicy(policyId) {
    const res = await api.delete(`/api/v1/sla/policies/${policyId}`);
    return res;
  },

  /**
   * Fetch routing rules
   */
  async getRoutingRules() {
    const res = await api.get('/api/v1/routing/rules');
    if (res.success && Array.isArray(res.data)) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to load routing rules',
      data: [],
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Update active routing strategy
   */
  async setActiveRoutingStrategy(strategy, name = null) {
    const res = await api.patch(`/api/v1/routing/active-strategy?strategy=${encodeURIComponent(strategy)}`);
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    // Fallback: POST to create routing rule
    const postRes = await api.post('/api/v1/routing/rules', {
      name: name || `Strategy ${strategy}`,
      strategy,
      is_active: true,
      priority_order: 1,
    });
    return postRes;
  },

  /**
   * Create a new routing rule
   */
  async createRoutingRule(ruleData) {
    const res = await api.post('/api/v1/routing/rules', ruleData);
    return res;
  },

  /**
   * Retrieve a single routing rule by ID
   */
  async getRoutingRule(ruleId) {
    const res = await api.get(`/api/v1/routing/rules/${ruleId}`);
    return res;
  },

  /**
   * Update an existing routing rule by ID
   */
  async updateRoutingRule(ruleId, ruleData) {
    const res = await api.patch(`/api/v1/routing/rules/${ruleId}`, ruleData);
    return res;
  },

  /**
   * Delete a routing rule by ID
   */
  async deleteRoutingRule(ruleId) {
    const res = await api.delete(`/api/v1/routing/rules/${ruleId}`);
    return res;
  },

  /**
   * Invite an agent to workspace
   */
  async inviteAgent(email, role = 'agent') {
    const res = await api.post('/api/v1/tenants/invite', { email, role });
    return res;
  },

  /**
   * Fetch workspace users
   */
  async getWorkspaceUsers(role = null, search = null) {
    let url = '/api/v1/tenants/users';
    const params = [];
    if (role) params.push(`role=${encodeURIComponent(role)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await api.get(url);
    if (res.success && Array.isArray(res.data)) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to load workspace users',
      data: [],
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Create workspace user
   */
  async createWorkspaceUser(userData) {
    return await api.post('/api/v1/tenants/users', userData);
  },

  /**
   * Update workspace user
   */
  async updateWorkspaceUser(userId, data) {
    return await api.patch(`/api/v1/tenants/users/${userId}`, data);
  },

  /**
   * Delete workspace user
   */
  async deleteWorkspaceUser(userId) {
    return await api.delete(`/api/v1/tenants/users/${userId}`);
  },

  /**
   * Fetch teams
   */
  async getTeams() {
    const res = await api.get('/api/v1/teams/');
    if (res.success && Array.isArray(res.data)) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to load teams',
      data: [],
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Create team
   */
  async createTeam(teamData) {
    return await api.post('/api/v1/teams/', teamData);
  },

  /**
   * Update team
   */
  async updateTeam(teamId, data) {
    return await api.patch(`/api/v1/teams/${teamId}`, data);
  },

  /**
   * Delete team
   */
  async deleteTeam(teamId) {
    return await api.delete(`/api/v1/teams/${teamId}`);
  },

  /**
   * Assign member to team
   */
  async assignTeamMember(teamId, userId) {
    return await api.post(`/api/v1/teams/${teamId}/members/${userId}`);
  },

  /**
   * Remove member from team
   */
  async removeTeamMember(teamId, userId) {
    return await api.delete(`/api/v1/teams/${teamId}/members/${userId}`);
  },

  /**
   * Fetch CRM contacts
   */
  async getContacts(search = null, orgId = null) {
    let url = '/api/v1/crm/contacts';
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (orgId) params.push(`organization_id=${encodeURIComponent(orgId)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await api.get(url);
    if (res.success && Array.isArray(res.data)) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to load contacts',
      data: [],
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Create CRM contact
   */
  async createContact(contactData) {
    return await api.post('/api/v1/crm/contacts', contactData);
  },

  /**
   * Update CRM contact
   */
  async updateContact(contactId, data) {
    return await api.patch(`/api/v1/crm/contacts/${contactId}`, data);
  },

  /**
   * Delete CRM contact
   */
  async deleteContact(contactId) {
    return await api.delete(`/api/v1/crm/contacts/${contactId}`);
  },

  /**
   * Fetch CRM organizations
   */
  async getOrganizations(search = null) {
    let url = '/api/v1/crm/organizations';
    if (search) url += `?search=${encodeURIComponent(search)}`;

    const res = await api.get(url);
    if (res.success && Array.isArray(res.data)) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to load organizations',
      data: [],
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Create CRM organization
   */
  async createOrganization(orgData) {
    return await api.post('/api/v1/crm/organizations', orgData);
  },

  /**
   * Update CRM organization
   */
  async updateOrganization(orgId, data) {
    return await api.patch(`/api/v1/crm/organizations/${orgId}`, data);
  },

  /**
   * Delete CRM organization
   */
  async deleteOrganization(orgId) {
    return await api.delete(`/api/v1/crm/organizations/${orgId}`);
  },

  /**
   * Fetch configured communication channels
   */
  async getChannels() {
    const res = await api.get('/api/v1/channels/');
    if (res.success && Array.isArray(res.data)) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || 'Failed to load channels',
      data: [],
      isOffline: res.isNetworkError,
    };
  },

  /**
   * Fetch single channel
   */
  async getChannel(channelId) {
    return await api.get(`/api/v1/channels/${channelId}`);
  },

  /**
   * Create channel
   */
  async createChannel(channelData) {
    return await api.post('/api/v1/channels/', channelData);
  },

  /**
   * Update channel
   */
  async updateChannel(channelId, data) {
    return await api.patch(`/api/v1/channels/${channelId}`, data);
  },

  /**
   * Delete channel
   */
  async deleteChannel(channelId) {
    return await api.delete(`/api/v1/channels/${channelId}`);
  },
};

