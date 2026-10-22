import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { AppTextInput } from '../components/common/AppTextInput';
import { AppButton } from '../components/common/AppButton';

export const LoginScreen = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateBack,
}) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('sarah.connor@cyberdyne.org');
  const [password, setPassword] = useState('Password123!');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSignIn = (selectedRole = 'customer') => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Please enter your work email.';
    } else if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password.trim()) {
      newErrors.password = 'Please enter your password.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        email: email.trim(),
        role: selectedRole,
      });
    }, 450);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Password Reset',
      `A password reset link will be sent to ${email || 'your email'} if an account exists.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: SPACING.md,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Nav Back */}
          {onNavigateBack && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateBack}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.primaryNavy} />
            </TouchableOpacity>
          )}

          {/* Branding Header */}
          <View style={styles.brandContainer}>
            <View style={styles.brandIcon}>
              <Ionicons name="shield-checkmark" size={26} color={COLORS.accentTeal} />
            </View>
            <Text style={styles.appName}>SupportDesk AI</Text>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>
              Sign in to manage omnichannel tickets, view SLA alerts, and chat with AI.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <AppTextInput
              label="Work Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="e.g. name@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.secondaryText} />}
              error={errors.email}
            />

            <AppTextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
              }}
              placeholder="Enter your password"
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.secondaryText} />}
              error={errors.password}
            />

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setRememberMe(!rememberMe)}
                style={styles.checkboxRow}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={13} color={COLORS.white} />}
                </View>
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleForgotPassword}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <AppButton
              title="Sign In"
              onPress={() => handleSignIn('customer')}
              variant="navy"
              size="lg"
              loading={loading}
              style={styles.submitBtn}
            />

            {/* Quick Demo Role Logins */}
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>Demo Quick Sign-In:</Text>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSignIn('customer')}
                  style={styles.demoRoleChip}
                >
                  <Ionicons name="person-outline" size={13} color={COLORS.primaryNavy} style={{ marginRight: 4 }} />
                  <Text style={styles.demoRoleText}>Customer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSignIn('agent')}
                  style={styles.demoRoleChip}
                >
                  <Ionicons name="headset-outline" size={13} color={COLORS.primaryNavy} style={{ marginRight: 4 }} />
                  <Text style={styles.demoRoleText}>Agent</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSignIn('admin')}
                  style={styles.demoRoleChip}
                >
                  <Ionicons name="settings-outline" size={13} color={COLORS.primaryNavy} style={{ marginRight: 4 }} />
                  <Text style={styles.demoRoleText}>Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer Register Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account yet? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateToRegister}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.createAccountLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    flexGrow: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  appName: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: TYPOGRAPHY.xl + 2,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    marginTop: 2,
  },
  subheading: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 290,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs + 2,
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.accentTeal,
    borderColor: COLORS.accentTeal,
  },
  checkboxLabel: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.mainText,
  },
  forgotText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  submitBtn: {
    marginBottom: SPACING.sm,
  },
  demoSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm + 2,
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.medium,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  demoRoleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 3,
  },
  demoRoleText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.mainText,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.secondaryText,
  },
  createAccountLink: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.primaryNavy,
    fontWeight: TYPOGRAPHY.bold,
  },
});
