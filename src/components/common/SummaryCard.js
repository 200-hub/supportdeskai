import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

export const SummaryCard = ({
  title,
  value,
  icon,
  iconColor = COLORS.primaryNavy,
  iconBg = COLORS.lightBg,
  subtitle,
  onPress,
  style,
}) => {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, style]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color={COLORS.secondaryText} />
        )}
      </View>

      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </CardContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs + 2,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    marginBottom: 2,
  },
  title: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    fontWeight: TYPOGRAPHY.medium,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.accentTeal,
    marginTop: 4,
    fontWeight: TYPOGRAPHY.semiBold,
  },
});
