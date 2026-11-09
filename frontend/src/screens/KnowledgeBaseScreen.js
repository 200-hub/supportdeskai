import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { AppButton } from '../components/common/AppButton';
import { EmptyState } from '../components/common/EmptyState';
import { KNOWLEDGE_ARTICLES } from '../data/mockData';

export const KnowledgeBaseScreen = ({ onNavigateBack }) => {
  const [search, setSearch] = useState('');
  const [articles] = useState(KNOWLEDGE_ARTICLES);
  const [expandedId, setExpandedId] = useState(null);

  const q = search.toLowerCase();
  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q)
  );
  const lastIndex = filteredArticles.length - 1;

  const handleCopyLink = (article) => {
    Alert.alert('Link ready', `The link to "${article.title}" is ready to insert into a ticket.`);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Knowledge base"
        subtitle="Articles Copilot and your team answer from"
        showBack={!!onNavigateBack}
        onBack={onNavigateBack}
      />

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.inkMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search by keyword or category"
            placeholderTextColor={COLORS.inkFaint}
            selectionColor={COLORS.violet}
            accessibilityLabel="Search articles"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearch('')}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.inkMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title="No articles match"
            message="Try a shorter keyword, or clear the search to see every article."
            actionLabel="Clear search"
            onAction={() => setSearch('')}
          />
        }
        renderItem={({ item, index }) => {
          const expanded = expandedId === item.id;
          return (
            // Rows on one paper sheet: first and last rows carry the sheet's corners.
            <View
              style={[
                styles.row,
                index === 0 && styles.rowFirst,
                index === lastIndex && styles.rowLast,
              ]}
            >
              <Text style={[TYPE.titleSmall, styles.title]}>{item.title}</Text>
              <Text style={[TYPE.bodySmall, styles.summary]}>{item.summary}</Text>

              <View style={styles.stats}>
                <Ionicons name="folder-outline" size={14} color={COLORS.violetInk} />
                <Text style={[TYPE.labelSmall, styles.category]}>{item.category}</Text>
              </View>
              <View style={styles.stats}>
                <Ionicons name="eye-outline" size={14} color={COLORS.inkFaint} />
                <Text style={[TYPE.numeric, styles.statText]}>{item.reads} reads</Text>
                <Ionicons name="thumbs-up-outline" size={14} color={COLORS.inkFaint} style={styles.statGap} />
                <Text style={[TYPE.numeric, styles.statText]}>{item.helpful} helpful</Text>
              </View>

              {expanded && item.content ? (
                <Text style={[TYPE.body, styles.content]}>{item.content}</Text>
              ) : null}

              <View style={styles.actions}>
                <AppButton
                  title="Copy link"
                  variant="tonal"
                  size="sm"
                  onPress={() => handleCopyLink(item)}
                  icon={<Ionicons name="link-outline" size={16} color={COLORS.violetInk} />}
                />
                {item.content ? (
                  <AppButton
                    title={expanded ? 'Hide article' : 'Read article'}
                    variant="ghost"
                    size="sm"
                    iconPosition="right"
                    onPress={() => setExpandedId(expanded ? null : item.id)}
                    icon={
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={COLORS.violetInk}
                      />
                    }
                  />
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  searchSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.lg },
  searchBox: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    minHeight: TOUCH,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { ...TYPE.body, flex: 1, color: COLORS.ink, paddingVertical: SPACING.md },
  clearBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },

  row: {
    backgroundColor: COLORS.paper,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.rule,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  rowLast: {
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
  },
  category: { color: COLORS.violetInk, flexShrink: 1 },
  title: { color: COLORS.ink },
  summary: { color: COLORS.inkMuted, marginTop: SPACING.xs },
  stats: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.md },
  statText: { color: COLORS.inkFaint, fontSize: 12 },
  statGap: { marginLeft: SPACING.md },
  content: {
    color: COLORS.ink,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
});
