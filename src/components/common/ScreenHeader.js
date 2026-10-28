import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export const ScreenHeader = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  theme = 'navy', // 'navy' | 'light'
}) => {
  const isNavy = theme === 'navy';
  const bgColor = isNavy ? COLORS.primaryNavy : COLORS.white;
  const textColor = isNavy ? COLORS.white : COLORS.mainText;
  const subtextColor = isNavy ? '#94A3B8' : COLORS.secondaryText;
  const borderColor = isNavy ? COLORS.secondaryNavy : COLORS.border;
  const iconColor = isNavy ? COLORS.white : COLORS.mainText;

  return (
    <View style={[styles.header, { backgroundColor: bgColor, borderBottomColor: borderColor }]}>
      <View style={styles.leftGroup}>
        {showBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color={iconColor} />
          </TouchableOpacity>
        )}

        <View style={styles.titleColumn}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: subtextColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightAction ? <View style={styles.rightGroup}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    minHeight: 60,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm + 2,
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
