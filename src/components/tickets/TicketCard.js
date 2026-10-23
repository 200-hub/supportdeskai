import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { Avatar } from '../common/Avatar';

export const TicketCard = ({
  ticket,
  onPress,
  showCustomer = true,
  showAssignee = false,
  onClaimTicket,
  onAssignTicket,
}) => {
  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email':
        return 'mail-outline';
      case 'whatsapp':
        return 'logo-whatsapp';
      case 'chat':
        return 'chatbubbles-outline';
      case 'web':
        return 'globe-outline';
      default:
        return 'chatbox-outline';
    }
  };

  const isAtRisk = ticket.slaStatus === 'at-risk';
  const descriptionText =
    ticket.description ||
    (ticket.messages && ticket.messages.length > 0
      ? ticket.messages[0].content
      : 'No description provided.');
  const assignedTo = ticket.assignedTo || '';
  const isUnassigned =
    !assignedTo || assignedTo.trim() === '' || assignedTo === 'Auto-Routing Queue';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress && onPress(ticket)}
      style={styles.card}
    >
      {/* Top row: ID, Channel & SLA Status */}
      <View style={styles.topRow}>
        <View style={styles.idAndChannel}>
          <Text style={styles.ticketId}>#{ticket.id}</Text>
          <View style={styles.channelChip}>
            <Ionicons
              name={getChannelIcon(ticket.channel)}
              size={12}
              color={COLORS.channel[ticket.channel]?.text || COLORS.secondaryText}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.channelText,
                { color: COLORS.channel[ticket.channel]?.text || COLORS.secondaryText },
              ]}
            >
              {COLORS.channel[ticket.channel]?.label || ticket.channel || 'Ticket'}
            </Text>
          </View>
        </View>

        {/* SLA Timer Pill */}
        {ticket.slaRemaining && (
          <View
            style={[
              styles.slaChip,
              {
                backgroundColor: isAtRisk ? COLORS.priority.urgent.bg : COLORS.lightBg,
                borderColor: isAtRisk ? '#FCA5A5' : COLORS.border,
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={12}
              color={isAtRisk ? COLORS.priority.urgent.text : COLORS.secondaryText}
              style={{ marginRight: 3 }}
            />
            <Text
              style={[
                styles.slaText,
                { color: isAtRisk ? COLORS.priority.urgent.text : COLORS.secondaryText },
              ]}
            >
              {ticket.slaRemaining}
            </Text>
          </View>
        )}
      </View>

      {/* Subject Line */}
      <Text style={styles.subject} numberOfLines={2}>
        {ticket.subject}
      </Text>

      {/* Description Snippet */}
      <Text style={styles.description} numberOfLines={2}>
        {descriptionText}
      </Text>

      {/* Customer Info Row */}
      {showCustomer && ticket.customer && (
        <View style={styles.customerRow}>
          <Avatar
            initials={ticket.customer.avatarInitials || 'CU'}
            size={24}
            bgColor={COLORS.secondaryNavy}
          />
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{ticket.customer.name}</Text>
            {ticket.customer.company && (
              <Text style={styles.customerCompany} numberOfLines={1}>
                • {ticket.customer.company}
              </Text>
            )}
          </View>
          <Text style={styles.timeAgo}>{ticket.updatedAt || 'Recent'}</Text>
        </View>
      )}

      {/* Assignee Row */}
      {showAssignee && (
        <View style={styles.assigneeRow}>
          <View style={styles.assigneeLeft}>
            <Ionicons
              name={isUnassigned ? 'help-circle-outline' : 'person-outline'}
              size={13}
              color={isUnassigned ? COLORS.warning : COLORS.primaryNavy}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.assigneeLabel}>Assigned to:</Text>
            <View
              style={[
                styles.assigneeBadge,
                isUnassigned ? styles.unassignedBadge : styles.assignedBadge,
              ]}
            >
              <Text
                style={[
                  styles.assigneeText,
                  isUnassigned ? styles.unassignedText : styles.assignedText,
                ]}
                numberOfLines={1}
              >
                {isUnassigned ? 'Unassigned' : assignedTo}
              </Text>
            </View>
          </View>

          <View style={styles.assigneeActions}>
            {isUnassigned && onClaimTicket && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.claimBtn}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onClaimTicket(ticket);
                }}
              >
                <Ionicons name="hand-right-outline" size={11} color={COLORS.white} style={{ marginRight: 3 }} />
                <Text style={styles.claimBtnText}>Claim</Text>
              </TouchableOpacity>
            )}
            {onAssignTicket && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.reassignBtn}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onAssignTicket(ticket);
                }}
              >
                <Text style={styles.reassignBtnText}>
                  {isUnassigned ? 'Assign' : 'Change'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Bottom Row: Status & Priority Badges */}
      <View style={styles.bottomRow}>
        <View style={styles.badgesGroup}>
          <StatusBadge status={ticket.status} size="sm" />
          <View style={{ width: 6 }} />
          <PriorityBadge priority={ticket.priority} size="sm" />
        </View>

        <View style={styles.dateGroup}>
          <Ionicons name="calendar-outline" size={11} color={COLORS.secondaryText} style={{ marginRight: 3 }} />
          <Text style={styles.dateText}>{ticket.createdDate || ticket.updatedAt || 'Today'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs + 2,
  },
  idAndChannel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketId: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
    marginRight: SPACING.sm,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  channelText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
  },
  slaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  slaText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  subject: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    lineHeight: TYPOGRAPHY.lineHeightNormal,
    marginBottom: 4,
  },
  description: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    lineHeight: 18,
    marginBottom: SPACING.sm + 2,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  customerName: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.mainText,
  },
  customerCompany: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginLeft: 4,
    flexShrink: 1,
  },
  timeAgo: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    marginBottom: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assigneeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.xs,
  },
  assigneeLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginRight: 5,
  },
  assigneeBadge: {
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 130,
  },
  assignedBadge: {
    backgroundColor: '#EEF2FF',
  },
  unassignedBadge: {
    backgroundColor: '#FEF3C7',
  },
  assigneeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  assignedText: {
    color: COLORS.primaryNavy,
  },
  unassignedText: {
    color: COLORS.warning,
  },
  assigneeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentTeal,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  claimBtnText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  reassignBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reassignBtnText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.secondaryText,
  },
});
