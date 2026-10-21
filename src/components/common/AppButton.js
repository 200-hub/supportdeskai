import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

export const AppButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'teal', 'secondary', 'outline', 'ghost', 'danger'
  size = 'md', // 'sm', 'md', 'lg'
  icon = null,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  let bgColor = COLORS.primaryNavy;
  let textColor = COLORS.white;
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (variant === 'teal') {
    bgColor = COLORS.accentTeal;
    textColor = COLORS.white;
  } else if (variant === 'secondary') {
    bgColor = COLORS.secondaryNavy;
    textColor = COLORS.white;
  } else if (variant === 'outline') {
    bgColor = COLORS.white;
    textColor = COLORS.mainText;
    borderColor = COLORS.border;
    borderWidth = 1;
  } else if (variant === 'ghost') {
    bgColor = 'transparent';
    textColor = COLORS.secondaryText;
  } else if (variant === 'danger') {
    bgColor = COLORS.error;
    textColor = COLORS.white;
  }

  const paddingV = size === 'sm' ? 8 : size === 'lg' ? 14 : 11;
  const paddingH = size === 'sm' ? 12 : size === 'lg' ? 24 : 16;
  const fontSize = size === 'sm' ? TYPOGRAPHY.sm : size === 'lg' ? TYPOGRAPHY.md : TYPOGRAPHY.base;

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: isDisabled && variant !== 'ghost' ? '#CBD5E1' : bgColor,
          borderColor: isDisabled ? '#CBD5E1' : borderColor,
          borderWidth,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? COLORS.primaryNavy : COLORS.white} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.leftIcon}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: isDisabled ? '#64748B' : textColor,
                fontSize,
                fontWeight: TYPOGRAPHY.semiBold,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.rightIcon}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  rightIcon: {
    marginLeft: SPACING.sm,
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
