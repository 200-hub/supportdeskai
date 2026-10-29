import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { AppButton } from '../components/common/AppButton';

export const WelcomeScreen = ({ onGetStarted, onLogin }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryNavy} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Brand Area */}
        <View style={styles.brandSection}>
          <View style={styles.logoBadge}>
            <Ionicons name="shield-checkmark" size={38} color={COLORS.accentTeal} />
          </View>
          <Text style={styles.appName}>SupportDesk AI</Text>
          <View style={styles.taglineChip}>
            <Text style={styles.tagline}>Smart Support. Simple Solutions.</Text>
          </View>
          <Text style={styles.introduction}>
            A unified omnichannel customer support platform combining real-time live chat, ticket management, and grounded AI assistance.
          </Text>
        </View>

        {/* Feature Highlights (Solid cards) */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Ionicons name="flash-outline" size={18} color={COLORS.accentTeal} />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Instant Grounded Answers</Text>
              <Text style={styles.featureDesc}>Deflect routine questions with verified AI knowledge citations.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Ionicons name="chatbubbles-outline" size={18} color={COLORS.accentTeal} />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Omnichannel Sync</Text>
              <Text style={styles.featureDesc}>Seamlessly track inquiries across Email, WhatsApp, and Chat.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Ionicons name="time-outline" size={18} color={COLORS.accentTeal} />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Guaranteed SLA Resolution</Text>
              <Text style={styles.featureDesc}>Live tracking with at-risk response notifications.</Text>
            </View>
          </View>
        </View>

        {/* Bottom CTA Actions */}
        <View style={styles.actionSection}>
          <AppButton
            title="Get Started"
            onPress={onGetStarted}
            variant="teal"
            size="lg"
            icon={<Ionicons name="arrow-forward" size={18} color={COLORS.white} />}
            iconPosition="right"
            style={styles.primaryBtn}
          />
          <AppButton
            title="Sign In to Existing Account"
            onPress={onLogin}
            variant="outline"
            size="lg"
            style={styles.secondaryBtn}
            textStyle={{ color: COLORS.primaryNavy }}
          />
          <Text style={styles.versionNote}>SupportDesk AI for Android • v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryNavy,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.primaryNavy,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryNavy,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.secondaryNavy,
    borderWidth: 1,
    borderColor: '#2A3F6D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: TYPOGRAPHY.xxl + 2,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  taglineChip: {
    backgroundColor: COLORS.secondaryNavy,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    marginTop: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  tagline: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  introduction: {
    fontSize: TYPOGRAPHY.sm,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  featuresSection: {
    marginVertical: SPACING.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryNavy,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#2A3F6D',
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  featureTextGroup: {
    flex: 1,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  featureDesc: {
    fontSize: TYPOGRAPHY.xs,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  actionSection: {
    paddingBottom: SPACING.sm,
  },
  primaryBtn: {
    marginBottom: SPACING.sm + 2,
  },
  secondaryBtn: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  versionNote: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: '#64748B',
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
