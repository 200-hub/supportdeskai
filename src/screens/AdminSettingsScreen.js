import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { SettingsItem } from '../components/common/SettingsItem';
import { AppButton } from '../components/common/AppButton';
import { Avatar } from '../components/common/Avatar';
import { AGENT_TEAM, ADMIN_SETTINGS_DATA } from '../data/mockData';

export const AdminSettingsScreen = ({
  user,
  onNavigateBack,
  onSwitchRole,
  onLogout,
}) => {
  const [assignmentRule, setAssignmentRule] = useState('Least-Load & Skill');
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(true);
  const [aiDeflectionEnabled, setAiDeflectionEnabled] = useState(true);
  const [emailSync, setEmailSync] = useState(true);
  const [whatsappSync, setWhatsappSync] = useState(true);

  const assignmentOptions = [
    'Round-Robin',
    'Least-Load & Skill',
    'Sticky Account Owner',
  ];

  const handleSimulateRuleChange = (rule) => {
    setAssignmentRule(rule);
    Alert.alert('Routing Rule Updated', `Ticket assignment strategy set to: ${rule}`);
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

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Backend Disclaimer Banner */}
        <View style={styles.disclaimerBanner}>
          <Ionicons name="warning-outline" size={16} color="#92400E" style={{ marginRight: 6 }} />
          <Text style={styles.disclaimerText}>
            Demo Notice: These administrative configuration toggles reflect local UI demonstration states. Connecting live NestJS/PostgreSQL backend services is required for remote database synchronization.
          </Text>
        </View>

        {/* Tenant Profile Banner */}
        <View style={styles.tenantCard}>
          <View style={styles.tenantTopRow}>
            <View style={styles.tenantIconBox}>
              <Ionicons name="business" size={24} color={COLORS.white} />
            </View>
            <View style={styles.tenantTextGroup}>
              <Text style={styles.tenantName}>{ADMIN_SETTINGS_DATA.organizationName}</Text>
              <Text style={styles.tenantSlug}>Tenant ID: {ADMIN_SETTINGS_DATA.tenantId}</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{ADMIN_SETTINGS_DATA.plan}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Team and Agent Management */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Support Team Members ({AGENT_TEAM.length})</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Alert.alert('Invite Agent', 'Agent invitation dialog (Requires backend API).')}
            >
              <Text style={styles.linkText}>+ Invite Agent</Text>
            </TouchableOpacity>
          </View>

          {AGENT_TEAM.map((agent) => (
            <View key={agent.id} style={styles.agentRow}>
              <Avatar
                initials={agent.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
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
          <Text style={styles.sectionTitle}>Ticket Assignment Strategy</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how incoming tickets across channels are routed to active agents.
          </Text>

          {assignmentOptions.map((opt) => {
            const isSelected = assignmentRule === opt;
            return (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.7}
                onPress={() => handleSimulateRuleChange(opt)}
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
          <Text style={styles.sectionTitle}>SLA Target Policies</Text>

          <View style={styles.slaConfigRow}>
            <View>
              <Text style={styles.slaKey}>Urgent (P1) First Response</Text>
              <Text style={styles.slaSub}>Target: 15 minutes • 2h resolution</Text>
            </View>
            <View style={styles.slaTimePill}>
              <Text style={styles.slaTimePillText}>15m</Text>
            </View>
          </View>

          <View style={styles.slaConfigRow}>
            <View>
              <Text style={styles.slaKey}>High (P2) First Response</Text>
              <Text style={styles.slaSub}>Target: 1 hour • 6h resolution</Text>
            </View>
            <View style={styles.slaTimePill}>
              <Text style={styles.slaTimePillText}>1h</Text>
            </View>
          </View>

          <View style={[styles.slaConfigRow, { borderBottomWidth: 0 }]}>
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
            onSwitchChange={setEmailSync}
          />

          <SettingsItem
            icon="logo-whatsapp"
            title="WhatsApp Cloud API"
            subtitle="+1 (800) 555-0199 (Verified Meta WABA)"
            rightType="switch"
            switchValue={whatsappSync}
            onSwitchChange={setWhatsappSync}
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
  disclaimerBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: SPACING.md,
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  disclaimerText: {
    fontSize: TYPOGRAPHY.xs,
    color: '#92400E',
    lineHeight: 16,
    flex: 1,
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
});
