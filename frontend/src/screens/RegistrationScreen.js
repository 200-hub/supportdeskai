import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { AppTextInput } from '../components/common/AppTextInput';
import { AppButton } from '../components/common/AppButton';
import { authService } from '../services/authService';

export const RegistrationScreen = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onNavigateBack,
}) => {
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
      newErrors.fullName = 'Enter your full name.';
    }

    if (!email.trim()) {
      newErrors.email = 'Enter your email address.';
    } else if (!email.includes('@')) {
      newErrors.email = 'That email address is missing an @.';
    }

    if (!password.trim()) {
      newErrors.password = 'Choose a password.';
    } else if (password.length < 6) {
      newErrors.password = 'Use at least 6 characters.';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Type your password again.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "The passwords don't match.";
    }

    if (!agreedToTerms) {
      newErrors.terms = 'Agree to the terms to create your account.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    authService
      .register({
        name: fullName.trim(),
        email: email.trim(),
        password: password,
        role: 'customer',
      })
      .then((res) => {
        setLoading(false);
        if (res.success) {
          Alert.alert('Account created', 'Your SupportDesk AI account is ready.', [
            {
              text: 'Continue',
              onPress: () =>
                onRegisterSuccess({
                  name: res.user?.name || fullName.trim(),
                  email: res.user?.email || email.trim(),
                  role: res.user?.role || 'customer',
                  user: res.user,
                  token: res.token,
                }),
            },
          ]);
        } else if (res.isNetworkError) {
          Alert.alert(
            "Couldn't reach the server",
            'Check that your phone is on the same Wi-Fi network as the computer running the backend, then try again.'
          );
        } else {
          Alert.alert(
            "Couldn't create your account",
            res.error || 'Check your details and try again.'
          );
        }
      })
      .catch(() => {
        // Never sign anyone in without a server answer.
        setLoading(false);
        Alert.alert("Something went wrong", 'Your request didn’t complete. Try again in a moment.');
      });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            {onNavigateBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={onNavigateBack}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
              </Pressable>
            ) : null}
            <Text style={[TYPE.label, styles.appName]}>SupportDesk AI</Text>
          </View>

          <Text accessibilityRole="header" style={[TYPE.headline, styles.heading]}>
            Create your account
          </Text>
          <Text style={[TYPE.body, styles.subheading]}>
            Raise tickets, follow their progress and ask the assistant, all in one place.
          </Text>

          <AppTextInput
            label="Full name"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
            }}
            placeholder="Your name"
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={20} color={COLORS.inkMuted} />}
            error={errors.fullName}
          />

          <AppTextInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            placeholder="name@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.inkMuted} />}
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
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.inkMuted} />}
            error={errors.password}
          />

          <AppTextInput
            label="Confirm password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
            }}
            placeholder="Type it again"
            isPassword
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.inkMuted} />}
            error={errors.confirmPassword}
          />

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreedToTerms }}
            accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
            onPress={() => {
              setAgreedToTerms(!agreedToTerms);
              if (errors.terms) setErrors((prev) => ({ ...prev, terms: null }));
            }}
            style={styles.checkboxRow}
          >
            <View
              style={[
                styles.checkbox,
                agreedToTerms && styles.checkboxChecked,
                errors.terms && !agreedToTerms && styles.checkboxError,
              ]}
            >
              {agreedToTerms ? <Ionicons name="checkmark" size={14} color={COLORS.onDark} /> : null}
            </View>
            <Text style={[TYPE.body, styles.checkboxText]}>
              I agree to the Terms of Service and Privacy Policy.
            </Text>
          </Pressable>

          {errors.terms ? (
            <View style={styles.termsErrorRow}>
              <Ionicons name="alert-circle" size={14} color={COLORS.error} />
              <Text style={[TYPE.bodySmall, styles.error]}>{errors.terms}</Text>
            </View>
          ) : null}

          <AppButton
            title="Create account"
            onPress={handleRegister}
            variant="primary"
            size="lg"
            loading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.footerRow}>
            <Text style={[TYPE.body, styles.muted]}>Already have an account?</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              onPress={onNavigateToLogin}
              style={styles.linkBtn}
            >
              <Text style={[TYPE.bodyStrong, styles.link]}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.ground },
  keyboardView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', minHeight: TOUCH, marginBottom: SPACING.xxl },
  iconBtn: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -SPACING.md,
    marginRight: SPACING.xs,
  },
  pressed: { backgroundColor: COLORS.groundDeep },
  appName: { color: COLORS.violetInk },
  heading: { color: COLORS.ink },
  subheading: { color: COLORS.inkMuted, marginTop: SPACING.sm, marginBottom: SPACING.xxl, maxWidth: 420 },
  muted: { color: COLORS.inkMuted },
  link: { color: COLORS.violetInk },
  error: { color: COLORS.error },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', minHeight: TOUCH, gap: SPACING.md },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
    borderColor: COLORS.ruleStrong,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.violetInk, borderColor: COLORS.violetInk },
  checkboxError: { borderColor: COLORS.error },
  checkboxText: { color: COLORS.ink, flex: 1 },
  termsErrorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  submitBtn: { marginTop: SPACING.xxl },
  linkBtn: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: SPACING.xs },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.xs,
  },
});
