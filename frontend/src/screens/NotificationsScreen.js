import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { NotificationItem } from '../components/common/NotificationItem';
import { EmptyState } from '../components/common/EmptyState';
import { AppButton } from '../components/common/AppButton';

const EMPTY_COPY = {
  all: { title: 'No notifications yet', message: 'Replies and ticket updates will show up here.' },
  unread: { title: 'You’re all caught up', message: 'Nothing new since you last looked.' },
  alerts: { title: 'No SLA alerts', message: 'You’ll see a notice here if a ticket is close to its deadline.' },
};

export const NotificationsScreen = ({
  notifications = [],
  onSelectNotification,
  onMarkAllAsRead,
  onNavigateBack,
}) => {
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'alerts'

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'alerts') return n.type === 'alert';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const tabs = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount, attention: unreadCount > 0 },
    { key: 'alerts', label: 'SLA alerts' },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
        showBack={!!onNavigateBack}
        onBack={onNavigateBack}
        rightAction={
          unreadCount > 0 && onMarkAllAsRead ? (
            <AppButton title="Mark all read" variant="ghost" size="sm" onPress={onMarkAllAsRead} />
          ) : null
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {tabs.map((tab) => {
          const isSelected = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={tab.count !== undefined ? `${tab.label}, ${tab.count}` : tab.label}
              hitSlop={4}
              onPress={() => setFilter(tab.key)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.chipPressed,
              ]}
            >
              <Text style={[TYPE.label, { color: isSelected ? COLORS.violetInk : COLORS.ink }]}>
                {tab.label}
              </Text>
              {tab.count !== undefined ? (
                <View style={tab.attention ? styles.countLemon : null}>
                  <Text
                    style={[
                      TYPE.numeric,
                      { color: tab.attention ? COLORS.ink : isSelected ? COLORS.violetInk : COLORS.inkMuted },
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.listContent}>
        {filtered.length === 0 ? (
          <EmptyState icon="notifications-off-outline" {...(EMPTY_COPY[filter] || EMPTY_COPY.all)} />
        ) : (
          <View style={styles.sheet}>
            {/* -1 tucks the last row's hairline under the sheet's own border */}
            <View style={styles.sheetInner}>
              {filtered.map((item) => (
                <NotificationItem
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  time={item.time}
                  type={item.type}
                  isRead={item.isRead}
                  onPress={() => onSelectNotification && onSelectNotification(item)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },

  chipsScroll: { flexGrow: 0 },
  chipsRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 40,
    paddingHorizontal: SPACING.md + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.paper,
  },
  chipSelected: { backgroundColor: COLORS.violetWash, borderColor: COLORS.violetWash },
  chipPressed: { backgroundColor: COLORS.groundDeep },
  countLemon: {
    backgroundColor: COLORS.lemon,
    borderRadius: RADIUS.full,
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },

  listContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, paddingBottom: SPACING.xxl },
  sheet: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    overflow: 'hidden',
  },
  sheetInner: { marginBottom: -1 },
});
