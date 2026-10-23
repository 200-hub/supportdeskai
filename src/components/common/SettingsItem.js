import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

export const SettingsItem = ({
  icon,
  iconColor = COLORS.primaryNavy,
  iconBg = COLORS.lightBg,
  title,
  subtitle,
  value,
  rightType = 'arrow', // 'arrow', 'switch', 'badge', 'none'
  switchValue = false,
  onSwitchChange,
  badgeText,
  badgeColor = COLORS.success,
  onPress,
  isDestructive = false,
  showBorder = true,
}) => {
  const Container = onPress && rightType !== 'switch' ? TouchableOpacity : View;

  return (
    <Container
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.row,
        showBorder && styles.rowBorder,
      ]}
    >
      <View style={styles.leftGroup}>
        {icon && (
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: isDestructive ? '#FEE2E2' : iconBg },
            ]}
          >
            <Ionicons
              name={icon}
              size={18}
              color={isDestructive ? COLORS.error : iconColor}
            />
          </View>
        )}

        <View style={styles.textColumn}>
          <Text
            style={[
              styles.title,
              isDestructive && { color: COLORS.error, fontWeight: TYPOGRAPHY.bold },
            ]}
          >
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.rightGroup}>
        {value ? <Text style={styles.valueText}>{value}</Text> : null}

        {rightType === 'switch' && (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: COLORS.border, true: COLORS.accentTeal }}
            thumbColor={COLORS.white}
          />
        )}

        {rightType === 'badge' && badgeText && (
          <View style={[styles.badge, { backgroundColor: `${badgeColor}15` }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
          </View>
        )}

        {rightType === 'arrow' && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.secondaryText}
            style={{ marginLeft: 6 }}
          />
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sm + 1,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.mainText,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 2,
    lineHeight: 16,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  valueText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
  },
});
