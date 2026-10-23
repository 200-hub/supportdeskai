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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
    }, 500);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Password Reset',
      `A password reset link will be sent to ${email || 'your email'} if an account exists.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Nav Back */}
          {onNavigateBack && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateBack}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.primaryNavy} />
            </TouchableOpacity>
          )}

          {/* Branding Header */}
          <View style={styles.brandContainer}>
            <View style={styles.brandIcon}>
              <Ionicons name="shield-checkmark" size={28} color={COLORS.accentTeal} />
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
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={13} color={COLORS.white} />}
                </View>
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <AppButton
              title="Sign In"
              onPress={() => handleSignIn('customer')}
              variant="primary"
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
            <TouchableOpacity activeOpacity={0.7} onPress={onNavigateToRegister}>
              <Text style={styles.createAccountLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs + 2,
  },
  appName: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    marginTop: SPACING.xs,
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
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
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
    marginBottom: SPACING.md,
  },
  demoSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginBottom: SPACING.xs + 2,
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
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginHorizontal: 4,
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
    marginTop: SPACING.xl,
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
