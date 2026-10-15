import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { RADIUS } from '../../theme/spacing';

export const StatusBadge = ({ status = 'open', size = 'md' }) => {
  const normStatus = (status || 'open').toLowerCase();
  const config = COLORS.status[normStatus] || COLORS.status.open;
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border || 'transparent',
          borderWidth: config.border ? 1 : 0,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? 6 : 9,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSm ? TYPOGRAPHY.xs - 1 : TYPOGRAPHY.xs,
          },
        ]}
      >
        {normStatus.charAt(0).toUpperCase() + normStatus.slice(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.xs + 2,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.3,
  },
});
