import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { EmptyState } from '../components/common/EmptyState';
import { AppButton } from '../components/common/AppButton';

export const ConversationHistoryScreen = ({
  conversations = [],
  onSelectConversation,
  onNavigateBack,
  onNewChat,
}) => {
  const [search, setSearch] = useState('');

  const query = search.toLowerCase();
  const filtered = conversations.filter(
    (c) =>
      (c.title || '').toLowerCase().includes(query) ||
      (c.lastMessage || '').toLowerCase().includes(query)
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Conversations"
        subtitle="Your chats with support and the assistant"
        showBack
        onBack={onNavigateBack}
        rightAction={
          onNewChat ? (
            <AppButton
              title="New chat"
              size="sm"
              variant="primary"
              onPress={onNewChat}
              icon={<Ionicons name="add" size={18} color={COLORS.ink} />}
              style={styles.headerBtn}
            />
          ) : null
        }
      />

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.inkMuted} style={styles.searchIcon} />
          <TextInput
            accessibilityLabel="Search conversations"
            placeholder="Search conversations"
            placeholderTextColor={COLORS.inkFaint}
            selectionColor={COLORS.violet}
            cursorColor={COLORS.violetInk}
            value={search}
            onChangeText={setSearch}
            style={styles.input}
          />
          {search.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearch('')}
              style={styles.clearBtn}
            >
              <Ionicons name="close" size={20} color={COLORS.inkMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        contentContainerStyle={[styles.listContent, filtered.length > 0 && styles.sheet]}
        renderItem={({ item, index }) => {
          const isActive = item.status === 'active';
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${isActive ? 'active' : 'closed'}, ${item.time}`}
              onPress={() => onSelectConversation && onSelectConversation(item)}
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.rowDivider,
                pressed && styles.rowPressed,
              ]}
            >
              <Ionicons
                name={isActive ? 'chatbubble-ellipses' : 'chatbubble-outline'}
                size={22}
                color={isActive ? COLORS.violet : COLORS.inkMuted}
                style={styles.rowIcon}
              />

              <View style={styles.rowText}>
                <View style={styles.topRow}>
                  <Text style={[TYPE.bodyStrong, styles.title]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[TYPE.numeric, styles.time]}>{item.time}</Text>
                </View>

                <Text style={[TYPE.bodySmall, styles.lastMessage]} numberOfLines={2}>
                  {item.lastMessage}
                </Text>

                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: isActive ? COLORS.success : COLORS.ruleStrong }]} />
                  <Text style={[TYPE.labelSmall, { color: isActive ? COLORS.success : COLORS.inkMuted }]}>
                    {isActive ? 'Active' : 'Closed'}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={COLORS.inkFaint} style={styles.chevron} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title={search ? 'No matches' : 'No conversations yet'}
            message={
              search
                ? `Nothing matches “${search}”. Try another word or clear the search.`
                : 'Start a chat and the assistant will help, or pass you to a person.'
            }
            actionLabel="Start a chat"
            onAction={onNewChat}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  headerBtn: { marginRight: SPACING.sm },

  searchSection: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  searchBox: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    paddingLeft: SPACING.md,
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: { marginRight: SPACING.sm },
  input: { ...TYPE.body, flex: 1, color: COLORS.ink, paddingVertical: SPACING.sm, outlineStyle: 'none' },
  clearBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },

  list: { flex: 1 },
  listContent: { marginHorizontal: SPACING.lg, marginBottom: SPACING.xxl },
  sheet: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    minHeight: 72,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: COLORS.rule },
  rowPressed: { backgroundColor: COLORS.groundDeep },
  rowIcon: { marginRight: SPACING.md, marginTop: 1 },
  rowText: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
  title: { color: COLORS.ink, flex: 1, marginRight: SPACING.sm },
  time: { color: COLORS.inkFaint },
  lastMessage: { color: COLORS.inkMuted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2, marginTop: SPACING.sm },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  chevron: { alignSelf: 'center', marginLeft: SPACING.xs },
});
