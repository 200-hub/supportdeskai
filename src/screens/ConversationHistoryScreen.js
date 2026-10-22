import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { EmptyState } from '../components/common/EmptyState';

export const ConversationHistoryScreen = ({
  conversations = [],
  onSelectConversation,
  onNavigateBack,
  onNewChat,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Conversation History"
        subtitle="Previous support & AI chat sessions"
        showBack
        onBack={onNavigateBack}
        rightAction={
          onNewChat && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNewChat}
              style={styles.newChatBtn}
            >
              <Ionicons name="chatbubbles" size={15} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.newChatBtnText}>New Chat</Text>
            </TouchableOpacity>
          )
        }
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.secondaryText} style={{ marginRight: SPACING.sm }} />
          <TextInput
            placeholder="Search conversations by keyword..."
            placeholderTextColor={COLORS.secondaryText}
            value={search}
            onChangeText={setSearch}
            style={styles.input}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        renderItem={({ item }) => {
          const isActive = item.status === 'active';
          return (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onSelectConversation(item)}
              style={styles.card}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isActive ? '#CCFBF1' : COLORS.lightBg },
                ]}
              >
                <Ionicons
                  name={isActive ? 'chatbubble-ellipses' : 'chatbox-outline'}
                  size={18}
                  color={isActive ? COLORS.accentTeal : COLORS.secondaryText}
                />
              </View>

              <View style={styles.textContainer}>
                <View style={styles.topRow}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>

                <Text style={styles.lastMessage} numberOfLines={2}>
                  {item.lastMessage}
                </Text>

                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9' },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isActive ? COLORS.success : COLORS.secondaryText },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: isActive ? COLORS.success : COLORS.secondaryText },
                      ]}
                    >
                      {isActive ? 'Active Session' : 'Closed'}
                    </Text>
                  </View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color={COLORS.secondaryText} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations found"
            message="No past chat logs match your search. Start a new AI assistant conversation."
            actionLabel="Start New Chat"
            onAction={onNewChat}
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
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryNavy,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
  },
  newChatBtnText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.bold,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  searchBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: TYPOGRAPHY.sm + 1,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    flex: 1,
    marginRight: SPACING.sm,
  },
  time: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
  },
  lastMessage: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    lineHeight: 16,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.semiBold,
  },
});
