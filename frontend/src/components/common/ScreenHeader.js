import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { SPACING, TOUCH } from '../../theme/spacing';

// Material top app bar on the beige ground. `theme` kept for callers; both render the same bar.
export const ScreenHeader = ({ title, subtitle, showBack = false, onBack, rightAction }) => (
  <View style={styles.header}>
    {showBack ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
      </Pressable>
    ) : null}

    <View style={styles.titles}>
      <Text accessibilityRole="header" style={[TYPE.title, styles.title]} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[TYPE.bodySmall, styles.subtitle]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>

    {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.rule,
  },
  iconBtn: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: COLORS.groundDeep },
  titles: { flex: 1, paddingHorizontal: SPACING.sm },
  title: { color: COLORS.ink },
  subtitle: { color: COLORS.inkMuted, marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center' },
});
