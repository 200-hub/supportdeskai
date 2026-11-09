import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, ELEVATION } from '../theme/spacing';
import { AppButton } from '../components/common/AppButton';
import { SlaStamp } from '../components/common/SlaStamp';

// Illustrative only: no real customers, no claims.
const SAMPLE_TICKETS = [
  { id: '1042', channel: 'email', subject: 'Refund still not in my account', sla: '2h', status: 'safe' },
  { id: '1043', channel: 'whatsapp', subject: 'Parcel marked delivered, never arrived', sla: '12m', status: 'at-risk' },
  { id: '1044', channel: 'chat', subject: 'Can’t reset my password', sla: '45m', status: 'safe' },
];

// Card positions in the fan: back, middle, front.
const FAN = [
  { top: 0, left: 28, rotate: '-4deg' },
  { top: 96, left: 4, rotate: '2.5deg' },
  { top: 192, left: 20, rotate: '-1.5deg' },
];

const SampleCard = ({ ticket, pose }) => (
  <View style={[styles.card, { top: pose.top, left: pose.left, transform: [{ rotate: pose.rotate }] }]}>
    <View style={styles.cardHead}>
      <Text style={[TYPE.numeric, styles.cardId]}>#{ticket.id}</Text>
      <Text style={[TYPE.labelSmall, styles.cardChannel]} numberOfLines={1}>
        {COLORS.channel[ticket.channel].label}
      </Text>
      <SlaStamp remaining={ticket.sla} status={ticket.status} size="sm" />
    </View>
    <Text style={[TYPE.titleSmall, styles.cardSubject]} numberOfLines={1}>
      {ticket.subject}
    </Text>
  </View>
);

export const WelcomeScreen = ({ onGetStarted, onLogin }) => {

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.violet} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={[TYPE.label, styles.appName]}>SupportDesk AI</Text>

          <Text accessibilityRole="header" style={[TYPE.display, styles.headline]}>
            One inbox for every support channel.
          </Text>
          <Text style={[TYPE.body, styles.intro]}>
            Email, WhatsApp, live chat and web forms arrive in one queue. Every ticket carries its
            deadline, so your team answers before it runs out.
          </Text>
        </View>

        <View>
        <View
          style={styles.fan}
          accessible
          accessibilityLabel="Example tickets, each stamped with the time left to answer. One is close to its deadline."
        >
          {SAMPLE_TICKETS.map((ticket, i) => (
            <SampleCard key={ticket.id} ticket={ticket} pose={FAN[i]} />
          ))}
        </View>
        <Text style={[TYPE.bodySmall, styles.caption]}>Example tickets</Text>
        </View>

        <View style={styles.actions}>
          <AppButton title="Get started" onPress={onGetStarted} variant="primary" size="lg" />
          <AppButton
            title="I already have an account"
            onPress={onLogin}
            variant="outline"
            size="lg"
            style={styles.outlineBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.violet },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
  },
  appName: { color: COLORS.ink, marginBottom: SPACING.xxxl },
  headline: { color: COLORS.ink, maxWidth: 340 },
  intro: { color: COLORS.ink, marginTop: SPACING.md, maxWidth: 340 },

  fan: { height: 296, marginTop: SPACING.xxxl, marginRight: SPACING.xxl },
  card: {
    position: 'absolute',
    right: 0,
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    ...ELEVATION.raised,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.violet,
    marginBottom: SPACING.md,
  },
  cardId: { color: COLORS.ink },
  cardChannel: { color: COLORS.inkMuted, flex: 1, marginLeft: SPACING.md },
  cardSubject: { color: COLORS.ink },
  caption: { color: COLORS.ink, marginTop: SPACING.md },

  actions: { marginTop: SPACING.xxxl, gap: SPACING.md },
  outlineBtn: { borderColor: COLORS.ink },
});
