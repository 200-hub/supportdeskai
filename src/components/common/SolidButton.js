import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

export const SolidButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'teal', 'outline', 'ghost', 'danger'
  size = 'md', // 'sm', 'md', 'lg'
  icon = null,
  disabled = false,
  style,
  textStyle,
}) => {
  let bgColor = COLORS.primaryNavy;
  let textColor = COLORS.white;
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (variant === 'secondary') {
    bgColor = COLORS.secondaryNavy;
    textColor = COLORS.white;
  } else if (variant === 'teal') {
    bgColor = COLORS.accentTeal;
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
    bgColor = '#DC2626';
    textColor = COLORS.white;
  }

  const paddingV = size === 'sm' ? SPACING.xs + 2 : size === 'lg' ? SPACING.md + 2 : SPACING.sm + 3;
  const paddingH = size === 'sm' ? SPACING.sm + 2 : size === 'lg' ? SPACING.xl : SPACING.md + 4;
  const fontSize = size === 'sm' ? TYPOGRAPHY.sm : size === 'lg' ? TYPOGRAPHY.md : TYPOGRAPHY.base;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? COLORS.border : bgColor,
          borderColor: disabled ? COLORS.border : borderColor,
          borderWidth,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.text,
            {
              color: disabled ? COLORS.secondaryText : textColor,
              fontSize,
              fontWeight: TYPOGRAPHY.semiBold,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
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
  iconContainer: {
    marginRight: SPACING.xs + 2,
  },
  text: {
    textAlign: 'center',
  },
});
