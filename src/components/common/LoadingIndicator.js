import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export const LoadingIndicator = ({
  message = 'Loading...',
  color = COLORS.accentTeal,
  size = 'large',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.secondaryText,
    marginTop: SPACING.sm,
    fontWeight: TYPOGRAPHY.medium,
  },
});
