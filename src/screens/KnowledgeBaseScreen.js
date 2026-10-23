import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { KNOWLEDGE_ARTICLES } from '../data/mockData';

export const KnowledgeBaseScreen = () => {
  const [search, setSearch] = useState('');
  const [articles, setArticles] = useState(KNOWLEDGE_ARTICLES);

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyLink = (article) => {
    Alert.alert('Article Copied', `Link to "${article.title}" ready to insert into ticket.`);
  };

  return (
    <View style={styles.container}>
      <Header title="Knowledge Base" subtitle="Grounded Help Articles & Docs" />

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.secondaryText} style={{ marginRight: SPACING.sm }} />
          <TextInput
            placeholder="Search articles by keyword, category..."
            placeholderTextColor={COLORS.secondaryText}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.articleCard}>
            <View style={styles.categoryRow}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <View style={styles.statsRow}>
                <Ionicons name="eye-outline" size={12} color={COLORS.secondaryText} style={{ marginRight: 3 }} />
                <Text style={styles.statsText}>{item.reads}</Text>
                <Text style={styles.statsText}> • {item.helpful} helpful</Text>
              </View>
            </View>

            <Text style={styles.articleTitle}>{item.title}</Text>
            <Text style={styles.articleSummary}>{item.summary}</Text>

            <View style={styles.cardFooter}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCopyLink(item)}
                style={styles.copyBtn}
              >
                <Ionicons name="copy-outline" size={13} color={COLORS.primaryNavy} style={{ marginRight: 4 }} />
                <Text style={styles.copyBtnText}>Copy Link for Ticket</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>Read Full Article</Text>
                <Ionicons name="chevron-forward" size={13} color={COLORS.secondaryNavy} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  articleCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  categoryPill: {
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.xs,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryNavy,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
  },
  articleTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    marginBottom: 6,
    lineHeight: TYPOGRAPHY.lineHeightNormal,
  },
  articleSummary: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.secondaryText,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  copyBtnText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.primaryNavy,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewBtnText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryNavy,
    fontWeight: TYPOGRAPHY.medium,
    marginRight: 2,
  },
});
