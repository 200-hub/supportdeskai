import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

export const Badge = ({
  label,
  variant = 'default', // 'status', 'priority', 'channel', 'ai', 'custom'
  type, // e.g. 'open', 'urgent', 'email'
  bgColor,
  textColor,
  borderColor,
  size = 'md', // 'sm', 'md'
}) => {
  let bg = bgColor || COLORS.lightBg;
  let text = textColor || COLORS.mainText;
  let border = borderColor;

  if (variant === 'status' && type && COLORS.status[type]) {
    bg = COLORS.status[type].bg;
    text = COLORS.status[type].text;
    border = COLORS.status[type].border;
  } else if (variant === 'priority' && type && COLORS.priority[type]) {
    bg = COLORS.priority[type].bg;
    text = COLORS.priority[type].text;
  } else if (variant === 'channel' && type && COLORS.channel[type]) {
    bg = COLORS.channel[type].bg;
    text = COLORS.channel[type].text;
  } else if (variant === 'ai') {
    bg = COLORS.ai.bg;
    text = COLORS.ai.text;
    border = COLORS.ai.border;
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 6 : 8,
          borderColor: border || 'transparent',
          borderWidth: border ? 1 : 0,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: text,
            fontSize: isSmall ? TYPOGRAPHY.xs : TYPOGRAPHY.sm,
            fontWeight: TYPOGRAPHY.medium,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
});
