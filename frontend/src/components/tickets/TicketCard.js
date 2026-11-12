import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { SlaStamp } from '../common/SlaStamp';
import { Avatar } from '../common/Avatar';
import { AppButton } from '../common/AppButton';

const CHANNEL_ICON = {
  email: 'mail-outline',
  whatsapp: 'logo-whatsapp',
  chat: 'chatbubbles-outline',
  web: 'globe-outline',
};

// A ticket as an index card: violet header rule, subject, the SLA stamp.
export const TicketCard = ({
  ticket,
  onPress,
  showCustomer = true,
  showAssignee = false,
  onClaimTicket,
  onAssignTicket,
}) => {
  const channel = COLORS.channel[ticket.channel];
  const description =
    ticket.description || ticket.messages?.[0]?.content || 'No description provided.';
  const assignedTo = (ticket.assignedTo || '').trim();
  const isUnassigned = !assignedTo || assignedTo === 'Auto-Routing Queue';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ticket ${ticket.id}: ${ticket.subject}`}
      onPress={() => onPress && onPress(ticket)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={[TYPE.numeric, styles.id]}>#{ticket.id}</Text>
        <Ionicons
          name={CHANNEL_ICON[ticket.channel] || 'chatbox-outline'}
          size={14}
          color={COLORS.inkMuted}
          style={styles.channelIcon}
        />
        <Text style={[TYPE.labelSmall, styles.channel]} numberOfLines={1}>
          {channel?.label || ticket.channel || 'Ticket'}
        </Text>
        <SlaStamp remaining={ticket.slaRemaining} status={ticket.slaStatus} size="sm" />
      </View>

      <Text style={[TYPE.titleSmall, styles.subject]} numberOfLines={2}>
        {ticket.subject}
      </Text>
      <Text style={[TYPE.bodySmall, styles.description]} numberOfLines={2}>
        {description}
      </Text>

      {showCustomer && ticket.customer ? (
        <View style={styles.customerRow}>
          <Avatar initials={ticket.customer.avatarInitials || 'CU'} size={28} />
          <Text style={[TYPE.label, styles.customerName]} numberOfLines={1}>
            {ticket.customer.name}
            {ticket.customer.company ? (
              <Text style={styles.company}>{`, ${ticket.customer.company}`}</Text>
            ) : null}
          </Text>
        </View>
      ) : null}

      {showAssignee ? (
        <View style={styles.assigneeRow}>
          <Ionicons
            name={isUnassigned ? 'person-add-outline' : 'person-outline'}
            size={16}
            color={isUnassigned ? COLORS.warning : COLORS.inkMuted}
          />
          <Text
            style={[TYPE.label, styles.assignee, isUnassigned && { color: COLORS.warning }]}
            numberOfLines={1}
          >
            {isUnassigned ? 'Unassigned' : assignedTo}
          </Text>
          {isUnassigned && onClaimTicket ? (
            <AppButton title="Claim" size="sm" variant="tonal" onPress={() => onClaimTicket(ticket)} />
          ) : null}
          {onAssignTicket ? (
            <AppButton
              title={isUnassigned ? 'Assign' : 'Reassign'}
              size="sm"
              variant="ghost"
              onPress={() => onAssignTicket(ticket)}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.footer}>
        <StatusBadge status={ticket.status} size="sm" />
        <PriorityBadge priority={ticket.priority} size="sm" />
        <Text style={[TYPE.bodySmall, styles.date]}>{ticket.createdDate || ticket.updatedAt || 'Today'}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
  },
  pressed: { backgroundColor: COLORS.paperPressed },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.violet,
    marginBottom: SPACING.md,
  },
  id: { color: COLORS.ink },
  channelIcon: { marginLeft: SPACING.md, marginRight: SPACING.xs },
  channel: { color: COLORS.inkMuted, flex: 1 },
  subject: { color: COLORS.ink },
  description: { color: COLORS.inkMuted, marginTop: SPACING.xs },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, gap: SPACING.sm },
  customerName: { color: COLORS.ink, flex: 1 },
  company: { fontFamily: TYPE.bodySmall.fontFamily, color: COLORS.inkMuted },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
  },
  assignee: { color: COLORS.ink, flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.md },
  date: { color: COLORS.inkFaint, marginLeft: 'auto' },
});
