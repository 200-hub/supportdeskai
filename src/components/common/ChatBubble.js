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
  isOutgoing, // Optional override: true aligns right, false aligns left
}) => {
  const isInternalNote = senderType === 'internal_note';
  const isAssistant = senderType === 'assistant';
  // By default, customer is the app user (outgoing = right), assistant and agent are incoming = left
  const outgoing = isOutgoing !== undefined ? isOutgoing : senderType === 'customer';

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

  return (
    <View
      style={[
        styles.bubbleContainer,
        outgoing ? styles.outgoingAlign : styles.incomingAlign,
      ]}
    >
      <View
        style={[
          styles.headerRow,
          outgoing ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
        ]}
      >
        {!outgoing && isAssistant && (
          <View style={styles.aiPill}>
            <Ionicons name="sparkles" size={10} color="#0F766E" style={{ marginRight: 3 }} />
            <Text style={styles.aiPillText}>AI Copilot</Text>
          </View>
        )}
        {!outgoing && senderName && !isAssistant && (
          <Text style={styles.senderLabel}>{senderName}</Text>
        )}
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>

      <View
        style={[
          styles.bubble,
          outgoing ? styles.outgoingBubble : styles.incomingBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            outgoing ? styles.outgoingText : styles.incomingText,
          ]}
        >
          {message}
        </Text>
      </View>

      {isDemo && !outgoing && (
        <Text style={styles.demoNotice}>• Grounded simulation</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    marginBottom: SPACING.md,
    maxWidth: '84%',
  },
  outgoingAlign: {
    alignSelf: 'flex-end',
  },
  incomingAlign: {
    alignSelf: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginRight: SPACING.xs + 2,
  },
  aiPillText: {
    fontSize: 10,
    color: '#0F766E',
    fontWeight: TYPOGRAPHY.bold,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
  },
  bubble: {
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  outgoingBubble: {
    backgroundColor: COLORS.primaryNavy,
    borderTopRightRadius: RADIUS.xs,
  },
  incomingBubble: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopLeftRadius: RADIUS.xs,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: TYPOGRAPHY.sm,
    lineHeight: 20,
  },
  outgoingText: {
    color: COLORS.white,
  },
  incomingText: {
    color: COLORS.mainText,
  },
  demoNotice: {
    fontSize: TYPOGRAPHY.xs - 2,
    color: COLORS.secondaryText,
    marginTop: 3,
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
