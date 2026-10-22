import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Avatar } from '../components/common/Avatar';
import { SettingsItem } from '../components/common/SettingsItem';
import { AppTextInput } from '../components/common/AppTextInput';
import { AppButton } from '../components/common/AppButton';

export const ProfileScreen = ({
  user,
  onUpdateUser,
  onNavigateToHelpCenter,
  onNavigateToAdminSettings,
  onSwitchRole,
  onLogout,
  onNavigateBack,
}) => {
  const insets = useSafeAreaInsets();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  // Edit Profile Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || 'Sarah Connor');
  const [editEmail, setEditEmail] = useState(user?.email || 'sarah.connor@cyberdyne.org');
  const [editPhone, setEditPhone] = useState(user?.phone || '+1 (555) 234-5678');
  const [editCompany, setEditCompany] = useState(user?.company || 'Cyberdyne Systems Corp');
  const [editError, setEditError] = useState('');

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Name and Email are required.');
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
        .split(' ')
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
      'Profile Updated',
      'Your profile details have been saved to your local application session.\n\n(Demo Note: Changes apply locally; connect backend API for persistent remote storage.)'
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Profile & Settings"
        subtitle="Account preferences and contact details"
        showBack={!!onNavigateBack}
        onBack={onNavigateBack}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 72 },
        ]}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrapper}>
              <Avatar
                initials={user?.avatarInitials || 'SC'}
                size={58}
                bgColor={COLORS.primaryNavy}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsEditing(true)}
                style={styles.editAvatarBadge}
              >
                <Ionicons name="pencil" size={12} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileTextColumn}>
              <Text style={styles.userName}>{user?.name || 'Sarah Connor'}</Text>
              <Text style={styles.userRole}>
                {user?.role === 'admin'
                  ? 'Tenant Administrator'
                  : user?.role === 'agent'
                  ? 'Support Engineer'
                  : 'Enterprise Customer'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || 'sarah.connor@cyberdyne.org'}</Text>
            </View>
          </View>

          <AppButton
            title="Edit Personal Information"
            onPress={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            icon={<Ionicons name="create-outline" size={14} color={COLORS.primaryNavy} />}
            style={{ marginTop: SPACING.md }}
          />
        </View>

        {/* Persona Switcher Section (Allows one-tap switching between Customer, Agent, and Admin roles) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Persona & Role Switcher</Text>
          <Text style={styles.sectionSubtitle}>
            Switch your active role to test customer self-service, agent queue triage, or admin configuration.
          </Text>

          <View style={styles.roleButtonsRow}>
            {[
              { role: 'customer', label: 'Customer View', icon: 'person' },
              { role: 'agent', label: 'Agent Workspace', icon: 'headset' },
              { role: 'admin', label: 'Admin Portal', icon: 'shield-checkmark' },
            ].map((item) => {
              const isActive = (user?.role || 'customer') === item.role;
              return (
                <TouchableOpacity
                  key={item.role}
                  activeOpacity={0.7}
                  onPress={() => onSwitchRole && onSwitchRole(item.role)}
                  style={[
                    styles.roleSwitchBtn,
                    isActive && styles.roleSwitchBtnActive,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={14}
                    color={isActive ? COLORS.white : COLORS.primaryNavy}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.roleSwitchBtnText,
                      isActive && styles.roleSwitchBtnTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal & Company Info</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Full Name</Text>
            <Text style={styles.infoVal}>{user?.name || 'Sarah Connor'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Work Email</Text>
            <Text style={styles.infoVal}>{user?.email || 'sarah.connor@cyberdyne.org'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Phone Number</Text>
            <Text style={styles.infoVal}>{user?.phone || '+1 (555) 234-5678'}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoKey}>Organization</Text>
            <Text style={styles.infoVal}>{user?.company || 'Cyberdyne Systems Corp'}</Text>
          </View>
        </View>

        {/* Notification Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>

          <SettingsItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Real-time alerts for ticket replies and SLA countdowns"
            rightType="switch"
            switchValue={pushEnabled}
            onSwitchChange={setPushEnabled}
          />

          <SettingsItem
            icon="mail-outline"
            title="Email Digest & Updates"
            subtitle="Daily summary of ticket resolutions and replies"
            rightType="switch"
            switchValue={emailAlerts}
            onSwitchChange={setEmailAlerts}
          />

          <SettingsItem
            icon="phone-portrait-outline"
            title="SMS Incident Alerts"
            subtitle="Urgent P1 priority alerts sent to your phone"
            rightType="switch"
            switchValue={smsAlerts}
            onSwitchChange={setSmsAlerts}
            showBorder={false}
          />
        </View>

        {/* Quick Links */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Support & App Info</Text>

          <SettingsItem
            icon="help-circle-outline"
            title="Help Center & Knowledge Base"
            subtitle="Search documentation and troubleshooting guides"
            rightType="arrow"
            onPress={onNavigateToHelpCenter}
          />

          {user?.role === 'admin' && (
            <SettingsItem
              icon="settings-outline"
              title="Admin Console & SLA Rules"
              subtitle="Configure tenant routing, integrations, and agents"
              rightType="arrow"
              onPress={onNavigateToAdminSettings}
            />
          )}

          <SettingsItem
            icon="information-circle-outline"
            title="App Version"
            value="1.0.0 (Expo Android Native)"
            rightType="none"
            showBorder={false}
          />
        </View>

        {/* Logout Button */}
        <AppButton
          title="Sign Out"
          onPress={onLogout}
          variant="outline"
          size="lg"
          icon={<Ionicons name="log-out-outline" size={18} color={COLORS.error} />}
          style={styles.logoutBtn}
          textStyle={{ color: COLORS.error }}
        />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={22} color={COLORS.secondaryText} />
              </TouchableOpacity>
            </View>

            {editError ? <Text style={styles.modalError}>{editError}</Text> : null}

            <AppTextInput
              label="Full Name"
              value={editName}
              onChangeText={setEditName}
            />

            <AppTextInput
              label="Work Email"
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
            />

            <AppTextInput
              label="Phone Number"
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />

            <AppTextInput
              label="Company / Organization"
              value={editCompany}
              onChangeText={setEditCompany}
            />

            <View style={styles.modalActions}>
              <AppButton
                title="Cancel"
                onPress={() => setIsEditing(false)}
                variant="ghost"
                style={{ flex: 1, marginRight: 8 }}
              />
              <AppButton
                title="Save Changes"
                onPress={handleSaveProfile}
                variant="primary"
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
  avatarWrapper: {
    position: 'relative',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.accentTeal,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  profileTextColumn: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
  },
  userRole: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.accentTeal,
    marginTop: 1,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 2,
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
    fontSize: TYPOGRAPHY.sm + 1,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  roleButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    marginHorizontal: 3,
  },
  roleSwitchBtnActive: {
    backgroundColor: COLORS.primaryNavy,
    borderColor: COLORS.primaryNavy,
  },
  roleSwitchBtnText: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.mainText,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  roleSwitchBtnTextActive: {
    color: COLORS.white,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoKey: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
  },
  infoVal: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
  },
  logoutBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 33, 61, 0.6)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
  },
  modalError: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
});
