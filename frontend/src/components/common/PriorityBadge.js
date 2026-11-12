import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { RADIUS } from '../../theme/spacing';

// Priority reads as ink + a filled pip, not a second coloured pill next to status.
export const PriorityBadge = ({ priority = 'medium', size = 'md' }) => {
  const p = (priority || 'medium').toLowerCase();
  const c = COLORS.priority[p] || COLORS.priority.medium;
  const sm = size === 'sm';
  return (
    <View style={[styles.row, sm && styles.sm]}>
      <View style={[styles.pip, { backgroundColor: c.dot }]} />
      <Text style={[sm ? TYPE.labelSmall : TYPE.label, { color: c.text }]}>
        {p.charAt(0).toUpperCase() + p.slice(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: RADIUS.sm,
  },
  sm: { paddingVertical: 2 },
  pip: { width: 8, height: 8, borderRadius: 2, marginRight: 6, transform: [{ rotate: '45deg' }] },
});
