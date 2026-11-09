import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

export const ChatBubble = ({
  senderType = 'customer', // 'customer' | 'assistant' | 'agent' | 'internal_note'
  message,
  timestamp,
  senderName,
  isDemo = false,
  isOutgoing,
}) => {
  const isAssistant = senderType === 'assistant';

  if (senderType === 'internal_note') {
    return (
      <View style={styles.note} accessibilityLabel={`Internal note${senderName ? ` from ${senderName}` : ''}`}>
        <View style={styles.noteHead}>
          <Ionicons name="lock-closed" size={13} color={COLORS.internalNote.text} />
          <Text style={[TYPE.labelSmall, styles.noteLabel]}>Internal note{senderName ? `, ${senderName}` : ''}</Text>
          <Text style={[TYPE.labelSmall, styles.noteTime]}>{timestamp}</Text>
        </View>
        <Text style={[TYPE.body, { color: COLORS.internalNote.text }]}>{message}</Text>
      </View>
    );
  }

  const outgoing = isOutgoing !== undefined ? isOutgoing : senderType === 'customer';
  const bubble = outgoing ? styles.outgoing : isAssistant ? styles.assistant : styles.incoming;

  return (
    <View style={[styles.wrap, outgoing ? styles.right : styles.left]}>
      <View style={[styles.meta, outgoing && styles.metaRight]}>
        {isAssistant && !outgoing ? (
          <Ionicons name="sparkles" size={12} color={COLORS.violet} style={{ marginRight: 4 }} />
        ) : null}
        {senderName || isAssistant ? (
          <Text style={[TYPE.labelSmall, styles.sender]}>{senderName || 'Assistant'}</Text>
        ) : null}
        <Text style={[TYPE.labelSmall, styles.time]}>{timestamp}</Text>
      </View>

      <View style={[styles.bubble, bubble]}>
        <Text style={[TYPE.body, { color: outgoing ? COLORS.onDark : COLORS.ink }]}>{message}</Text>
      </View>

      {isDemo && !outgoing ? <Text style={[TYPE.labelSmall, styles.demo]}>Demo reply</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.lg, maxWidth: '86%' },
  left: { alignSelf: 'flex-start' },
  right: { alignSelf: 'flex-end' },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  metaRight: { justifyContent: 'flex-end' },
  sender: { color: COLORS.ink, marginRight: SPACING.sm },
  time: { color: COLORS.inkFaint },
  bubble: { borderRadius: RADIUS.xl, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  outgoing: { backgroundColor: COLORS.violetInk, borderBottomRightRadius: RADIUS.xs },
  incoming: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.rule,
    borderBottomLeftRadius: RADIUS.xs,
  },
  assistant: { backgroundColor: COLORS.violetWash, borderBottomLeftRadius: RADIUS.xs },
  demo: { color: COLORS.inkFaint, marginTop: SPACING.xs },
  note: {
    backgroundColor: COLORS.internalNote.bg,
    borderWidth: 1,
    borderColor: COLORS.internalNote.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  noteHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs },
  noteLabel: { color: COLORS.internalNote.text, flex: 1 },
  noteTime: { color: COLORS.internalNote.text },
});
