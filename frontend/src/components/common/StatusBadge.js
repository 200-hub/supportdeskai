import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { RADIUS } from '../../theme/spacing';

export const StatusBadge = ({ status = 'open', size = 'md' }) => {
  const s = (status || 'open').toLowerCase();
  const c = COLORS.status[s] || COLORS.status.open;
  const sm = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, sm && styles.sm]}>
      <Text style={[sm ? TYPE.labelSmall : TYPE.label, { color: c.text }]}>
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  sm: { paddingVertical: 2, paddingHorizontal: 7 },
});
