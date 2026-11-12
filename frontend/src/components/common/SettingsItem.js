import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

export const SettingsItem = ({
  icon,
  iconColor = COLORS.violetInk,
  title,
  subtitle,
  value,
  rightType = 'arrow', // 'arrow' | 'switch' | 'badge' | 'none'
  switchValue = false,
  onSwitchChange,
  badgeText,
  badgeColor = COLORS.success,
  onPress,
  isDestructive = false,
  showBorder = true,
}) => {
  const isSwitch = rightType === 'switch';
  const tint = isDestructive ? COLORS.error : COLORS.ink;

  return (
    <Pressable
      disabled={!onPress && !isSwitch}
      onPress={isSwitch ? () => onSwitchChange?.(!switchValue) : onPress}
      accessibilityRole={isSwitch ? 'switch' : onPress ? 'button' : undefined}
      accessibilityState={isSwitch ? { checked: switchValue } : undefined}
      style={({ pressed }) => [styles.row, showBorder && styles.border, pressed && styles.pressed]}
    >
      {icon ? (
        <Ionicons name={icon} size={22} color={isDestructive ? COLORS.error : iconColor} style={styles.icon} />
      ) : null}

      <View style={styles.text}>
        <Text style={[TYPE.bodyStrong, { color: tint }]}>{title}</Text>
        {subtitle ? <Text style={[TYPE.bodySmall, styles.subtitle]}>{subtitle}</Text> : null}
      </View>

      {value ? <Text style={[TYPE.bodySmall, styles.value]}>{value}</Text> : null}

      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: COLORS.ruleStrong, true: COLORS.violetInk }}
          thumbColor={COLORS.paper}
          activeThumbColor={COLORS.paper} // react-native-web default is teal
          ios_backgroundColor={COLORS.ruleStrong}
        />
      ) : null}

      {rightType === 'badge' && badgeText ? (
        <View style={[styles.badge, { borderColor: badgeColor }]}>
          <Text style={[TYPE.labelSmall, { color: badgeColor }]}>{badgeText}</Text>
        </View>
      ) : null}

      {rightType === 'arrow' ? <Ionicons name="chevron-forward" size={20} color={COLORS.inkFaint} /> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.paper,
    gap: SPACING.md,
  },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.rule },
  pressed: { backgroundColor: COLORS.groundDeep },
  icon: { width: 24 },
  text: { flex: 1 },
  subtitle: { color: COLORS.inkMuted, marginTop: 2 },
  value: { color: COLORS.inkMuted },
  badge: { borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: 7, paddingVertical: 2 },
});
