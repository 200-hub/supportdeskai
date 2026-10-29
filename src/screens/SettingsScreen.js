import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Avatar } from '../components/common/Avatar';

export const SettingsScreen = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [slaAlerts, setSlaAlerts] = useState(true);
  const [collisionDetection, setCollisionDetection] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Agent Profile & Settings" subtitle="Preferences & Workspace Health" />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar initials="SB" size={50} bgColor={COLORS.primaryNavy} />
            <View style={styles.profileInfo}>
              <Text style={styles.agentName}>Sayoni Bhattacharjee</Text>
              <Text style={styles.agentRole}>Senior Support Engineer</Text>
              <Text style={styles.agentEmail}>sayonibhattacharjee198@gmail.com</Text>
            </View>
          </View>

          <View style={styles.profileDivider} />

          {/* Availability Toggle */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <View style={styles.onlineDotRow}>
                <View
                  style={[
                    styles.onlineDot,
                    { backgroundColor: isOnline ? COLORS.success : COLORS.secondaryText },
                  ]}
                />
                <Text style={styles.switchLabel}>
                  {isOnline ? 'Available for Routing' : 'Offline / Busy'}
                </Text>
              </View>
              <Text style={styles.switchSublabel}>
                {isOnline
                  ? 'Receiving omnichannel tickets via round-robin and skill routing.'
                  : 'Tickets will be routed to other on-duty team members.'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: COLORS.border, true: COLORS.accentTeal }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Tenant Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tenant Workspace</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Active Organization</Text>
            <Text style={styles.infoVal}>Acme Global Technologies</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Tenant UUID</Text>
            <Text style={styles.infoVal}>tn_9812_prod</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Active Tier</Text>
            <View style={styles.tierPill}>
              <Text style={styles.tierPillText}>Enterprise SaaS</Text>
            </View>
          </View>
        </View>

        {/* Channel Health & Integrations */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Omnichannel Health</Text>

          <View style={styles.channelStatusRow}>
            <View style={styles.channelIconBox}>
              <Ionicons name="mail-outline" size={16} color={COLORS.primaryNavy} />
            </View>
            <View style={styles.channelStatusInfo}>
              <Text style={styles.channelStatusTitle}>AWS SES Inbound Email</Text>
              <Text style={styles.channelStatusSubtitle}>support@acmeglobal.com</Text>
            </View>
            <View style={styles.statusDotGreen} />
          </View>

          <View style={styles.channelStatusRow}>
            <View style={styles.channelIconBox}>
              <Ionicons name="logo-whatsapp" size={16} color="#15803D" />
            </View>
            <View style={styles.channelStatusInfo}>
              <Text style={styles.channelStatusTitle}>Meta WhatsApp Cloud API</Text>
              <Text style={styles.channelStatusSubtitle}>+1 (800) 555-0199</Text>
            </View>
            <View style={styles.statusDotGreen} />
          </View>

          <View style={styles.channelStatusRow}>
            <View style={styles.channelIconBox}>
              <Ionicons name="chatbubbles-outline" size={16} color={COLORS.accentTeal} />
            </View>
            <View style={styles.channelStatusInfo}>
              <Text style={styles.channelStatusTitle}>Embeddable Chat Widget</Text>
              <Text style={styles.channelStatusSubtitle}>Preact + Socket.IO (v2.4)</Text>
            </View>
            <View style={styles.statusDotGreen} />
          </View>
        </View>

        {/* Notification Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Alerts & Collision Prevention</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>SLA At-Risk Push Alerts</Text>
              <Text style={styles.switchSublabel}>Notify when a ticket is within 20m of SLA breach</Text>
            </View>
            <Switch
              value={slaAlerts}
              onValueChange={setSlaAlerts}
              trackColor={{ false: COLORS.border, true: COLORS.accentTeal }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={[styles.switchRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>Agent Collision Detection</Text>
              <Text style={styles.switchSublabel}>Warn if another agent is viewing or drafting a reply</Text>
            </View>
            <Switch
              value={collisionDetection}
              onValueChange={setCollisionDetection}
              trackColor={{ false: COLORS.border, true: COLORS.accentTeal }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* App Footer */}
        <View style={styles.footerBox}>
          <Text style={styles.footerVersion}>SupportDesk AI for Android • v1.0.0</Text>
          <Text style={styles.footerCopy}>Engineered for enterprise high-reliability customer care</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  agentName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
  },
  agentRole: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.semiBold,
    marginTop: 1,
  },
  agentEmail: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  profileDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  switchTextGroup: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  onlineDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  switchLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
  },
  switchSublabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoKey: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
  },
  infoVal: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  tierPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  tierPillText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.bold,
  },
  channelStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  channelIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.lightBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  channelStatusInfo: {
    flex: 1,
  },
  channelStatusTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
  },
  channelStatusSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 1,
  },
  statusDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  footerBox: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  footerVersion: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    fontWeight: TYPOGRAPHY.medium,
  },
  footerCopy: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
});
