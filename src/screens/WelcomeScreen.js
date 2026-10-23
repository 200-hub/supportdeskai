import React from 'react';
<<<<<<< HEAD
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
=======
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
>>>>>>> 0b732f9ac4605d0f26e286a0f378ee378b0acd83
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { AppButton } from '../components/common/AppButton';

export const WelcomeScreen = ({ onGetStarted, onLogin }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screenWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.lightBg} translucent={false} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: SPACING.md,
            paddingBottom: Math.max(insets.bottom, 18),
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Brand Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoBadge}>
            <Ionicons name="shield-checkmark" size={34} color={COLORS.accentTeal} />
          </View>
          <Text style={styles.appName}>SupportDesk AI</Text>
          <View style={styles.taglineChip}>
            <Ionicons name="sparkles" size={12} color="#0F766E" style={{ marginRight: 5 }} />
            <Text style={styles.tagline}>Smart Support. Simple Solutions.</Text>
          </View>
          <Text style={styles.introduction}>
            A unified omnichannel customer support platform combining real-time live chat, ticket management, and grounded AI assistance.
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Ionicons name="flash-outline" size={19} color={COLORS.accentTeal} />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Instant Grounded Answers</Text>
              <Text style={styles.featureDesc}>
                Deflect routine questions with verified AI knowledge citations.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Ionicons name="chatbubbles-outline" size={19} color={COLORS.accentTeal} />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Omnichannel Sync</Text>
              <Text style={styles.featureDesc}>
                Seamlessly track inquiries across Email, WhatsApp, and Live Chat.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Ionicons name="time-outline" size={19} color={COLORS.accentTeal} />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Guaranteed SLA Resolution</Text>
              <Text style={styles.featureDesc}>
                Live tracking with at-risk response countdown alerts.
              </Text>
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
            variant="navy"
            size="lg"
            style={styles.secondaryBtn}
          />

          <Text style={styles.versionNote}>SupportDesk AI for Mobile • v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  scrollArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightBg,
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  appName: {
    fontSize: TYPOGRAPHY.xl + 2,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
    letterSpacing: 0.3,
  },
  taglineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    marginTop: 6,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  tagline: {
    fontSize: TYPOGRAPHY.xs,
    color: '#0F766E',
    fontWeight: TYPOGRAPHY.bold,
  },
  introduction: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
    paddingHorizontal: SPACING.xs,
  },
  featuresSection: {
    marginVertical: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F0FDFA',
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
    color: COLORS.primaryNavy,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    lineHeight: 16,
  },
  actionSection: {
    paddingTop: SPACING.xs,
  },
  primaryBtn: {
    marginBottom: SPACING.sm,
  },
  secondaryBtn: {
    marginBottom: SPACING.sm,
  },
  versionNote: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginTop: 2,
  },
});
