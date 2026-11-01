import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { SettingsItem } from '../components/common/SettingsItem';
import { AppButton } from '../components/common/AppButton';
import { AppTextInput } from '../components/common/AppTextInput';
import { Avatar } from '../components/common/Avatar';
import { AGENT_TEAM, ADMIN_SETTINGS_DATA } from '../data/mockData';
import { adminService } from '../services/adminService';

const STRATEGY_MAP = {
  'Round-Robin': 'round_robin',
  'Least-Load & Skill': 'least_loaded',
  'Sticky Account Owner': 'skills_based',
};

const REVERSE_STRATEGY_MAP = {
  round_robin: 'Round-Robin',
  least_loaded: 'Least-Load & Skill',
  skills_based: 'Sticky Account Owner',
};

export const AdminSettingsScreen = ({
  user,
  onNavigateBack,
  onSwitchRole,
  onLogout,
}) => {
  // Tenant & Workspace state
  const [tenant, setTenant] = useState({
    id: ADMIN_SETTINGS_DATA.tenantId,
    name: ADMIN_SETTINGS_DATA.organizationName,
    slug: 'default-tenant',
    plan: ADMIN_SETTINGS_DATA.plan,
  });

  // Routing and SLA states
  const [assignmentRule, setAssignmentRule] = useState('Least-Load & Skill');
  const [slaPolicies, setSlaPolicies] = useState([]);
  const [teamMembers, setTeamMembers] = useState(AGENT_TEAM);
  const [channels, setChannels] = useState([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);

  // Workflow toggle state (preserved)
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(true);
  const [aiDeflectionEnabled, setAiDeflectionEnabled] = useState(true);
  const [emailSync, setEmailSync] = useState(true);
  const [whatsappSync, setWhatsappSync] = useState(true);

  // Modal states
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editWorkspacePlan, setEditWorkspacePlan] = useState('');
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [slugCheckInput, setSlugCheckInput] = useState('');
  const [slugCheckResult, setSlugCheckResult] = useState(null);

  const [isSLAModalOpen, setIsSLAModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [editFirstResponse, setEditFirstResponse] = useState('15');
  const [editResolution, setEditResolution] = useState('120');
  const [isSavingSLA, setIsSavingSLA] = useState(false);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const assignmentOptions = [
    'Round-Robin',
    'Least-Load & Skill',
    'Sticky Account Owner',
  ];

  // Load backend settings
  const fetchAdminData = useCallback(async () => {
    try {
      const [tenantRes, slaRes, routingRes, usersRes, channelsRes] = await Promise.all([
        adminService.getCurrentTenant(),
        adminService.getSLAPolicies(),
        adminService.getRoutingRules(),
        adminService.getWorkspaceUsers(),
        adminService.getChannels(),
      ]);

      if (tenantRes.success && tenantRes.data) {
        setTenant(tenantRes.data);
        setIsLiveConnected(true);
      }

      if (slaRes.success && Array.isArray(slaRes.data) && slaRes.data.length > 0) {
        setSlaPolicies(slaRes.data);
      }

      if (routingRes.success && Array.isArray(routingRes.data) && routingRes.data.length > 0) {
        const activeRule = routingRes.data.find((r) => r.is_active) || routingRes.data[0];
        if (activeRule && REVERSE_STRATEGY_MAP[activeRule.strategy]) {
          setAssignmentRule(REVERSE_STRATEGY_MAP[activeRule.strategy]);
        }
      }

      if (usersRes.success && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
        setTeamMembers(
          usersRes.data.map((u) => ({
            id: u.id,
            name: u.name,
            role:
              u.role === 'admin'
                ? 'Workspace Admin'
                : u.role === 'agent'
                ? 'Support Agent'
                : 'Customer',
            status: u.is_active ? 'Online' : 'Offline',
            initials: u.avatar_initials || u.name.slice(0, 2).toUpperCase(),
          }))
        );
      }

      if (channelsRes.success && Array.isArray(channelsRes.data)) {
        setChannels(channelsRes.data);
        const emailChan = channelsRes.data.find((c) => c.type === 'email');
        if (emailChan) setEmailSync(emailChan.is_active);
        const waChan = channelsRes.data.find((c) => c.type === 'whatsapp');
        if (waChan) setWhatsappSync(waChan.is_active);
      }
    } catch (_) {
      setIsLiveConnected(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAdminData();
  };

  // Change routing strategy
  const handleSelectRule = async (ruleOption) => {
    setAssignmentRule(ruleOption);
    const backendStrategy = STRATEGY_MAP[ruleOption] || 'least_loaded';
    setIsSavingStrategy(true);

    try {
      const res = await adminService.setActiveRoutingStrategy(backendStrategy);
      if (res.success) {
        Alert.alert(
          'Routing Strategy Updated',
          `Ticket assignment strategy persisted to backend: ${ruleOption}`
        );
      } else {
        Alert.alert(
          'Notice (Offline)',
          `Strategy set locally to ${ruleOption}. Backend sync: ${res.error || 'Unavailable'}`
        );
      }
    } catch (err) {
      Alert.alert('Routing Error', err.message || 'Failed to persist strategy.');
    } finally {
      setIsSavingStrategy(false);
    }
  };

  // Open workspace modal
  const handleOpenWorkspaceModal = () => {
    setEditWorkspaceName(tenant.name || '');
    setEditWorkspacePlan(tenant.plan || 'Standard');
    setSlugCheckInput('');
    setSlugCheckResult(null);
    setIsWorkspaceModalOpen(true);
  };

  // Check slug
  const handleCheckSlug = async () => {
    if (!slugCheckInput.trim()) {
      Alert.alert('Validation', 'Please enter a slug name to verify availability.');
      return;
    }
    const res = await adminService.checkSlug(slugCheckInput.trim());
    if (res.success) {
      setSlugCheckResult(res.isAvailable ? 'available' : 'taken');
    } else {
      Alert.alert('Check Slug Failed', res.error || 'Unable to check slug');
    }
  };

  // Save workspace
  const handleSaveWorkspace = async () => {
    if (!editWorkspaceName.trim()) {
      Alert.alert('Validation Error', 'Organization name cannot be empty.');
      return;
    }

    setIsSavingWorkspace(true);
    try {
      const res = await adminService.updateTenant({
        name: editWorkspaceName.trim(),
        plan: editWorkspacePlan,
      });

      if (res.success && res.data) {
        setTenant(res.data);
        setIsWorkspaceModalOpen(false);
        Alert.alert('Success', 'Workspace settings updated successfully.');
      } else {
        Alert.alert('Update Failed', res.error || 'Could not update workspace settings.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  // Open SLA edit modal
  const handleOpenSLAModal = (policy) => {
    setSelectedPolicy(policy);
    setEditFirstResponse(String(policy.first_response_time_minutes || 15));
    setEditResolution(String(policy.resolution_time_minutes || 120));
    setIsSLAModalOpen(true);
  };

  // Save SLA policy
  const handleSaveSLA = async () => {
    if (!selectedPolicy) return;
    const firstMins = parseInt(editFirstResponse, 10);
    const resMins = parseInt(editResolution, 10);

    if (isNaN(firstMins) || firstMins < 1 || isNaN(resMins) || resMins < 1) {
      Alert.alert('Validation Error', 'Target minutes must be valid numbers greater than 0.');
      return;
    }

    setIsSavingSLA(true);
    try {
      const payload = {
        ...selectedPolicy,
        first_response_time_minutes: firstMins,
        resolution_time_minutes: resMins,
      };

      const res = await adminService.saveSLAPolicy(payload);
      if (res.success && res.data) {
        setSlaPolicies((prev) =>
          prev.map((p) => (p.id === res.data.id ? res.data : p))
        );
        setIsSLAModalOpen(false);
        Alert.alert('SLA Policy Saved', `Updated policy: ${res.data.name}`);
      } else {
        Alert.alert('Save Failed', res.error || 'Could not update SLA policy.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An error occurred while saving SLA.');
    } finally {
      setIsSavingSLA(false);
    }
  };

  // Send invitation
  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      Alert.alert('Validation', 'Please provide a valid agent email address.');
      return;
    }

    setIsSendingInvite(true);
    try {
      const res = await adminService.inviteAgent(inviteEmail.trim(), inviteRole);
      if (res.success) {
        setIsInviteModalOpen(false);
        setInviteEmail('');
        fetchAdminData();
        Alert.alert(
          'Invitation Sent',
          `Invitation token generated and dispatched for ${inviteEmail.trim()}.`
        );
      } else {
        Alert.alert('Invitation Failed', res.error || 'Could not send invitation.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to dispatch agent invitation.');
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Channel toggles
  const handleToggleEmailChannel = async (newValue) => {
    setEmailSync(newValue);
    try {
      const emailChan = channels.find((c) => c.type === 'email');
      if (emailChan) {
        await adminService.updateChannel(emailChan.id, { is_active: newValue });
      } else {
        const createRes = await adminService.createChannel({
          name: 'AWS SES Inbound Email',
          type: 'email',
          is_active: newValue,
          config_json: JSON.stringify({ email: 'support@acmeglobal.com' }),
        });
        if (createRes.success && createRes.data) {
          setChannels((prev) => [...prev, createRes.data]);
        }
      }
    } catch (_) {}
  };

  const handleToggleWhatsappChannel = async (newValue) => {
    setWhatsappSync(newValue);
    try {
      const waChan = channels.find((c) => c.type === 'whatsapp');
      if (waChan) {
        await adminService.updateChannel(waChan.id, { is_active: newValue });
      } else {
        const createRes = await adminService.createChannel({
          name: 'WhatsApp Cloud API',
          type: 'whatsapp',
          is_active: newValue,
          config_json: JSON.stringify({ phone_number: '+18005550199' }),
        });
        if (createRes.success && createRes.data) {
          setChannels((prev) => [...prev, createRes.data]);
        }
      }
    } catch (_) {}
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Admin Settings Console"
        subtitle="Tenant policies, routing, channels & team"
        showBack={!!onNavigateBack}
        onBack={onNavigateBack}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSwitchRole}
            style={styles.roleChip}
          >
            <Ionicons name="swap-horizontal" size={13} color={COLORS.accentTeal} style={{ marginRight: 3 }} />
            <Text style={styles.roleChipText}>Role: Admin</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.accentTeal]}
            tintColor={COLORS.accentTeal}
          />
        }
      >
        {/* Backend Connectivity Status Banner */}
        <View style={[styles.statusBanner, isLiveConnected ? styles.bannerConnected : styles.bannerOffline]}>
          <Ionicons
            name={isLiveConnected ? 'shield-checkmark' : 'cloud-offline-outline'}
            size={18}
            color={isLiveConnected ? '#065F46' : '#92400E'}
            style={{ marginRight: 8 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: isLiveConnected ? '#065F46' : '#92400E' }]}>
              {isLiveConnected ? 'Backend Live Synced' : 'Offline / Standalone Mode'}
            </Text>
            <Text style={[styles.bannerSub, { color: isLiveConnected ? '#047857' : '#B45309' }]}>
              {isLiveConnected
                ? 'Connected to FastAPI backend. SLA, Routing & Workspace policies sync in real time.'
                : 'Using cached local policies. Connect network to sync live PostgreSQL changes.'}
            </Text>
          </View>
        </View>

        {/* Tenant Profile Banner */}
        <View style={styles.tenantCard}>
          <View style={styles.tenantTopRow}>
            <View style={styles.tenantIconBox}>
              <Ionicons name="business" size={24} color={COLORS.white} />
            </View>
            <View style={styles.tenantTextGroup}>
              <Text style={styles.tenantName}>{tenant.name || ADMIN_SETTINGS_DATA.organizationName}</Text>
              <Text style={styles.tenantSlug}>
                Slug: {tenant.slug || 'default-tenant'} • ID: {tenant.id ? tenant.id.slice(0, 8) : 'tenant-01'}
              </Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{tenant.plan || ADMIN_SETTINGS_DATA.plan}</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenWorkspaceModal}
              style={styles.editTenantButton}
            >
              <Ionicons name="pencil" size={16} color={COLORS.white} />
              <Text style={styles.editTenantButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Team and Agent Management */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Support Team Members ({teamMembers.length})</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsInviteModalOpen(true)}
            >
              <Text style={styles.linkText}>+ Invite Agent</Text>
            </TouchableOpacity>
          </View>

          {teamMembers.map((agent) => (
            <View key={agent.id} style={styles.agentRow}>
              <Avatar
                initials={
                  agent.initials ||
                  agent.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                }
                size={36}
                bgColor={COLORS.secondaryNavy}
              />
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{agent.name}</Text>
                <Text style={styles.agentRole}>{agent.role}</Text>
              </View>
              <View style={styles.agentStatusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: agent.status === 'Online' ? COLORS.success : COLORS.warning },
                  ]}
                />
                <Text style={styles.statusText}>{agent.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ticket Assignment Settings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Ticket Assignment Strategy</Text>
            {isSavingStrategy && <ActivityIndicator size="small" color={COLORS.accentTeal} />}
          </View>
          <Text style={styles.sectionSubtitle}>
            Configured under /api/v1/routing/rules. Strategy automatically routes incoming tickets.
          </Text>

          {assignmentOptions.map((opt) => {
            const isSelected = assignmentRule === opt;
            return (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.7}
                onPress={() => handleSelectRule(opt)}
                style={[
                  styles.radioRow,
                  isSelected && styles.radioRowSelected,
                ]}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SLA Configuration Entry */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>SLA Target Policies</Text>
            <Text style={styles.sectionSubBadge}>Synced /api/v1/sla</Text>
          </View>

          {slaPolicies.length > 0 ? (
            slaPolicies.map((policy, idx) => (
              <TouchableOpacity
                key={policy.id || idx}
                activeOpacity={0.7}
                onPress={() => handleOpenSLAModal(policy)}
                style={[
                  styles.slaConfigRow,
                  idx === slaPolicies.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.slaKey}>{policy.name} ({policy.priority.toUpperCase()})</Text>
                  <Text style={styles.slaSub}>
                    First Response: {policy.first_response_time_minutes}m • Resolution: {policy.resolution_time_minutes}m
                  </Text>
                </View>
                <View style={styles.slaTimePill}>
                  <Text style={styles.slaTimePillText}>{policy.first_response_time_minutes}m</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  handleOpenSLAModal({
                    id: 'sla-urgent',
                    name: 'Urgent (P1) First Response',
                    priority: 'urgent',
                    first_response_time_minutes: 15,
                    resolution_time_minutes: 120,
                  })
                }
                style={styles.slaConfigRow}
              >
                <View>
                  <Text style={styles.slaKey}>Urgent (P1) First Response</Text>
                  <Text style={styles.slaSub}>Target: 15 minutes • 2h resolution</Text>
                </View>
                <View style={styles.slaTimePill}>
                  <Text style={styles.slaTimePillText}>15m</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  handleOpenSLAModal({
                    id: 'sla-high',
                    name: 'High (P2) First Response',
                    priority: 'high',
                    first_response_time_minutes: 60,
                    resolution_time_minutes: 360,
                  })
                }
                style={styles.slaConfigRow}
              >
                <View>
                  <Text style={styles.slaKey}>High (P2) First Response</Text>
                  <Text style={styles.slaSub}>Target: 1 hour • 6h resolution</Text>
                </View>
                <View style={styles.slaTimePill}>
                  <Text style={styles.slaTimePillText}>1h</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          <View style={[styles.slaConfigRow, { borderBottomWidth: 0, marginTop: SPACING.xs }]}>
            <View>
              <Text style={styles.slaKey}>Business Hours Schedule</Text>
              <Text style={styles.slaSub}>{ADMIN_SETTINGS_DATA.businessHours}</Text>
            </View>
            <Ionicons name="calendar-outline" size={18} color={COLORS.secondaryNavy} />
          </View>
        </View>

        {/* Automation Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Automation & Deflection Workflows</Text>

          <SettingsItem
            icon="sparkles-outline"
            title="AI RAG Deflection Engine"
            subtitle="Auto-resolve routine questions with knowledge citations"
            rightType="switch"
            switchValue={aiDeflectionEnabled}
            onSwitchChange={setAiDeflectionEnabled}
          />

          <SettingsItem
            icon="timer-outline"
            title="Auto-Close Inactive Tickets"
            subtitle="Mark resolved tickets closed after 48h of customer silence"
            rightType="switch"
            switchValue={autoCloseEnabled}
            onSwitchChange={setAutoCloseEnabled}
            showBorder={false}
          />
        </View>

        {/* Channel Integrations */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Omnichannel Integrations</Text>

          <SettingsItem
            icon="mail-outline"
            title="AWS SES Inbound Email"
            subtitle="support@acmeglobal.com"
            rightType="switch"
            switchValue={emailSync}
            onSwitchChange={handleToggleEmailChannel}
          />

          <SettingsItem
            icon="logo-whatsapp"
            title="WhatsApp Cloud API"
            subtitle="+1 (800) 555-0199 (Verified Meta WABA)"
            rightType="switch"
            switchValue={whatsappSync}
            onSwitchChange={handleToggleWhatsappChannel}
          />

          <SettingsItem
            icon="chatbubbles-outline"
            title="Live Chat Embed Widget"
            subtitle="Shadow DOM Preact bundle (Active on web)"
            rightType="badge"
            badgeText="Online"
            badgeColor={COLORS.success}
            showBorder={false}
          />
        </View>

        {/* Sign Out Button */}
        <AppButton
          title="Sign Out of Admin Console"
          onPress={onLogout}
          variant="outline"
          size="lg"
          icon={<Ionicons name="log-out-outline" size={18} color={COLORS.error} />}
          style={styles.logoutBtn}
          textStyle={{ color: COLORS.error }}
        />
      </ScrollView>

      {/* Edit Workspace Modal */}
      <Modal visible={isWorkspaceModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Workspace Settings</Text>
              <TouchableOpacity onPress={() => setIsWorkspaceModalOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.secondaryText} />
              </TouchableOpacity>
            </View>

            <AppTextInput
              label="Organization Name"
              value={editWorkspaceName}
              onChangeText={setEditWorkspaceName}
              placeholder="e.g. Acme Global Support"
            />

            <Text style={styles.inputLabel}>Subscription Plan</Text>
            <View style={styles.planSelectRow}>
              {['Standard', 'Professional', 'Enterprise'].map((plan) => (
                <TouchableOpacity
                  key={plan}
                  activeOpacity={0.7}
                  onPress={() => setEditWorkspacePlan(plan)}
                  style={[
                    styles.planOptionButton,
                    editWorkspacePlan === plan && styles.planOptionButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.planOptionText,
                      editWorkspacePlan === plan && styles.planOptionTextSelected,
                    ]}
                  >
                    {plan}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginTop: SPACING.md }}>
              <AppTextInput
                label="Check Slug Availability"
                value={slugCheckInput}
                onChangeText={(t) => {
                  setSlugCheckInput(t);
                  setSlugCheckResult(null);
                }}
                placeholder="e.g. acme-support"
              />
              <View style={styles.slugCheckRow}>
                <AppButton
                  title="Verify Slug"
                  size="sm"
                  variant="outline"
                  onPress={handleCheckSlug}
                  style={{ alignSelf: 'flex-start' }}
                />
                {slugCheckResult === 'available' && (
                  <Text style={styles.slugSuccessText}>✓ Slug is available!</Text>
                )}
                {slugCheckResult === 'taken' && (
                  <Text style={styles.slugErrorText}>✕ Slug is already taken</Text>
                )}
              </View>
            </View>

            <View style={styles.modalActions}>
              <AppButton
                title="Cancel"
                variant="ghost"
                onPress={() => setIsWorkspaceModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <AppButton
                title="Save Settings"
                variant="primary"
                loading={isSavingWorkspace}
                onPress={handleSaveWorkspace}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit SLA Policy Modal */}
      <Modal visible={isSLAModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure SLA Policy</Text>
              <TouchableOpacity onPress={() => setIsSLAModalOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.secondaryText} />
              </TouchableOpacity>
            </View>

            {selectedPolicy && (
              <>
                <Text style={styles.policyModalName}>{selectedPolicy.name}</Text>
                <Text style={styles.policyModalPriority}>
                  Priority Tier: {selectedPolicy.priority ? selectedPolicy.priority.toUpperCase() : 'URGENT'}
                </Text>

                <AppTextInput
                  label="First Response Target (minutes)"
                  value={editFirstResponse}
                  onChangeText={setEditFirstResponse}
                  keyboardType="numeric"
                  placeholder="e.g. 15"
                />

                <AppTextInput
                  label="Resolution Deadline Target (minutes)"
                  value={editResolution}
                  onChangeText={setEditResolution}
                  keyboardType="numeric"
                  placeholder="e.g. 120"
                />
              </>
            )}

            <View style={styles.modalActions}>
              <AppButton
                title="Cancel"
                variant="ghost"
                onPress={() => setIsSLAModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <AppButton
                title="Save Policy"
                variant="primary"
                loading={isSavingSLA}
                onPress={handleSaveSLA}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Invite Agent Modal */}
      <Modal visible={isInviteModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Support Agent</Text>
              <TouchableOpacity onPress={() => setIsInviteModalOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.secondaryText} />
              </TouchableOpacity>
            </View>

            <AppTextInput
              label="Agent Work Email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="agent@company.com"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Role Permission</Text>
            <View style={styles.planSelectRow}>
              {['agent', 'admin'].map((role) => (
                <TouchableOpacity
                  key={role}
                  activeOpacity={0.7}
                  onPress={() => setInviteRole(role)}
                  style={[
                    styles.planOptionButton,
                    inviteRole === role && styles.planOptionButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.planOptionText,
                      inviteRole === role && styles.planOptionTextSelected,
                    ]}
                  >
                    {role.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <AppButton
                title="Cancel"
                variant="ghost"
                onPress={() => setIsInviteModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <AppButton
                title="Send Invite"
                variant="teal"
                loading={isSendingInvite}
                onPress={handleSendInvite}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryNavy,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  roleChipText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  statusBanner: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  bannerConnected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  bannerOffline: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  bannerTitle: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.bold,
  },
  bannerSub: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  tenantCard: {
    backgroundColor: COLORS.primaryNavy,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  tenantTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tenantIconBox: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.secondaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  tenantTextGroup: {
    flex: 1,
  },
  tenantName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  tenantSlug: {
    fontSize: TYPOGRAPHY.xs,
    color: '#94A3B8',
    marginTop: 2,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondaryNavy,
    borderRadius: RADIUS.xs,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  planBadgeText: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.bold,
  },
  editTenantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  editTenantButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sm + 1,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginBottom: SPACING.md,
  },
  sectionSubBadge: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.bold,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  linkText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.bold,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  agentInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  agentName: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
  },
  agentRole: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 1,
  },
  agentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.mainText,
    fontWeight: TYPOGRAPHY.medium,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs + 2,
  },
  radioRowSelected: {
    borderColor: COLORS.primaryNavy,
    backgroundColor: '#EFF6FF',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.secondaryText,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  radioCircleSelected: {
    borderColor: COLORS.primaryNavy,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryNavy,
  },
  radioLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
  },
  radioLabelSelected: {
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
  },
  slaConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  slaKey: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
  },
  slaSub: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  slaTimePill: {
    backgroundColor: '#CCFBF1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xs,
  },
  slaTimePillText: {
    fontSize: TYPOGRAPHY.xs,
    color: '#0F766E',
    fontWeight: TYPOGRAPHY.bold,
  },
  logoutBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.secondaryText,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  planSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  planOptionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
  },
  planOptionButtonSelected: {
    borderColor: COLORS.accentTeal,
    backgroundColor: '#ECFDF5',
  },
  planOptionText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    fontWeight: TYPOGRAPHY.medium,
  },
  planOptionTextSelected: {
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.bold,
  },
  slugCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  slugSuccessText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.bold,
  },
  slugErrorText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.bold,
  },
  policyModalName: {
    fontSize: TYPOGRAPHY.sm + 1,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
    marginBottom: 2,
  },
  policyModalPriority: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
  },
});
