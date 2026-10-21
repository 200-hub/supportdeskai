import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { Avatar } from '../components/common/Avatar';
import { SummaryCard } from '../components/common/SummaryCard';
import { TicketCard } from '../components/tickets/TicketCard';
import { AppButton } from '../components/common/AppButton';

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
  const [search, setSearch] = useState('');

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const recentTickets = tickets.slice(0, 3);
  const recentConvs = conversations.slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.userRow}>
          <Avatar
            initials={user?.avatarInitials || 'SC'}
            size={42}
            bgColor={COLORS.secondaryNavy}
          />
          <View style={styles.userTextGroup}>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.name || 'Sarah Connor'}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Persona / Role Switcher for instant demo evaluation */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSwitchRole}
            style={styles.roleChip}
          >
            <Ionicons name="swap-horizontal" size={13} color={COLORS.accentTeal} style={{ marginRight: 3 }} />
            <Text style={styles.roleChipText}>Role: {user?.role || 'Customer'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onNavigateToNotifications}
            style={styles.notifButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
            {unreadNotifCount > 0 && (
              <View style={styles.notifDot}>
                <Text style={styles.notifDotText}>{unreadNotifCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Search Field */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onNavigateToHelpCenter}
          style={styles.searchBarContainer}
        >
          <Ionicons name="search-outline" size={18} color={COLORS.secondaryText} style={{ marginRight: SPACING.sm }} />
          <Text style={styles.searchPlaceholder}>How can we assist you today? Search articles...</Text>
        </TouchableOpacity>

        {/* Primary Action Buttons (2 buttons side by side) */}
        <View style={styles.primaryActionRow}>
          <AppButton
            title="Start a Conversation"
            onPress={onNavigateToChat}
            variant="teal"
            size="md"
            icon={<Ionicons name="chatbubbles" size={17} color={COLORS.white} />}
            style={styles.halfBtn}
          />

          <AppButton
            title="Create Ticket"
            onPress={onNavigateToCreateTicket}
            variant="primary"
            size="md"
            icon={<Ionicons name="add-circle-outline" size={17} color={COLORS.white} />}
            style={styles.halfBtn}
          />
        </View>

        {/* Summary Cards: Open, Pending, Resolved */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ticket Overview</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigateToMyTickets('all')}>
            <Text style={styles.seeAllLink}>View All ({tickets.length})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCardsRow}>
          <SummaryCard
            title="Open"
            value={openCount}
            icon="alert-circle-outline"
            iconColor="#1D4ED8"
            iconBg="#EFF6FF"
            subtitle="Action required"
            onPress={() => onNavigateToMyTickets('open')}
            style={styles.summaryCardMargin}
          />

          <SummaryCard
            title="Pending"
            value={pendingCount}
            icon="time-outline"
            iconColor={COLORS.warning}
            iconBg="#FEF3C7"
            subtitle="Awaiting info"
            onPress={() => onNavigateToMyTickets('pending')}
            style={styles.summaryCardMargin}
          />

          <SummaryCard
            title="Resolved"
            value={resolvedCount}
            icon="checkmark-done-circle-outline"
            iconColor={COLORS.success}
            iconBg="#DCFCE7"
            subtitle="Closed"
            onPress={() => onNavigateToMyTickets('resolved')}
          />
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateToHelpCenter}
              style={styles.quickActionItem}
            >
              <View style={[styles.quickIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="book-outline" size={20} color={COLORS.primaryNavy} />
              </View>
              <Text style={styles.quickActionLabel}>Help Articles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateToHistory}
              style={styles.quickActionItem}
            >
              <View style={[styles.quickIconBox, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="archive-outline" size={20} color={COLORS.accentTeal} />
              </View>
              <Text style={styles.quickActionLabel}>Chat History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigateToMyTickets('all')}
              style={styles.quickActionItem}
            >
              <View style={[styles.quickIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="ticket-outline" size={20} color={COLORS.warning} />
              </View>
              <Text style={styles.quickActionLabel}>My Tickets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateToNotifications}
              style={styles.quickActionItem}
            >
              <View style={[styles.quickIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.quickActionLabel}>Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Conversations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Conversations</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onNavigateToHistory}>
            <Text style={styles.seeAllLink}>See History</Text>
          </TouchableOpacity>
        </View>

        {recentConvs.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            activeOpacity={0.7}
            onPress={() => onNavigateToChat(conv)}
            style={styles.conversationCard}
          >
            <View style={styles.convIconBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.accentTeal} />
            </View>
            <View style={styles.convTextGroup}>
              <View style={styles.convTopRow}>
                <Text style={styles.convTitle}>{conv.title}</Text>
                <Text style={styles.convTime}>{conv.time}</Text>
              </View>
              <Text style={styles.convLastMessage} numberOfLines={1}>
                {conv.lastMessage}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Recent Tickets Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tickets</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigateToMyTickets('all')}>
            <Text style={styles.seeAllLink}>All Tickets</Text>
          </TouchableOpacity>
        </View>

        {recentTickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onPress={onNavigateToTicketDetails}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  headerBar: {
    backgroundColor: COLORS.primaryNavy,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryNavy,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextGroup: {
    marginLeft: SPACING.sm + 2,
  },
  greeting: {
    fontSize: TYPOGRAPHY.xs,
    color: '#94A3B8',
  },
  userName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryNavy,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: SPACING.sm,
  },
  roleChipText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.semiBold,
    textTransform: 'capitalize',
  },
  notifButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.secondaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: COLORS.accentTeal,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifDotText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  searchBarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  searchPlaceholder: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    flex: 1,
  },
  primaryActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  halfBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
  },
  seeAllLink: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.accentTeal,
  },
  summaryCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  summaryCardMargin: {
    marginRight: SPACING.sm,
  },
  quickActionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.mainText,
    fontWeight: TYPOGRAPHY.medium,
  },
  conversationCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  convIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  convTextGroup: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  convTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
    flex: 1,
    marginRight: SPACING.sm,
  },
  convTime: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
  },
  convLastMessage: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
  },
});
