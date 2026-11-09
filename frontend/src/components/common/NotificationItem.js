import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const ICONS = {
  reply: { icon: 'chatbubble-ellipses-outline', color: COLORS.violetInk },
  alert: { icon: 'alarm-outline', color: COLORS.error },
  status: { icon: 'checkmark-circle-outline', color: COLORS.success },
  ticket: { icon: 'ticket-outline', color: COLORS.ink },
};

// A row in a list, not a card. Unread rows carry a lemon pip.
export const NotificationItem = ({ title, description, time, type = 'ticket', isRead = false, onPress }) => {
  const { icon, color } = ICONS[type] || ICONS.ticket;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${isRead ? '' : 'Unread. '}${title}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={color} style={styles.icon} />
      <View style={styles.text}>
        <View style={styles.top}>
          <Text style={[isRead ? TYPE.body : TYPE.bodyStrong, styles.title]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[TYPE.labelSmall, styles.time]}>{time}</Text>
        </View>
        <Text style={[TYPE.bodySmall, styles.desc]} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <View style={[styles.pip, isRead && styles.pipRead]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.rule,
    minHeight: 64,
  },
  pressed: { backgroundColor: COLORS.groundDeep },
  icon: { marginRight: SPACING.md, marginTop: 1 },
  text: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
  title: { color: COLORS.ink, flex: 1, marginRight: SPACING.sm },
  time: { color: COLORS.inkFaint },
  desc: { color: COLORS.inkMuted },
  pip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.lemon,
    borderWidth: 1,
    borderColor: COLORS.ink,
    marginLeft: SPACING.md,
    marginTop: 6,
  },
  pipRead: { opacity: 0 },
});
