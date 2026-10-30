import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
<<<<<<< HEAD
=======
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { NotificationItem } from '../components/common/NotificationItem';
import { EmptyState } from '../components/common/EmptyState';

export const NotificationsScreen = ({
  notifications = [],
  onSelectNotification,
  onMarkAllAsRead,
  onNavigateBack,
}) => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'alerts'

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'alerts') return n.type === 'alert';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notifications"
        subtitle={`${unreadCount} unread alerts & ticket updates`}
        showBack={!!onNavigateBack}
        onBack={onNavigateBack}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onMarkAllAsRead}
              style={styles.markReadBtn}
            >
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {[
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'alerts', label: 'SLA Alerts' },
        ].map((tab) => {
          const isSelected = filter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => setFilter(tab.key)}
              style={[
                styles.filterTab,
                isSelected && styles.filterTabActive,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isSelected && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notification List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        renderItem={({ item }) => (
          <NotificationItem
            title={item.title}
            description={item.description}
            time={item.time}
            type={item.type}
            isRead={item.isRead}
            onPress={() => onSelectNotification && onSelectNotification(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="All caught up!"
            message="You have no notifications in this category. System updates and ticket replies will appear here in real time."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  markReadBtn: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  markReadText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.bold,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
  },
  filterTabActive: {
    backgroundColor: COLORS.primaryNavy,
    borderColor: COLORS.primaryNavy,
  },
  filterTabText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    fontWeight: TYPOGRAPHY.medium,
  },
  filterTabTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.bold,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
});
