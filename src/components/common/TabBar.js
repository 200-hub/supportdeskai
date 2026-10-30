import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

export const TabBar = ({ currentTab, onSelectTab, unreadCount = 3 }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { key: 'inbox', label: 'Inbox', icon: 'chatbubbles', badge: unreadCount },
    { key: 'copilot', label: 'Copilot', icon: 'sparkles' },
    { key: 'analytics', label: 'Analytics', icon: 'stats-chart' },
    { key: 'knowledge', label: 'Knowledge', icon: 'book' },
    { key: 'settings', label: 'Settings', icon: 'person' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPadding }]}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onSelectTab(tab.key)}
            style={styles.tabItem}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            {/* Active Indicator Top Accent */}
            <View
              style={[
                styles.activeIndicator,
                { backgroundColor: isActive ? COLORS.accentTeal : 'transparent' },
              ]}
            />

            <View
              style={[
                styles.iconWrapper,
                isActive && styles.activeIconWrapper,
              ]}
            >
              <Ionicons
                name={isActive ? tab.icon : `${tab.icon}-outline`}
                size={21}
                color={isActive ? COLORS.accentTeal : COLORS.secondaryText}
              />
              {tab.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>

            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? COLORS.primaryNavy : COLORS.secondaryText,
                  fontWeight: isActive ? TYPOGRAPHY.bold : TYPOGRAPHY.semiBold,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
    paddingTop: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  iconWrapper: {
    position: 'relative',
    height: 28,
    width: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  activeIconWrapper: {
    backgroundColor: '#CCFBF1',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 0,
    backgroundColor: COLORS.accentTeal,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.bold,
  },
});
