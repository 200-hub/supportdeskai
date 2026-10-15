import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

export const NotificationItem = ({
  title,
  description,
  time,
  type = 'ticket', // 'ticket', 'reply', 'alert', 'status'
  isRead = false,
  onPress,
}) => {
  const getIconConfig = () => {
    switch (type) {
      case 'reply':
        return { icon: 'chatbubble-ellipses-outline', color: COLORS.accentTeal, bg: '#CCFBF1' };
      case 'alert':
        return { icon: 'warning-outline', color: COLORS.warning, bg: '#FEF3C7' };
      case 'status':
        return { icon: 'checkmark-circle-outline', color: COLORS.success, bg: '#DCFCE7' };
      default:
        return { icon: 'ticket-outline', color: COLORS.primaryNavy, bg: '#EFF6FF' };
    }
  };

  const { icon, color, bg } = getIconConfig();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        !isRead && styles.unreadCard,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.topRow}>
          <Text style={[styles.title, !isRead && styles.unreadTitle]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>

      {!isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
    fontWeight: TYPOGRAPHY.semiBold,
    flex: 1,
    marginRight: SPACING.sm,
  },
  unreadTitle: {
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
  },
  time: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
  },
  description: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentTeal,
    marginLeft: SPACING.sm,
  },
});
