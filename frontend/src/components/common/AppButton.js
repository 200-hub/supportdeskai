import React from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

// primary: lemon — the one thing to do next on this screen (use once per screen)
// tonal:   violet wash — common secondary actions
// outline: neutral alternative
// ghost:   text-only, low emphasis
// danger:  destructive
const VARIANTS = {
  primary: { bg: COLORS.lemon, fg: COLORS.ink, pressed: COLORS.lemonPressed },
  tonal: { bg: COLORS.violetWash, fg: COLORS.violetInk, pressed: COLORS.violetWashPressed },
  outline: { bg: 'transparent', fg: COLORS.ink, border: COLORS.ruleStrong, pressed: COLORS.groundDeep },
  ghost: { bg: 'transparent', fg: COLORS.violetInk, pressed: COLORS.violetWash },
  danger: { bg: COLORS.error, fg: COLORS.onDark, pressed: COLORS.errorPressed },
};

export const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;
  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={size === 'sm' ? 4 : 0}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: height,
          paddingHorizontal: size === 'sm' ? SPACING.md : SPACING.xl,
          backgroundColor: isDisabled && variant !== 'ghost' ? COLORS.groundDeep : pressed ? v.pressed : v.bg,
          borderColor: v.border || 'transparent',
          borderWidth: v.border ? 1 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon && iconPosition === 'left' && <View style={styles.leftIcon}>{icon}</View>}
          <Text
            style={[
              size === 'lg' ? TYPE.titleSmall : TYPE.label,
              size === 'md' && styles.mdText,
              { color: isDisabled ? COLORS.inkFaint : v.fg },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.rightIcon}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  mdText: { fontSize: 15, lineHeight: 20 },
  leftIcon: { marginRight: SPACING.sm },
  rightIcon: { marginLeft: SPACING.sm },
});
