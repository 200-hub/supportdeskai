import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { SettingsItem } from '../components/common/SettingsItem';
import { AppButton } from '../components/common/AppButton';
import { AppTextInput } from '../components/common/AppTextInput';
import { Avatar } from '../components/common/Avatar';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { EmptyState } from '../components/common/EmptyState';
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

// What the admin reads; the keys above stay as the stored values.
const STRATEGY_LABELS = {
  'Round-Robin': 'Round robin',
  'Least-Load & Skill': 'Least loaded, matched by skill',
  'Sticky Account Owner': 'Sticky account owner',
};

// Shown until the server returns its own SLA policies.
const FALLBACK_SLA_POLICIES = [
  {
    id: 'sla-urgent',
    name: 'Urgent (P1) First Response',
    priority: 'urgent',
    first_response_time_minutes: 15,
    resolution_time_minutes: 120,
  },
  {
    id: 'sla-high',
    name: 'High (P2) First Response',
    priority: 'high',
    first_response_time_minutes: 60,
    resolution_time_minutes: 360,
  },
];

const PLAN_OPTIONS = ['Standard', 'Professional', 'Enterprise'].map((p) => ({ value: p, label: p }));
const INVITE_ROLE_OPTIONS = [
  { value: 'agent', label: 'Agent' },
  { value: 'admin', label: 'Admin' },
];

const formatMinutes = (mins) => {
  const n = Number(mins) || 0;
  return n >= 60 && n % 60 === 0 ? `${n / 60}h` : `${n}m`;
};

const strategyLabel = (key) => STRATEGY_LABELS[key] || key;

const SectionHeading = ({ title, help, children }) => (
  <View style={styles.sectionHead}>
    <View style={styles.sectionHeadRow}>
      <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.sectionTitle]}>
        {title}
      </Text>
      {children}
    </View>
    {help ? <Text style={[TYPE.bodySmall, styles.sectionHelp]}>{help}</Text> : null}
  </View>
);

const InfoRow = ({ label, value, numeric = false, last = false }) => (
  <View style={[styles.infoRow, !last && styles.rowBorder]}>
    <Text style={[TYPE.body, styles.muted]}>{label}</Text>
    <Text style={[numeric ? TYPE.numeric : TYPE.bodyStrong, styles.infoValue]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

// Material segmented button: one choice from a short set.
const Segmented = ({ label, options, value, onChange }) => (
  <View style={styles.field}>
    <Text style={[TYPE.label, styles.fieldLabel]}>{label}</Text>
    <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((opt, idx) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={opt.label}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.segment,
              idx > 0 && styles.segmentDivider,
              selected && styles.segmentSelected,
              pressed && !selected && styles.pressed,
            ]}
          >
            <Text style={[TYPE.label, { color: selected ? COLORS.violetInk : COLORS.ink }]} numberOfLines={1}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const EditActions = ({ saveTitle, onCancel, onSave, saving }) => (
  <View style={styles.editActions}>
    <AppButton title="Cancel" variant="ghost" onPress={onCancel} style={styles.flex} />
    <AppButton title={saveTitle} variant="primary" loading={saving} onPress={onSave} style={styles.flex} />
  </View>
);

export const AdminSettingsScreen = ({ user, onNavigateBack, onSwitchRole, onLogout }) => {
  // Tenant & Workspace state
  const [tenant, setTenant] = useState({
    id: ADMIN_SETTINGS_DATA.tenantId,
    name: ADMIN_SETTINGS_DATA.organizationName,
    slug: 'default-tenant',
    plan: ADMIN_SETTINGS_DATA.plan,
  });

  // Routing and SLA states
  const [assignmentRule, setAssignmentRule] = useState('Least-Load & Skill');
  const [routingRules, setRoutingRules] = useState([]);
  const [slaPolicies, setSlaPolicies] = useState([]);
  const [teamMembers, setTeamMembers] = useState(AGENT_TEAM);
  const [channels, setChannels] = useState([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);

  // Workflow toggles
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(true);
  const [aiDeflectionEnabled, setAiDeflectionEnabled] = useState(true);
  const [emailSync, setEmailSync] = useState(true);
  const [whatsappSync, setWhatsappSync] = useState(true);

  // Inline editors (one open at a time)
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editWorkspacePlan, setEditWorkspacePlan] = useState('');
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [slugCheckInput, setSlugCheckInput] = useState('');
  const [slugCheckResult, setSlugCheckResult] = useState(null);

  const [isEditingSLA, setIsEditingSLA] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [editFirstResponse, setEditFirstResponse] = useState('15');
  const [editResolution, setEditResolution] = useState('120');
  const [isSavingSLA, setIsSavingSLA] = useState(false);

  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const assignmentOptions = ['Round-Robin', 'Least-Load & Skill', 'Sticky Account Owner'];

  const closeEditors = () => {
    setIsEditingWorkspace(false);
    setIsEditingSLA(false);
    setIsInviting(false);
  };

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

      if (routingRes.success && Array.isArray(routingRes.data)) {
        setRoutingRules(routingRes.data);
        if (routingRes.data.length > 0) {
          const activeRule = routingRes.data.find((r) => r.is_active) || routingRes.data[0];
          if (activeRule && REVERSE_STRATEGY_MAP[activeRule.strategy]) {
            setAssignmentRule(REVERSE_STRATEGY_MAP[activeRule.strategy]);
          }
        }
      }

      if (usersRes.success && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
        // The support team is staff only; customers are not team members.
        setTeamMembers(
          usersRes.data.filter((u) => u.role !== 'customer').map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role === 'admin' ? 'Workspace admin' : 'Support agent',
            // Presence: the backend's own field when it has one; otherwise just account state.
            status: !u.is_active ? 'Offline' : u.presence === 'away' ? 'Away' : u.presence === 'online' ? 'Online' : 'Offline',
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
        Alert.alert('Routing updated', `New tickets are now assigned by ${strategyLabel(ruleOption).toLowerCase()}.`);
      } else {
        Alert.alert(
          'Saved on this device only',
          `Routing is set to ${strategyLabel(ruleOption).toLowerCase()} here, but the server didn't accept it (${
            res.error || 'server unavailable'
          }). Try again when you're online.`
        );
      }
    } catch (err) {
      Alert.alert("Couldn't update routing", err.message || 'Try again in a moment.');
    } finally {
      setIsSavingStrategy(false);
    }
  };

  // Toggle routing rule activation
  const handleToggleRoutingRule = async (rule) => {
    try {
      const res = await adminService.updateRoutingRule(rule.id, { is_active: !rule.is_active });
      if (res.success && res.data) {
        setRoutingRules((prev) => prev.map((r) => (r.id === rule.id ? res.data : r)));
      } else {
        Alert.alert("Couldn't update the rule", res.error || 'Try again in a moment.');
      }
    } catch (err) {
      Alert.alert("Couldn't update the rule", err.message || 'Try again in a moment.');
    }
  };

  // Open workspace editor
  const handleOpenWorkspaceEditor = () => {
    closeEditors();
    setEditWorkspaceName(tenant.name || '');
    setEditWorkspacePlan(tenant.plan || 'Standard');
    setSlugCheckInput('');
    setSlugCheckResult(null);
    setIsEditingWorkspace(true);
  };

  // Check slug
  const handleCheckSlug = async () => {
    if (!slugCheckInput.trim()) {
      Alert.alert('Enter a slug', 'Type the slug you want to check, for example acme-support.');
      return;
    }
    const res = await adminService.checkSlug(slugCheckInput.trim());
    if (res.success) {
      setSlugCheckResult(res.isAvailable ? 'available' : 'taken');
    } else {
      Alert.alert("Couldn't check the slug", res.error || 'Try again in a moment.');
    }
  };

  // Save workspace
  const handleSaveWorkspace = async () => {
    if (!editWorkspaceName.trim()) {
      Alert.alert('Organization name is empty', 'Enter a name for your organization.');
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
        setIsEditingWorkspace(false);
        Alert.alert('Workspace saved', 'Your workspace details are updated.');
      } else {
        Alert.alert("Couldn't save the workspace", res.error || 'Check your connection and try again.');
      }
    } catch (err) {
      Alert.alert("Couldn't save the workspace", err.message || 'Check your connection and try again.');
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  // Open SLA editor
  const handleOpenSLAEditor = (policy) => {
    closeEditors();
    setSelectedPolicy(policy);
    setEditFirstResponse(String(policy.first_response_time_minutes || 15));
    setEditResolution(String(policy.resolution_time_minutes || 120));
    setIsEditingSLA(true);
  };

  // Save SLA policy
  const handleSaveSLA = async () => {
    if (!selectedPolicy) return;
    const firstMins = parseInt(editFirstResponse, 10);
    const resMins = parseInt(editResolution, 10);

    if (isNaN(firstMins) || firstMins < 1 || isNaN(resMins) || resMins < 1) {
      Alert.alert('Check the targets', 'Enter whole minutes greater than 0 for both targets.');
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
        setSlaPolicies((prev) => prev.map((p) => (p.id === res.data.id ? res.data : p)));
        setIsEditingSLA(false);
        Alert.alert('SLA policy saved', `${res.data.name} is updated.`);
      } else {
        Alert.alert("Couldn't save the policy", res.error || 'Check your connection and try again.');
      }
    } catch (err) {
      Alert.alert("Couldn't save the policy", err.message || 'Check your connection and try again.');
    } finally {
      setIsSavingSLA(false);
    }
  };

  // Send invitation
  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      Alert.alert('Check the email address', 'Enter a valid work email, for example agent@company.com.');
      return;
    }

    setIsSendingInvite(true);
    try {
      const res = await adminService.inviteAgent(inviteEmail.trim(), inviteRole);
      if (res.success) {
        setIsInviting(false);
        setInviteEmail('');
        fetchAdminData();
        Alert.alert('Invitation created', `${inviteEmail.trim()} has been invited to the workspace.`);
      } else {
        Alert.alert("Couldn't send the invitation", res.error || 'Check your connection and try again.');
      }
    } catch (err) {
      Alert.alert("Couldn't send the invitation", err.message || 'Check your connection and try again.');
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

  const policies = slaPolicies.length > 0 ? slaPolicies : FALLBACK_SLA_POLICIES;
  const slugAvailable = slugCheckResult === 'available';

  const syncMessage = isLoading
    ? 'Loading workspace settings'
    : isLiveConnected
    ? 'Synced with the server. Pull down to refresh.'
    : 'Offline. Showing default settings until the server is reachable. Pull down to retry.';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Admin settings"
        showBack={!!onNavigateBack}
        onBack={onNavigateBack}
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch role. You are viewing as admin."
            onPress={onSwitchRole}
            style={styles.roleTarget}
          >
            {({ pressed }) => (
              <View style={[styles.roleChip, pressed && styles.pressed]}>
                <Ionicons name="swap-horizontal" size={16} color={COLORS.violetInk} />
                <Text style={[TYPE.label, styles.roleChipText]}>Switch role</Text>
              </View>
            )}
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.violet]}
            tintColor={COLORS.violet}
          />
        }
      >
        <View style={styles.syncRow} accessibilityLiveRegion="polite">
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.violet} />
          ) : (
            <Ionicons
              name={isLiveConnected ? 'cloud-done-outline' : 'cloud-offline-outline'}
              size={20}
              color={isLiveConnected ? COLORS.success : COLORS.inkMuted}
            />
          )}
          <Text style={[TYPE.bodySmall, styles.syncText]}>{syncMessage}</Text>
        </View>

        {/* Workspace */}
        <SectionHeading title="Workspace">
          {!isEditingWorkspace ? (
            <AppButton
              title="Edit"
              variant="ghost"
              size="sm"
              onPress={handleOpenWorkspaceEditor}
              icon={<Ionicons name="create-outline" size={16} color={COLORS.violetInk} />}
            />
          ) : null}
        </SectionHeading>
        <View style={styles.sheet}>
          {isEditingWorkspace ? (
            <View style={styles.editPanel}>
              <AppTextInput
                label="Organization name"
                value={editWorkspaceName}
                onChangeText={setEditWorkspaceName}
                placeholder="Acme Global Support"
                autoCapitalize="words"
              />

              <Segmented
                label="Plan"
                options={PLAN_OPTIONS}
                value={editWorkspacePlan}
                onChange={setEditWorkspacePlan}
              />

              <AppTextInput
                label="Check slug availability"
                value={slugCheckInput}
                onChangeText={(t) => {
                  setSlugCheckInput(t);
                  setSlugCheckResult(null);
                }}
                placeholder="acme-support"
                style={styles.slugInput}
              />
              <View style={styles.slugRow}>
                <AppButton title="Check slug" size="sm" variant="outline" onPress={handleCheckSlug} />
                {slugCheckResult ? (
                  <View style={styles.slugResult} accessibilityLiveRegion="polite">
                    <Ionicons
                      name={slugAvailable ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={slugAvailable ? COLORS.success : COLORS.error}
                    />
                    <Text
                      style={[TYPE.bodySmall, styles.flex, { color: slugAvailable ? COLORS.success : COLORS.error }]}
                    >
                      {slugAvailable ? 'This slug is available' : 'This slug is already taken'}
                    </Text>
                  </View>
                ) : null}
              </View>

              <EditActions
                saveTitle="Save workspace"
                onCancel={() => setIsEditingWorkspace(false)}
                onSave={handleSaveWorkspace}
                saving={isSavingWorkspace}
              />
            </View>
          ) : (
            <>
              <InfoRow label="Organization" value={tenant.name || ADMIN_SETTINGS_DATA.organizationName} />
              <InfoRow label="Plan" value={tenant.plan || ADMIN_SETTINGS_DATA.plan} />
              <InfoRow label="Slug" value={tenant.slug || 'default-tenant'} numeric />
              <InfoRow label="Workspace ID" value={tenant.id ? tenant.id.slice(0, 8) : 'tenant-01'} numeric last />
            </>
          )}
        </View>

        {/* Team */}
        <SectionHeading
          title="Support team"
          help={`${teamMembers.length} ${teamMembers.length === 1 ? 'member' : 'members'}`}
        >
          {!isInviting ? (
            <AppButton
              title="Invite"
              variant="ghost"
              size="sm"
              onPress={() => {
                closeEditors();
                setIsInviting(true);
              }}
              icon={<Ionicons name="person-add-outline" size={16} color={COLORS.violetInk} />}
            />
          ) : null}
        </SectionHeading>
        <View style={styles.sheet}>
          {isInviting ? (
            <View style={[styles.editPanel, teamMembers.length > 0 && styles.rowBorder]}>
              <AppTextInput
                label="Work email"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="agent@company.com"
                keyboardType="email-address"
              />
              <Segmented label="Role" options={INVITE_ROLE_OPTIONS} value={inviteRole} onChange={setInviteRole} />
              <EditActions
                saveTitle="Send invite"
                onCancel={() => setIsInviting(false)}
                onSave={handleSendInvite}
                saving={isSendingInvite}
              />
            </View>
          ) : null}

          {teamMembers.length === 0 && !isInviting ? (
            <EmptyState
              icon="people-outline"
              title="No one on the team yet"
              message="Invite agents so new tickets have someone to go to."
              actionLabel="Invite agent"
              onAction={() => {
                closeEditors();
                setIsInviting(true);
              }}
            />
          ) : null}

          {teamMembers.map((agent, idx) => (
            <View key={agent.id} style={[styles.memberRow, idx < teamMembers.length - 1 && styles.rowBorder]}>
              <Avatar
                initials={
                  agent.initials ||
                  agent.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                }
                size={40}
              />
              <View style={styles.memberText}>
                <Text style={[TYPE.bodyStrong, styles.ink]} numberOfLines={1}>
                  {agent.name}
                </Text>
                <Text style={[TYPE.bodySmall, styles.muted]} numberOfLines={1}>
                  {agent.role}
                </Text>
              </View>
              <View style={styles.presence}>
                <View
                  style={[
                    styles.presenceDot,
                    {
                      backgroundColor:
                        agent.status === 'Online'
                          ? COLORS.success
                          : agent.status === 'Away'
                          ? COLORS.warning
                          : COLORS.inkFaint,
                    },
                  ]}
                />
                <Text style={[TYPE.bodySmall, styles.muted]}>{agent.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Routing */}
        <SectionHeading title="Ticket routing" help="How new tickets are assigned to agents.">
          {isSavingStrategy ? (
            <ActivityIndicator size="small" color={COLORS.violet} accessibilityLabel="Saving routing" />
          ) : null}
        </SectionHeading>
        <View style={styles.sheet}>
          {assignmentOptions.map((opt, idx) => {
            const isSelected = assignmentRule === opt;
            return (
              <Pressable
                key={opt}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={strategyLabel(opt)}
                onPress={() => handleSelectRule(opt)}
                style={({ pressed }) => [
                  styles.radioRow,
                  idx < assignmentOptions.length - 1 && styles.rowBorder,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={[isSelected ? TYPE.bodyStrong : TYPE.body, styles.ink]}>{strategyLabel(opt)}</Text>
              </Pressable>
            );
          })}
        </View>

        {routingRules.length > 0 ? (
          <>
            <SectionHeading title="Routing rules" help="Turn individual rules on or off." />
            <View style={styles.sheet}>
              {routingRules.map((r, idx) => {
                const channelName = r.channel
                  ? `${(COLORS.channel[r.channel] && COLORS.channel[r.channel].label) || r.channel} tickets`
                  : 'all channels';
                const strategy = strategyLabel(REVERSE_STRATEGY_MAP[r.strategy] || r.strategy);
                return (
                  <SettingsItem
                    key={r.id}
                    title={r.name}
                    subtitle={`${strategy} for ${channelName}, priority ${r.priority_order}`}
                    rightType="switch"
                    switchValue={!!r.is_active}
                    onSwitchChange={() => handleToggleRoutingRule(r)}
                    showBorder={idx < routingRules.length - 1}
                  />
                );
              })}
            </View>
          </>
        ) : null}

        {/* SLA */}
        <SectionHeading
          title="SLA policies"
          help="Response and resolution targets by priority. Tap a policy to change it."
        />
        <View style={styles.sheet}>
          {policies.map((policy, idx) => {
            const key = policy.id || idx;
            const isOpen = isEditingSLA && selectedPolicy && selectedPolicy.id === policy.id;

            if (isOpen) {
              return (
                <View key={key} style={[styles.editPanel, styles.rowBorder]}>
                  <View style={[styles.policyTitleRow, styles.policyEditTitle]}>
                    <Text style={[TYPE.titleSmall, styles.ink, styles.flexShrink]}>{policy.name}</Text>
                    {policy.priority ? <PriorityBadge priority={policy.priority} size="sm" /> : null}
                  </View>
                  <AppTextInput
                    label="First response target, in minutes"
                    value={editFirstResponse}
                    onChangeText={setEditFirstResponse}
                    keyboardType="numeric"
                    placeholder="15"
                  />
                  <AppTextInput
                    label="Resolution target, in minutes"
                    value={editResolution}
                    onChangeText={setEditResolution}
                    keyboardType="numeric"
                    placeholder="120"
                  />
                  <EditActions
                    saveTitle="Save policy"
                    onCancel={() => setIsEditingSLA(false)}
                    onSave={handleSaveSLA}
                    saving={isSavingSLA}
                  />
                </View>
              );
            }

            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${policy.name}`}
                onPress={() => handleOpenSLAEditor(policy)}
                style={({ pressed }) => [styles.policyRow, styles.rowBorder, pressed && styles.pressed]}
              >
                <View style={styles.flex}>
                  <View style={styles.policyTitleRow}>
                    <Text style={[TYPE.bodyStrong, styles.ink, styles.flexShrink]}>{policy.name}</Text>
                    {policy.priority ? <PriorityBadge priority={policy.priority} size="sm" /> : null}
                  </View>
                  <Text style={[TYPE.bodySmall, styles.muted]}>
                    First response{' '}
                    <Text style={[TYPE.numeric, styles.ink]}>{formatMinutes(policy.first_response_time_minutes)}</Text>
                    , resolution{' '}
                    <Text style={[TYPE.numeric, styles.ink]}>{formatMinutes(policy.resolution_time_minutes)}</Text>
                  </Text>
                </View>
                <Ionicons name="create-outline" size={20} color={COLORS.inkFaint} />
              </Pressable>
            );
          })}

          <SettingsItem
            icon="calendar-outline"
            title="Business hours"
            subtitle={ADMIN_SETTINGS_DATA.businessHours}
            rightType="none"
            showBorder={false}
          />
        </View>

        {/* Automation */}
        <SectionHeading title="Automation" />
        <View style={styles.sheet}>
          <SettingsItem
            icon="sparkles-outline"
            title="AI answers"
            subtitle="Resolve routine questions from your knowledge base, with citations."
            rightType="switch"
            switchValue={aiDeflectionEnabled}
            onSwitchChange={setAiDeflectionEnabled}
          />
          <SettingsItem
            icon="timer-outline"
            title="Auto-close inactive tickets"
            subtitle="Close resolved tickets after 48 hours without a customer reply."
            rightType="switch"
            switchValue={autoCloseEnabled}
            onSwitchChange={setAutoCloseEnabled}
            showBorder={false}
          />
        </View>

        {/* Channels */}
        <SectionHeading title="Channels" />
        <View style={styles.sheet}>
          <SettingsItem
            icon="mail-outline"
            title="Inbound email (AWS SES)"
            subtitle="support@acmeglobal.com"
            rightType="switch"
            switchValue={emailSync}
            onSwitchChange={handleToggleEmailChannel}
          />
          <SettingsItem
            icon="logo-whatsapp"
            title="WhatsApp Cloud API"
            subtitle="+1 (800) 555-0199, verified Meta business account"
            rightType="switch"
            switchValue={whatsappSync}
            onSwitchChange={handleToggleWhatsappChannel}
          />
          <SettingsItem
            icon="chatbubbles-outline"
            title="Live chat widget"
            subtitle="Embedded on your website"
            rightType="badge"
            badgeText="Online"
            badgeColor={COLORS.success}
            showBorder={false}
          />
        </View>

        <AppButton
          title="Sign out"
          onPress={onLogout}
          variant="outline"
          icon={<Ionicons name="log-out-outline" size={18} color={COLORS.ink} />}
          style={styles.signOut}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xxxl },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  ink: { color: COLORS.ink },
  muted: { color: COLORS.inkMuted },
  pressed: { backgroundColor: COLORS.groundDeep },

  roleTarget: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: SPACING.xs },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    backgroundColor: COLORS.paper,
  },
  roleChipText: { color: COLORS.violetInk },

  syncRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 24 },
  syncText: { flex: 1, color: COLORS.inkMuted },

  sectionHead: { marginTop: SPACING.xxxl, marginBottom: SPACING.md },
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  sectionTitle: { flex: 1, color: COLORS.ink },
  sectionHelp: { color: COLORS.inkMuted, marginTop: 2 },

  sheet: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    overflow: 'hidden',
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.rule },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.lg,
  },
  infoValue: { color: COLORS.ink, flexShrink: 1, textAlign: 'right' },

  editPanel: { padding: SPACING.lg },
  editActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },

  field: { marginBottom: SPACING.lg },
  fieldLabel: { color: COLORS.ink, marginBottom: SPACING.sm },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
    backgroundColor: COLORS.paper,
  },
  segmentDivider: { borderLeftWidth: 1, borderLeftColor: COLORS.ruleStrong },
  segmentSelected: { backgroundColor: COLORS.violetWash },

  slugInput: { marginBottom: SPACING.sm },
  slugRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xl },
  slugResult: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2 },

  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  memberText: { flex: 1 },
  presence: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2 },
  presenceDot: { width: 8, height: 8, borderRadius: 4 },

  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.inkMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: COLORS.violetInk },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.violetInk },

  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  policyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  policyEditTitle: { marginBottom: SPACING.lg },

  signOut: { marginTop: SPACING.xxxl },
});
