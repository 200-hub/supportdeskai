import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS } from '../../theme/spacing';

export const PriorityBadge = ({ priority = 'medium', size = 'md' }) => {
  const normPriority = (priority || 'medium').toLowerCase();
  const config = COLORS.priority[normPriority] || COLORS.priority.medium;
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? 6 : 8,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSm ? TYPOGRAPHY.xs - 1 : TYPOGRAPHY.xs,
          },
        ]}
      >
        {normPriority.charAt(0).toUpperCase() + normPriority.slice(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.xs + 2,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  text: {
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.2,
  },
});
