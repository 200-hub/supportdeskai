import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Avatar } from '../components/common/Avatar';
import { SettingsItem } from '../components/common/SettingsItem';

const InfoRow = ({ label, value, numeric = false, last = false }) => (
  <View style={[styles.infoRow, !last && styles.rowBorder]}>
    <Text style={[TYPE.body, styles.infoLabel]}>{label}</Text>
    <Text style={[numeric ? TYPE.numeric : TYPE.bodyStrong, styles.infoValue]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

export const SettingsScreen = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [slaAlerts, setSlaAlerts] = useState(true);
  const [collisionDetection, setCollisionDetection] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false); // not surfaced yet

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <View style={styles.identity}>
          <Avatar initials="SB" size={56} />
          <View style={styles.identityText}>
            <Text style={[TYPE.title, styles.name]}>Sayoni Bhattacharjee</Text>
            <Text style={[TYPE.bodySmall, styles.muted]}>Senior Support Engineer</Text>
            <Text style={[TYPE.bodySmall, styles.muted]} numberOfLines={1}>
              sayonibhattacharjee198@gmail.com
            </Text>
          </View>
        </View>

        <View style={styles.sheet}>
          <SettingsItem
            icon={isOnline ? 'radio-button-on' : 'radio-button-off'}
            iconColor={isOnline ? COLORS.success : COLORS.inkFaint}
            title={isOnline ? 'Available for new tickets' : 'Away'}
            subtitle={
              isOnline
                ? 'Round-robin and skill routing can assign tickets to you.'
                : 'New tickets go to teammates who are on duty.'
            }
            rightType="switch"
            switchValue={isOnline}
            onSwitchChange={setIsOnline}
            showBorder={false}
          />
        </View>

        <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.sectionTitle]}>
          Workspace
        </Text>
        <View style={styles.sheet}>
          <InfoRow label="Organization" value="Acme Global Technologies" />
          <InfoRow label="Workspace ID" value="tn_9812_prod" numeric />
          <InfoRow label="Plan" value="Enterprise SaaS" last />
        </View>

        <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.sectionTitle]}>
          Channels
        </Text>
        <View style={styles.sheet}>
          <SettingsItem
            icon="mail-outline"
            title="Inbound email (AWS SES)"
            subtitle="support@acmeglobal.com"
            rightType="badge"
            badgeText="Connected"
          />
          <SettingsItem
            icon="logo-whatsapp"
            title="WhatsApp Cloud API"
            subtitle="+1 (800) 555-0199"
            rightType="badge"
            badgeText="Connected"
          />
          <SettingsItem
            icon="chatbubbles-outline"
            title="Chat widget"
            subtitle="Preact and Socket.IO, version 2.4"
            rightType="badge"
            badgeText="Connected"
            showBorder={false}
          />
        </View>

        <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.sectionTitle]}>
          Alerts
        </Text>
        <View style={styles.sheet}>
          <SettingsItem
            icon="alarm-outline"
            title="SLA at-risk alerts"
            subtitle="Notify me when a ticket is 20 minutes from breaching its SLA."
            rightType="switch"
            switchValue={slaAlerts}
            onSwitchChange={setSlaAlerts}
          />
          <SettingsItem
            icon="people-outline"
            title="Collision detection"
            subtitle="Warn me when another agent is viewing or replying to the same ticket."
            rightType="switch"
            switchValue={collisionDetection}
            onSwitchChange={setCollisionDetection}
            showBorder={false}
          />
        </View>

        <Text style={[TYPE.bodySmall, styles.footer]}>SupportDesk AI for Android, version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxxl },
  identity: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  identityText: { flex: 1, marginLeft: SPACING.lg },
  name: { color: COLORS.ink, marginBottom: 2 },
  muted: { color: COLORS.inkMuted },
  sectionTitle: { color: COLORS.ink, marginTop: SPACING.xxxl, marginBottom: SPACING.md },
  sheet: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.lg,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.rule },
  infoLabel: { color: COLORS.inkMuted },
  infoValue: { color: COLORS.ink, flexShrink: 1, textAlign: 'right' },
  footer: { color: COLORS.inkFaint, textAlign: 'center', marginTop: SPACING.xxxl },
});
