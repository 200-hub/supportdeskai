import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

export const ChatBubble = ({
  senderType = 'customer', // 'customer', 'assistant', 'agent', 'internal_note'
  message,
  timestamp,
  senderName,
  isDemo = false,
  isOutgoing,
}) => {
  const isCustomer = senderType === 'customer';
  const isInternalNote = senderType === 'internal_note';
  const isAssistant = senderType === 'assistant';

  if (isInternalNote) {
    return (
      <View style={styles.noteWrapper}>
        <View style={styles.noteHeader}>
          <View style={styles.noteBadge}>
            <Ionicons name="lock-closed" size={12} color="#92400E" style={{ marginRight: 4 }} />
            <Text style={styles.noteBadgeText}>Internal Team Note</Text>
          </View>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <View style={styles.noteBody}>
          {senderName && <Text style={styles.noteSender}>{senderName}:</Text>}
          <Text style={styles.noteText}>{message}</Text>
        </View>
      </View>
    );
  }

  // Determine if this bubble should be aligned as outgoing (right) or incoming (left)
  const isOutgoingBubble =
    isOutgoing !== undefined ? isOutgoing : !isAssistant && isCustomer;

  const getBubbleStyle = () => {
    if (isOutgoingBubble) {
      return styles.outgoingBubble;
    }
    if (isAssistant) {
      return styles.assistantBubble;
    }
    if (isCustomer) {
      return styles.customerBubble;
    }
    return styles.incomingAgentBubble;
  };

  return (
    <View
      style={[
        styles.bubbleContainer,
        isOutgoingBubble ? styles.outgoingAlign : styles.incomingAlign,
      ]}
    >
      <View
        style={[
          styles.headerRow,
          isOutgoingBubble ? styles.headerRowOutgoing : styles.headerRowIncoming,
        ]}
      >
        {!isOutgoingBubble && isAssistant && (
          <View style={styles.aiPill}>
            <Ionicons name="sparkles" size={10} color={COLORS.accentTeal} style={{ marginRight: 2 }} />
            <Text style={styles.aiPillText}>AI Assistant</Text>
          </View>
        )}
        {senderName ? <Text style={styles.senderLabel}>{senderName}</Text> : null}
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>

      <View style={[styles.bubble, getBubbleStyle()]}>
        <Text style={[styles.messageText, isOutgoingBubble ? styles.lightText : styles.darkText]}>
          {message}
        </Text>
      </View>

      {isDemo && !isOutgoingBubble && (
        <Text style={styles.demoNotice}>• Demo simulated response</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    marginBottom: SPACING.md,
    maxWidth: '85%',
  },
  incomingAlign: {
    alignSelf: 'flex-start',
  },
  outgoingAlign: {
    alignSelf: 'flex-end',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerRowIncoming: {
    justifyContent: 'flex-start',
  },
  headerRowOutgoing: {
    justifyContent: 'flex-end',
  },
  senderLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
    marginRight: SPACING.xs + 2,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    marginRight: SPACING.xs,
  },
  aiPillText: {
    fontSize: 9,
    color: '#0F766E',
    fontWeight: TYPOGRAPHY.bold,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
  },
  bubble: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  outgoingBubble: {
    backgroundColor: COLORS.primaryNavy,
    borderTopRightRadius: RADIUS.xs,
  },
  customerBubble: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopLeftRadius: RADIUS.xs,
  },
  assistantBubble: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderTopLeftRadius: RADIUS.xs,
  },
  incomingAgentBubble: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderTopLeftRadius: RADIUS.xs,
  },
  messageText: {
    fontSize: TYPOGRAPHY.sm,
    lineHeight: TYPOGRAPHY.lineHeightNormal,
  },
  darkText: {
    color: COLORS.mainText,
  },
  lightText: {
    color: COLORS.white,
  },
  demoNotice: {
    fontSize: TYPOGRAPHY.xs - 2,
    color: COLORS.secondaryText,
    marginTop: 2,
    alignSelf: 'flex-start',
    fontStyle: 'italic',
  },
  noteWrapper: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: '#92400E',
  },
  noteBody: {
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: SPACING.md,
  },
  noteSender: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: '#92400E',
    marginBottom: 2,
  },
  noteText: {
    fontSize: TYPOGRAPHY.sm,
    color: '#92400E',
    lineHeight: TYPOGRAPHY.lineHeightNormal,
  },
});
