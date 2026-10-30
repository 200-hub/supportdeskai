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
<<<<<<< HEAD
  isOutgoing,
=======
  isOutgoing, // Optional override: true aligns right, false aligns left
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
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
<<<<<<< HEAD
        isOutgoingBubble ? styles.outgoingAlign : styles.incomingAlign,
=======
        outgoing ? styles.outgoingAlign : styles.incomingAlign,
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
      ]}
    >
      <View
        style={[
          styles.headerRow,
<<<<<<< HEAD
          isOutgoingBubble ? styles.headerRowOutgoing : styles.headerRowIncoming,
        ]}
      >
        {!isOutgoingBubble && isAssistant && (
=======
          outgoing ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
        ]}
      >
        {!outgoing && isAssistant && (
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
          <View style={styles.aiPill}>
            <Ionicons name="sparkles" size={10} color="#0F766E" style={{ marginRight: 3 }} />
            <Text style={styles.aiPillText}>AI Copilot</Text>
          </View>
        )}
<<<<<<< HEAD
        {senderName ? <Text style={styles.senderLabel}>{senderName}</Text> : null}
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>

      <View style={[styles.bubble, getBubbleStyle()]}>
        <Text style={[styles.messageText, isOutgoingBubble ? styles.lightText : styles.darkText]}>
=======
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
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
          {message}
        </Text>
      </View>

<<<<<<< HEAD
      {isDemo && !isOutgoingBubble && (
        <Text style={styles.demoNotice}>• Demo simulated response</Text>
=======
      {isDemo && !outgoing && (
        <Text style={styles.demoNotice}>• Grounded simulation</Text>
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    marginBottom: SPACING.md,
    maxWidth: '84%',
  },
<<<<<<< HEAD
  incomingAlign: {
    alignSelf: 'flex-start',
  },
=======
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
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
<<<<<<< HEAD
  customerBubble: {
=======
  incomingBubble: {
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopLeftRadius: RADIUS.xs,
<<<<<<< HEAD
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
=======
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
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
<<<<<<< HEAD
    marginTop: 2,
    alignSelf: 'flex-start',
=======
    marginTop: 3,
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
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
