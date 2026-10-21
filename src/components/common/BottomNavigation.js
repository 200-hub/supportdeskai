import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export const BottomNavigation = ({
  currentTab,
  onSelectTab,
  ticketBadge = 0,
  chatBadge = 0,
}) => {
  const tabs = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'tickets', label: 'My Tickets', icon: 'ticket', badge: ticketBadge },
    { key: 'chat', label: 'AI Chat', icon: 'chatbubbles', badge: chatBadge },
    { key: 'help', label: 'Help Center', icon: 'help-circle' },
    { key: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onSelectTab(tab.key)}
            style={styles.tabItem}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={isActive ? tab.icon : `${tab.icon}-outline`}
                size={22}
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
                  fontWeight: isActive ? TYPOGRAPHY.bold : TYPOGRAPHY.medium,
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
  navBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.xs + 2,
    paddingBottom: SPACING.sm + 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.xs - 1,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -10,
    backgroundColor: COLORS.accentTeal,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.bold,
  },
});
