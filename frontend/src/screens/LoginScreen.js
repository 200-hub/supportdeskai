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

const DEMO_ROLES = [
  { role: 'customer', label: 'Customer', icon: 'person-outline' },
  { role: 'agent', label: 'Agent', icon: 'headset-outline' },
  { role: 'admin', label: 'Admin', icon: 'settings-outline' },
];

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

  const handleSignIn = (selectedRole = null) => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Enter your email address.';
    } else if (!email.includes('@')) {
      newErrors.email = 'That email address is missing an @.';
    }

    if (!password.trim()) {
      newErrors.password = 'Enter your password.';
    } else if (password.length < 6) {
      newErrors.password = 'Passwords are at least 6 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    authService
      .login(email.trim(), password, selectedRole)
      .then((res) => {
        setLoading(false);
        if (res.success) {
          onLoginSuccess({
            email: res.user?.email || email.trim(),
            role: res.user?.role || selectedRole,
            name: res.user?.name,
            user: res.user,
            token: res.token,
          });
        } else if (res.isNetworkError) {
          Alert.alert(
            "Couldn't reach the server",
            'Check that your phone is on the same Wi-Fi network as the computer running the backend, then try again.'
          );
        } else {
          Alert.alert(
            "Couldn't sign you in",
            res.error || 'That email and password don’t match. Check them and try again.'
          );
        }
      })
      .catch(() => {
        // Never sign anyone in without a server answer.
        setLoading(false);
        Alert.alert("Something went wrong", 'Your request didn’t complete. Try again in a moment.');
      });
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset your password',
      `If an account exists for ${email || 'your email'}, we'll send a reset link there.`,
      [{ text: 'OK' }]
    );
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
            Welcome back
          </Text>
          <Text style={[TYPE.body, styles.subheading]}>
            Sign in to follow your tickets, or to work the queue if you're on the support team.
          </Text>

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
            placeholder="Your password"
            isPassword
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.inkMuted} />}
            error={errors.password}
          />

          <View style={styles.optionsRow}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
              accessibilityLabel="Remember me"
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe ? <Ionicons name="checkmark" size={14} color={COLORS.onDark} /> : null}
              </View>
              <Text style={[TYPE.body, styles.ink]}>Remember me</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              onPress={handleForgotPassword}
              style={styles.linkBtn}
            >
              <Text style={[TYPE.label, styles.link]}>Forgot password?</Text>
            </Pressable>
          </View>

          <AppButton
            title="Sign in"
            onPress={() => handleSignIn(null)}
            variant="primary"
            size="lg"
            loading={loading}
          />

          <View style={styles.demoSection}>
            <Text style={[TYPE.titleSmall, styles.ink]}>Try a demo account</Text>
            <Text style={[TYPE.bodySmall, styles.muted]}>
              Signs in with the details above as the role you pick.
            </Text>
            <View style={styles.demoRow}>
              {DEMO_ROLES.map(({ role, label, icon }) => (
                <Pressable
                  key={role}
                  accessibilityRole="button"
                  accessibilityLabel={`Sign in as demo ${label.toLowerCase()}`}
                  disabled={loading}
                  onPress={() => handleSignIn(role)}
                  style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                >
                  <Ionicons name={icon} size={16} color={COLORS.violetInk} />
                  <Text style={[TYPE.label, styles.ink]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={[TYPE.body, styles.muted]}>New here?</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create an account"
              onPress={onNavigateToRegister}
              style={styles.linkBtn}
            >
              <Text style={[TYPE.bodyStrong, styles.link]}>Create an account</Text>
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
  ink: { color: COLORS.ink },
  muted: { color: COLORS.inkMuted },
  link: { color: COLORS.violetInk },

  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', minHeight: TOUCH, gap: SPACING.sm },
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
  linkBtn: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: SPACING.xs },

  demoSection: {
    marginTop: SPACING.xxxl,
    paddingTop: SPACING.xxl,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
    gap: SPACING.xs,
  },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: TOUCH,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.paper,
  },
  chipPressed: { backgroundColor: COLORS.violetWash },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
    gap: SPACING.xs,
  },
});
