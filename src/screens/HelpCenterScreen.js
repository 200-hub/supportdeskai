import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { EmptyState } from '../components/common/EmptyState';
import { AppButton } from '../components/common/AppButton';
import {
  KNOWLEDGE_TOPICS,
  KNOWLEDGE_FAQS,
  KNOWLEDGE_ARTICLES,
} from '../data/mockData';

export const HelpCenterScreen = ({
  onNavigateBack,
  onNavigateToCreateTicket,
  onNavigateToChat,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);
  const [votedHelpful, setVotedHelpful] = useState(null);

  // Filter articles based on search & category
  const filteredArticles = KNOWLEDGE_ARTICLES.filter((article) => {
    const matchesCategory =
      !selectedCategory || article.category === selectedCategory;
    const matchesSearch =
      !search.trim() ||
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.summary.toLowerCase().includes(search.toLowerCase()) ||
      article.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (index) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  const handleVote = (isYes) => {
    setVotedHelpful(isYes);
    Alert.alert(
      'Feedback Received',
      isYes
        ? 'Thank you! Your feedback helps us improve our knowledge grounding.'
        : 'Thank you. We will update this guide with clearer instructions.'
    );
  };

  // If an article is selected, render the Article Details View!
  if (selectedArticle) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Article Details"
          subtitle={selectedArticle.category}
          showBack
          onBack={() => {
            setSelectedArticle(null);
            setVotedHelpful(null);
          }}
        />

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          <View style={styles.articleDetailCard}>
            <View style={styles.articleMetaTop}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{selectedArticle.category}</Text>
              </View>
              <Text style={styles.articleStats}>
                {selectedArticle.reads} reads • {selectedArticle.helpful} helpful
              </Text>
            </View>

            <Text style={styles.articleMainTitle}>{selectedArticle.title}</Text>

            <View style={styles.divider} />

            <Text style={styles.articleBody}>{selectedArticle.content || selectedArticle.summary}</Text>

            <View style={styles.divider} />

            {/* Was this helpful? */}
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>Was this article helpful?</Text>
              <View style={styles.feedbackBtnsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleVote(true)}
                  style={[
                    styles.voteBtn,
                    votedHelpful === true && styles.voteBtnActive,
                  ]}
                >
                  <Ionicons
                    name="thumbs-up"
                    size={16}
                    color={votedHelpful === true ? COLORS.white : COLORS.success}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.voteBtnText,
                      votedHelpful === true && { color: COLORS.white },
                    ]}
                  >
                    Yes, helpful
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleVote(false)}
                  style={[
                    styles.voteBtn,
                    votedHelpful === false && styles.voteBtnDangerActive,
                  ]}
                >
                  <Ionicons
                    name="thumbs-down"
                    size={16}
                    color={votedHelpful === false ? COLORS.white : COLORS.secondaryText}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.voteBtnText,
                      votedHelpful === false && { color: COLORS.white },
                    ]}
                  >
                    No, need more info
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Still need help callout */}
          <View style={styles.supportCallout}>
            <Ionicons name="chatbubbles" size={24} color={COLORS.accentTeal} style={{ marginBottom: 6 }} />
            <Text style={styles.calloutTitle}>Still have questions?</Text>
            <Text style={styles.calloutSubtitle}>
              Our support team and 24/7 AI copilot are ready to assist with your operational setup.
            </Text>
            <View style={styles.calloutBtns}>
              <AppButton
                title="Create a Ticket"
                onPress={onNavigateToCreateTicket}
                variant="primary"
                size="md"
                style={{ marginRight: 8, flex: 1 }}
              />
              <AppButton
                title="Live AI Chat"
                onPress={onNavigateToChat}
                variant="teal"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Help Center"
        subtitle="Self-service guides and frequently asked questions"
        showBack={!!onNavigateBack}
        onBack={onNavigateBack}
      />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Search Field */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.secondaryText} style={{ marginRight: SPACING.sm }} />
          <TextInput
            placeholder="Search articles by topic, keyword, or error code..."
            placeholderTextColor={COLORS.secondaryText}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.secondaryText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Popular Category Cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Topics</Text>
          {selectedCategory && (
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Text style={styles.clearFilterText}>Show All</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.categoryGrid}>
          {KNOWLEDGE_TOPICS.map((item) => {
            const isSelected = selectedCategory === item.title;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() =>
                  setSelectedCategory(isSelected ? null : item.title)
                }
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                ]}
              >
                <View
                  style={[
                    styles.categoryIconCircle,
                    isSelected && { backgroundColor: COLORS.primaryNavy },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isSelected ? COLORS.white : COLORS.primaryNavy}
                  />
                </View>
                <Text style={styles.categoryCardTitle}>{item.title}</Text>
                <Text style={styles.categoryCardCount}>{item.count} articles</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Frequently Asked Questions */}
        {!selectedCategory && !search && (
          <View style={styles.faqSection}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {KNOWLEDGE_FAQS.map((faq, index) => {
              const isExpanded = expandedFaqIndex === index;
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  onPress={() => toggleFaq(index)}
                  style={styles.faqCard}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={COLORS.secondaryText}
                    />
                  </View>
                  {isExpanded && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Article List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory ? `${selectedCategory} Articles` : 'All Knowledge Articles'}
          </Text>
          <Text style={styles.articleCounter}>
            {filteredArticles.length} found
          </Text>
        </View>

        {filteredArticles.map((article) => (
          <TouchableOpacity
            key={article.id}
            activeOpacity={0.7}
            onPress={() => setSelectedArticle(article)}
            style={styles.articleCard}
          >
            <View style={styles.articleCategoryRow}>
              <View style={styles.miniPill}>
                <Text style={styles.miniPillText}>{article.category}</Text>
              </View>
              <Text style={styles.readStats}>
                {article.reads} reads • {article.helpful} helpful
              </Text>
            </View>

            <Text style={styles.articleTitle}>{article.title}</Text>
            <Text style={styles.articleSummary} numberOfLines={2}>
              {article.summary}
            </Text>

            <View style={styles.articleActionRow}>
              <Text style={styles.readMoreText}>Read Guide</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.accentTeal} style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        ))}

        {filteredArticles.length === 0 && (
          <EmptyState
            icon="search-outline"
            title="No articles match your query"
            message={`We couldn't find any articles matching "${search}". You can ask our AI assistant or open a support ticket.`}
            actionLabel="Ask AI Assistant"
            onAction={onNavigateToChat}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
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
    marginBottom: SPACING.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
  },
  clearFilterText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
  },
  categoryCardSelected: {
    borderColor: COLORS.primaryNavy,
    backgroundColor: '#EFF6FF',
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.lightBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs + 2,
  },
  categoryCardTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    marginBottom: 2,
  },
  categoryCardCount: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
  },
  faqSection: {
    marginBottom: SPACING.lg,
  },
  faqCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
    flex: 1,
    marginRight: SPACING.sm,
  },
  faqAnswer: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    marginTop: SPACING.sm,
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.xs + 2,
  },
  articleCounter: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
  },
  articleCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  articleCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
  },
  miniPill: {
    backgroundColor: COLORS.lightBg,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.xs,
  },
  miniPillText: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryNavy,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  readStats: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
  },
  articleTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    marginBottom: 4,
    lineHeight: 22,
  },
  articleSummary: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  articleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.bold,
  },

  // Article Details View Styling
  articleDetailCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  articleMetaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xs,
  },
  categoryBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primaryNavy,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  articleStats: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
  },
  articleMainTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    lineHeight: 26,
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  articleBody: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
    lineHeight: 22,
  },
  feedbackSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  feedbackTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
    marginBottom: SPACING.sm,
  },
  feedbackBtnsRow: {
    flexDirection: 'row',
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    marginHorizontal: 4,
  },
  voteBtnActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  voteBtnDangerActive: {
    backgroundColor: COLORS.secondaryText,
    borderColor: COLORS.secondaryText,
  },
  voteBtnText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.mainText,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  supportCallout: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#99F6E4',
    padding: SPACING.lg,
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 18,
    maxWidth: 280,
  },
  calloutBtns: {
    flexDirection: 'row',
    width: '100%',
  },
});
