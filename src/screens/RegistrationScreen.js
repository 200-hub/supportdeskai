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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { AppTextInput } from '../components/common/AppTextInput';
import { AppButton } from '../components/common/AppButton';

export const RegistrationScreen = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onNavigateBack,
}) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Please enter your full name.';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your work email.';
    } else if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password.trim()) {
      newErrors.password = 'Please enter a password.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service & Privacy Policy.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Account Created',
        'Your SupportDesk AI customer account has been created successfully.',
        [
          {
            text: 'Continue',
            onPress: () =>
              onRegisterSuccess({
                name: fullName.trim(),
                email: email.trim(),
                role: 'customer',
              }),
          },
        ]
      );
    }, 500);
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

          {/* Heading */}
          <View style={styles.headerSection}>
            <View style={styles.brandIcon}>
              <Ionicons name="person-add-outline" size={24} color={COLORS.accentTeal} />
            </View>
            <Text style={styles.heading}>Create Account</Text>
            <Text style={styles.subheading}>
              Join SupportDesk AI to get rapid customer support and 24/7 AI assistance.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <AppTextInput
              label="Full Name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
              }}
              placeholder="e.g. Sarah Connor"
              leftIcon={<Ionicons name="person-outline" size={18} color={COLORS.secondaryText} />}
              error={errors.fullName}
            />

            <AppTextInput
              label="Work Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="e.g. sarah@company.com"
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
              placeholder="At least 6 characters"
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.secondaryText} />}
              error={errors.password}
            />

            <AppTextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
              }}
              placeholder="Re-enter password"
              isPassword
              leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={COLORS.secondaryText} />}
              error={errors.confirmPassword}
            />

            {/* Terms Checkbox */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setAgreedToTerms(!agreedToTerms);
                if (errors.terms) setErrors((prev) => ({ ...prev, terms: null }));
              }}
              style={styles.checkboxRow}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Ionicons name="checkmark" size={13} color={COLORS.white} />}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>

            {errors.terms && (
              <View style={styles.termsErrorRow}>
                <Ionicons name="alert-circle" size={12} color={COLORS.error} style={{ marginRight: 4 }} />
                <Text style={styles.termsErrorText}>{errors.terms}</Text>
              </View>
            )}

            {/* Submit Button */}
            <AppButton
              title="Create Account"
              onPress={handleRegister}
              variant="teal"
              size="lg"
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          {/* Footer Link to Login */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateToLogin}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text style={styles.loginLink}>Sign In</Text>
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
  headerSection: {
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
  heading: {
    fontSize: TYPOGRAPHY.xl + 2,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.accentTeal,
    borderColor: COLORS.accentTeal,
  },
  checkboxText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.mainText,
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  termsErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  termsErrorText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.error,
  },
  submitBtn: {
    marginTop: SPACING.sm,
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
  loginLink: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.primaryNavy,
    fontWeight: TYPOGRAPHY.bold,
  },
});
