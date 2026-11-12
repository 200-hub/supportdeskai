import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, ELEVATION, TOUCH } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Avatar } from '../components/common/Avatar';
import { SettingsItem } from '../components/common/SettingsItem';
import { AppTextInput } from '../components/common/AppTextInput';
import { AppButton } from '../components/common/AppButton';

const ROLES = [
  { role: 'customer', label: 'Customer', icon: 'person-outline' },
  { role: 'agent', label: 'Agent', icon: 'headset-outline' },
  { role: 'admin', label: 'Admin', icon: 'shield-checkmark-outline' },
];

const ROLE_TITLES = {
  admin: 'Workspace admin',
  agent: 'Support engineer',
  customer: 'Customer',
};

const InfoRow = ({ label, value, last = false }) => (
  <View style={[styles.infoRow, !last && styles.rowBorder]}>
    <Text style={[TYPE.body, styles.infoLabel]}>{label}</Text>
    <Text style={[TYPE.bodyStrong, styles.infoValue]} numberOfLines={1}>
      {value || 'Not set'}
    </Text>
  </View>
);

export const ProfileScreen = ({
  user,
  onUpdateUser,
  onNavigateToHelpCenter,
  onNavigateToAdminSettings,
  onSwitchRole,
  onLogout,
  onNavigateBack,
}) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  // Edit profile sheet state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || 'Sarah Connor');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editCompany, setEditCompany] = useState(user?.company || '');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
      setEditCompany(user.company || '');
      setEditError('');
    }
  }, [user]);

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Enter your name and work email to save.');
      return;
    }
    setEditError('');

    const updated = {
      ...user,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      company: editCompany.trim(),
      avatarInitials: editName
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    };

    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setIsEditing(false);
    Alert.alert(
      'Profile updated',
      'Your changes apply on this device for this session. They are not saved to your account on the server yet.'
    );
  };

  const activeRole = user?.role || 'customer';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profile" showBack={!!onNavigateBack} onBack={onNavigateBack} />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <View style={styles.identity}>
          <Avatar initials={user?.avatarInitials || 'SC'} size={64} />
          <View style={styles.identityText}>
            <Text style={[TYPE.title, styles.name]}>{user?.name || 'Sarah Connor'}</Text>
            <Text style={[TYPE.bodySmall, styles.muted]}>{ROLE_TITLES[activeRole] || ROLE_TITLES.customer}</Text>
          </View>
        </View>
        <AppButton
          title="Edit profile"
          onPress={() => setIsEditing(true)}
          variant="tonal"
          size="sm"
          icon={<Ionicons name="create-outline" size={16} color={COLORS.violetInk} />}
          style={styles.editButton}
        />

        <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.sectionTitle]}>
          Your details
        </Text>
        <View style={styles.sheet}>
          <InfoRow label="Name" value={user?.name || 'Sarah Connor'} />
          <InfoRow label="Work email" value={user?.email || 'Not added'} />
          <InfoRow label="Phone" value={user?.phone || 'Not added'} />
          <InfoRow label="Organization" value={user?.company || 'Not added'} last />
        </View>

        <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.sectionTitle]}>
          Notifications
        </Text>
        <View style={styles.sheet}>
          <SettingsItem
            icon="notifications-outline"
            title="Push notifications"
            subtitle="Replies to your tickets and SLA updates as they happen."
            rightType="switch"
            switchValue={pushEnabled}
            onSwitchChange={setPushEnabled}
          />
          <SettingsItem
            icon="mail-outline"
            title="Email digest"
            subtitle="A daily summary of replies and resolved tickets."
            rightType="switch"
            switchValue={emailAlerts}
            onSwitchChange={setEmailAlerts}
          />
          <SettingsItem
            icon="phone-portrait-outline"
            title="Text messages for urgent tickets"
            subtitle="Urgent (P1) ticket alerts sent to your phone."
            rightType="switch"
            switchValue={smsAlerts}
            onSwitchChange={setSmsAlerts}
            showBorder={false}
          />
        </View>

        <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.sectionTitleWithHelp]}>
          View the app as
        </Text>
        <Text style={[TYPE.bodySmall, styles.sectionHelp]}>
          Switch roles to try customer self-service, the agent queue or admin settings.
        </Text>
        <View style={styles.segmented} accessibilityRole="radiogroup">
          {ROLES.map((item, idx) => {
            const isActive = activeRole === item.role;
            return (
              <Pressable
                key={item.role}
                accessibilityRole="radio"
                accessibilityState={{ checked: isActive }}
                accessibilityLabel={`View as ${item.label}`}
                onPress={() => onSwitchRole && onSwitchRole(item.role)}
                style={({ pressed }) => [
                  styles.segment,
                  idx > 0 && styles.segmentDivider,
                  isActive && styles.segmentActive,
                  pressed && !isActive && styles.segmentPressed,
                ]}
              >
                <Ionicons
                  name={isActive ? 'checkmark' : item.icon}
                  size={18}
                  color={isActive ? COLORS.violetInk : COLORS.inkMuted}
                />
                <Text style={[TYPE.label, { color: isActive ? COLORS.violetInk : COLORS.ink }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.sectionTitle]}>
          Help and app
        </Text>
        <View style={styles.sheet}>
          <SettingsItem
            icon="help-circle-outline"
            title="Help center"
            subtitle="Guides and answers to common questions"
            rightType="arrow"
            onPress={onNavigateToHelpCenter}
          />
          {user?.role === 'admin' && (
            <SettingsItem
              icon="settings-outline"
              title="Workspace settings"
              subtitle="Routing, SLA policies, channels and team"
              rightType="arrow"
              onPress={onNavigateToAdminSettings}
            />
          )}
          <SettingsItem
            icon="information-circle-outline"
            title="App version"
            value="1.0.0 (Expo Android)"
            rightType="none"
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

      <Modal
        visible={isEditing}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsEditing(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.scrim}
            accessibilityRole="button"
            accessibilityLabel="Close without saving"
            onPress={() => setIsEditing(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text accessibilityRole="header" style={[TYPE.title, styles.sheetTitle]}>
                Edit profile
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setIsEditing(false)}
                style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              >
                <Ionicons name="close" size={24} color={COLORS.inkMuted} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
              {editError ? (
                <View style={styles.errorRow} accessibilityLiveRegion="polite">
                  <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                  <Text style={[TYPE.bodySmall, styles.errorText]}>{editError}</Text>
                </View>
              ) : null}

              <AppTextInput label="Full name" value={editName} onChangeText={setEditName} autoCapitalize="words" />
              <AppTextInput
                label="Work email"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
              />
              <AppTextInput label="Phone" value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
              <AppTextInput
                label="Organization"
                value={editCompany}
                onChangeText={setEditCompany}
                autoCapitalize="words"
              />

              <View style={styles.sheetActions}>
                <AppButton title="Cancel" onPress={() => setIsEditing(false)} variant="ghost" style={styles.flex} />
                <AppButton title="Save changes" onPress={handleSaveProfile} variant="primary" style={styles.flex} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxxl },
  identity: { flexDirection: 'row', alignItems: 'center' },
  identityText: { flex: 1, marginLeft: SPACING.lg },
  name: { color: COLORS.ink, marginBottom: 2 },
  muted: { color: COLORS.inkMuted },
  editButton: { alignSelf: 'flex-start', marginTop: SPACING.lg },
  sectionTitle: { color: COLORS.ink, marginTop: SPACING.xxxl, marginBottom: SPACING.md },
  sectionTitleWithHelp: { color: COLORS.ink, marginTop: SPACING.xxxl, marginBottom: SPACING.xs },
  sectionHelp: { color: COLORS.inkMuted, marginBottom: SPACING.md },
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

  // Material segmented button
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.paper,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
  },
  segmentDivider: { borderLeftWidth: 1, borderLeftColor: COLORS.ruleStrong },
  segmentActive: { backgroundColor: COLORS.violetWash },
  segmentPressed: { backgroundColor: COLORS.groundDeep },

  signOut: { marginTop: SPACING.xxxl },

  // Bottom sheet
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.ink, opacity: 0.4 },
  bottomSheet: {
    backgroundColor: COLORS.paper,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    ...ELEVATION.raised,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.xxl,
    paddingRight: SPACING.sm,
    paddingTop: SPACING.md,
  },
  sheetTitle: { flex: 1, color: COLORS.ink },
  iconButton: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: { backgroundColor: COLORS.groundDeep },
  sheetBody: { paddingHorizontal: SPACING.xxl, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.errorWash,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: { flex: 1, color: COLORS.error },
  sheetActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  flex: { flex: 1 },
});
