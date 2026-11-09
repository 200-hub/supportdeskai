import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';

export const Avatar = ({ initials = 'SD', size = 40, bgColor = COLORS.violetWash, textColor = COLORS.violetInk }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bgColor,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ fontFamily: FONTS.bold, fontSize: Math.round(size * 0.38), color: textColor }}>{initials}</Text>
  </View>
);
