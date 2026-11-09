import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { TicketCard } from '../components/tickets/TicketCard';
import { SettingsItem } from '../components/common/SettingsItem';
import { EmptyState } from '../components/common/EmptyState';

// Breached first, then at risk, then everything else in its original order.
const SLA_RANK = { breached: 0, 'at-risk': 1 };

const SectionHeading = ({ title, linkLabel, onLink }) => (
  <View style={styles.sectionHeader}>
    <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.sectionTitle]}>
      {title}
    </Text>
    {onLink ? (
      <Pressable accessibilityRole="button" accessibilityLabel={linkLabel} onPress={onLink} style={styles.linkBtn}>
        <Text style={[TYPE.label, styles.link]}>{linkLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

export const CustomerHomeScreen = ({
  user,
  tickets = [],
  conversations = [],
  notifications = [],
  onNavigateToTicketDetails,
  onNavigateToMyTickets,
  onNavigateToCreateTicket,
  onNavigateToChat,
  onNavigateToHistory,
  onNavigateToHelpCenter,
  onNavigateToNotifications,
  onSwitchRole,
}) => {
  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const activeTickets = tickets
    .filter((t) => t.status === 'open' || t.status === 'pending')
    .map((t, i) => ({ t, i }))
    .sort((a, b) => (SLA_RANK[a.t.slaStatus] ?? 2) - (SLA_RANK[b.t.slaStatus] ?? 2) || a.i - b.i)
    .slice(0, 2)
    .map(({ t }) => t);
  const recentConvs = conversations.slice(0, 3);

  const firstName = (user?.name || 'Sarah Connor').split(' ')[0];
  const role = user?.role || 'customer';
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const goToTickets = (filter) => onNavigateToMyTickets && onNavigateToMyTickets(filter);
  const startChat = () => onNavigateToChat && onNavigateToChat();
  const createTicket = () => onNavigateToCreateTicket && onNavigateToCreateTicket();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Switch role. Current role: ${roleLabel}`}
          onPress={onSwitchRole}
          hitSlop={4}
          style={({ pressed }) => [styles.roleChip, pressed && styles.pressed]}
        >
          <Ionicons name="swap-horizontal" size={16} color={COLORS.violetInk} />
          <Text style={[TYPE.label, styles.ink]}>{roleLabel}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            unreadNotifCount > 0 ? `Notifications, ${unreadNotifCount} unread` : 'Notifications'
          }
          onPress={onNavigateToNotifications}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.ink} />
          {unreadNotifCount > 0 ? (
            <View style={styles.badge}>
              <Text style={[TYPE.numeric, styles.badgeText]}>
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Text accessibilityRole="header" style={[TYPE.headline, styles.ink]}>
          Hi, {firstName}
        </Text>
        <Text style={[TYPE.body, styles.muted, styles.greetingSub]}>
          {activeTickets.length > 0
            ? 'Here’s where your requests stand.'
            : 'Nothing open right now. Ask the assistant or raise a ticket if something’s wrong.'}
        </Text>

        {pendingCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${pendingCount} ${pendingCount === 1 ? 'ticket needs' : 'tickets need'} a reply from you`}
            onPress={() => goToTickets('pending')}
            style={({ pressed }) => [styles.waiting, pressed && styles.waitingPressed]}
          >
            <View style={styles.waitingCount}>
              <Text style={[TYPE.numeric, styles.ink]}>{pendingCount}</Text>
            </View>
            <Text style={[TYPE.bodyStrong, styles.waitingText]}>
              {pendingCount === 1 ? 'ticket needs' : 'tickets need'} a reply from you
            </Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lemonInk} />
          </Pressable>
        ) : null}

        <SectionHeading
          title="Open tickets"
          linkLabel={`All tickets (${tickets.length})`}
          onLink={() => goToTickets('all')}
        />
        {activeTickets.length > 0 ? (
          activeTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onPress={onNavigateToTicketDetails} showCustomer={false} />
          ))
        ) : (
          <View style={styles.sheet}>
            <EmptyState
              icon="ticket-outline"
              title="No open tickets"
              message="When you raise a ticket, you’ll see its progress and deadline here."
              actionLabel="Create ticket"
              onAction={createTicket}
            />
          </View>
        )}

        <SectionHeading title="Get help" />
        <View style={styles.sheet}>
          <SettingsItem
            icon="add-circle-outline"
            title="New ticket"
            subtitle="Describe the problem and we’ll track it for you"
            onPress={createTicket}
          />
          <SettingsItem
            icon="sparkles-outline"
            title="Ask the assistant"
            subtitle="Quick answers from the help centre"
            onPress={startChat}
          />
          <SettingsItem
            icon="book-outline"
            title="Help centre"
            subtitle="Guides and common questions"
            onPress={onNavigateToHelpCenter}
            showBorder={false}
          />
        </View>

        <SectionHeading title="Recent conversations" linkLabel="History" onLink={onNavigateToHistory} />
        {recentConvs.length > 0 ? (
          <View style={styles.sheet}>
            {recentConvs.map((conv, i) => (
              <Pressable
                key={conv.id}
                accessibilityRole="button"
                accessibilityLabel={`Conversation: ${conv.title}`}
                onPress={() => onNavigateToChat && onNavigateToChat(conv)}
                style={({ pressed }) => [
                  styles.convRow,
                  i < recentConvs.length - 1 && styles.rowBorder,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.convTop}>
                  <Text style={[TYPE.bodyStrong, styles.convTitle]} numberOfLines={1}>
                    {conv.title}
                  </Text>
                  <Text style={[TYPE.numeric, styles.faint]}>{conv.time}</Text>
                </View>
                <Text style={[TYPE.bodySmall, styles.muted]} numberOfLines={1}>
                  {conv.lastMessage}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.sheet}>
            <EmptyState
              icon="chatbubbles-outline"
              title="No conversations yet"
              message="Ask the assistant a question and the conversation will be saved here."
              actionLabel="Ask the assistant"
              onAction={startChat}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 40,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.paper,
  },
  iconBtn: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: COLORS.groundDeep },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: COLORS.lemon,
    borderWidth: 1.5,
    borderColor: COLORS.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, lineHeight: 12, color: COLORS.ink },

  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.xxxl },
  ink: { color: COLORS.ink },
  muted: { color: COLORS.inkMuted },
  faint: { color: COLORS.inkFaint },
  greetingSub: { marginTop: SPACING.xs },

  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 56,
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.lemonWash,
  },
  waitingPressed: { backgroundColor: COLORS.lemon },
  waitingCount: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: SPACING.xs,
    borderRadius: 14,
    backgroundColor: COLORS.lemon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingText: { color: COLORS.lemonInk, flex: 1 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xs,
  },
  sectionTitle: { color: COLORS.ink },
  linkBtn: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: SPACING.sm, marginRight: -SPACING.sm },
  link: { color: COLORS.violetInk },

  sheet: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    overflow: 'hidden',
  },
  convRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, minHeight: 64, justifyContent: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.rule },
  convTop: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm, marginBottom: 2 },
  convTitle: { color: COLORS.ink, flex: 1 },
});
