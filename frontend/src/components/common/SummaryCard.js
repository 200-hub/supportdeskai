import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

// A count on an index card: label first (what it is), figure second, note last.
export const SummaryCard = ({ title, value, icon, iconColor = COLORS.violet, subtitle, onPress, style }) => (
  <Pressable
    disabled={!onPress}
    onPress={onPress}
    accessibilityRole={onPress ? 'button' : undefined}
    style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
  >
    <View style={styles.top}>
      {icon ? <Ionicons name={icon} size={18} color={iconColor} /> : null}
      <Text style={[TYPE.label, styles.title]} numberOfLines={1}>
        {title}
      </Text>
    </View>
    <Text style={[TYPE.headline, styles.value]}>{value}</Text>
    {subtitle ? <Text style={[TYPE.bodySmall, styles.subtitle]}>{subtitle}</Text> : null}
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    padding: SPACING.lg,
  },
  pressed: { backgroundColor: COLORS.groundDeep },
  top: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  title: { color: COLORS.inkMuted, flex: 1 },
  value: { color: COLORS.ink },
  subtitle: { color: COLORS.inkMuted, marginTop: SPACING.xs },
});
