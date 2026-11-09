import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

// Material 3 navigation bar: violet-wash pill behind the active icon,
// lemon count badge for things waiting on you.
export const NavBar = ({ tabs, currentTab, onSelectTab }) => (
  <View style={styles.bar} accessibilityRole="tablist">
    {tabs.map((tab) => {
      const active = currentTab === tab.key;
      return (
        <Pressable
          key={tab.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
          accessibilityLabel={tab.badge > 0 ? `${tab.label}, ${tab.badge} new` : tab.label}
          onPress={() => onSelectTab(tab.key)}
          style={styles.item}
        >
          <View style={[styles.pill, active && styles.pillActive]}>
            <Ionicons
              name={active ? tab.icon : `${tab.icon}-outline`}
              size={22}
              color={active ? COLORS.violetInk : COLORS.inkMuted}
            />
            {tab.badge > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text
            numberOfLines={1}
            style={[TYPE.labelSmall, styles.label, { color: active ? COLORS.ink : COLORS.inkMuted }]}
          >
            {tab.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.paper,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  item: { flex: 1, alignItems: 'center', minHeight: 56 },
  pill: {
    width: 56,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: COLORS.violetWash },
  label: { marginTop: SPACING.xs },
  badge: {
    position: 'absolute',
    top: -2,
    right: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: COLORS.lemon,
    borderWidth: 1.5,
    borderColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { ...TYPE.numeric, fontSize: 10, lineHeight: 12, color: COLORS.ink },
});
