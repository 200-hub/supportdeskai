import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { EmptyState } from '../components/common/EmptyState';
import { AppButton } from '../components/common/AppButton';
import { KNOWLEDGE_TOPICS, KNOWLEDGE_FAQS, KNOWLEDGE_ARTICLES } from '../data/mockData';

const MEASURE = 560; // ~65 characters of TYPE.body

export const HelpCenterScreen = ({ onNavigateBack, onNavigateToCreateTicket, onNavigateToChat }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);
  const [votedHelpful, setVotedHelpful] = useState(null);

  // Filter articles based on search & category
  const filteredArticles = KNOWLEDGE_ARTICLES.filter((article) => {
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
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
      'Thanks for the feedback',
      isYes
        ? 'Glad it helped. Your answer helps us keep these guides useful.'
        : "Sorry it didn't help. We'll use your answer to make this guide clearer."
    );
  };

  if (selectedArticle) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Article"
          showBack
          onBack={() => {
            setSelectedArticle(null);
            setVotedHelpful(null);
          }}
        />

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          <View style={styles.article}>
            <Text style={[TYPE.label, styles.category]}>{selectedArticle.category}</Text>
            <Text accessibilityRole="header" style={[TYPE.headline, styles.ink, styles.articleTitle]}>
              {selectedArticle.title}
            </Text>
            <Text style={[TYPE.bodySmall, styles.faint]}>
              {selectedArticle.reads} reads, {selectedArticle.helpful} found it helpful (demo data)
            </Text>

            <View style={styles.rule} />

            <Text style={[TYPE.body, styles.ink, styles.measure]}>{selectedArticle.content || selectedArticle.summary}</Text>

            <View style={styles.rule} />

            <Text style={[TYPE.titleSmall, styles.ink]}>Was this article helpful?</Text>
            <View style={styles.voteRow}>
              <AppButton
                title="Yes"
                onPress={() => handleVote(true)}
                variant={votedHelpful === true ? 'tonal' : 'outline'}
                size="sm"
                icon={
                  <Ionicons
                    name={votedHelpful === true ? 'thumbs-up' : 'thumbs-up-outline'}
                    size={16}
                    color={votedHelpful === true ? COLORS.violetInk : COLORS.ink}
                  />
                }
              />
              <AppButton
                title="No"
                onPress={() => handleVote(false)}
                variant={votedHelpful === false ? 'tonal' : 'outline'}
                size="sm"
                icon={
                  <Ionicons
                    name={votedHelpful === false ? 'thumbs-down' : 'thumbs-down-outline'}
                    size={16}
                    color={votedHelpful === false ? COLORS.violetInk : COLORS.ink}
                  />
                }
              />
            </View>
          </View>

          <View style={styles.stillStuck}>
            <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.ink]}>
              Still stuck?
            </Text>
            <Text style={[TYPE.body, styles.muted, styles.stillStuckText]}>
              Ask the assistant, or open a ticket and someone from the support team will pick it up.
            </Text>
            <View style={styles.ctaRow}>
              <AppButton
                title="Create ticket"
                onPress={onNavigateToCreateTicket}
                variant="primary"
                style={styles.flex}
              />
              <AppButton
                title="Ask the assistant"
                onPress={onNavigateToChat}
                variant="tonal"
                style={styles.flex}
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
        title="Help centre"
        subtitle="Guides and common questions"
        showBack={!!onNavigateBack}
        onBack={onNavigateBack}
      />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={COLORS.inkMuted} />
          <TextInput
            placeholder="Search articles"
            placeholderTextColor={COLORS.inkFaint}
            selectionColor={COLORS.violet}
            cursorColor={COLORS.violetInk}
            accessibilityLabel="Search articles"
            returnKeyType="search"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearch('')}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.inkMuted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.ink]}>
            Topics
          </Text>
          {selectedCategory ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show all topics"
              onPress={() => setSelectedCategory(null)}
              style={styles.linkBtn}
            >
              <Text style={[TYPE.label, styles.link]}>Show all</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sheet}>
          {KNOWLEDGE_TOPICS.map((item, i) => {
            const isSelected = selectedCategory === item.title;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${item.title}, ${item.count} articles`}
                onPress={() => setSelectedCategory(isSelected ? null : item.title)}
                style={({ pressed }) => [
                  styles.row,
                  i < KNOWLEDGE_TOPICS.length - 1 && styles.rowBorder,
                  isSelected && styles.rowSelected,
                  pressed && !isSelected && styles.pressed,
                ]}
              >
                <Ionicons name={item.icon} size={22} color={isSelected ? COLORS.violetInk : COLORS.inkMuted} />
                <Text style={[TYPE.bodyStrong, styles.rowTitle, isSelected && styles.link]}>{item.title}</Text>
                <Text style={[TYPE.numeric, isSelected ? styles.link : styles.muted]}>{item.count}</Text>
                <Ionicons
                  name={isSelected ? 'checkmark' : 'chevron-forward'}
                  size={20}
                  color={isSelected ? COLORS.violetInk : COLORS.inkFaint}
                />
              </Pressable>
            );
          })}
        </View>

        {!selectedCategory && !search ? (
          <>
            <View style={styles.sectionHeader}>
              <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.ink]}>
                Common questions
              </Text>
            </View>
            <View style={styles.sheet}>
              {KNOWLEDGE_FAQS.map((faq, index) => {
                const isExpanded = expandedFaqIndex === index;
                return (
                  <Pressable
                    key={index}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                    accessibilityLabel={faq.question}
                    onPress={() => toggleFaq(index)}
                    style={({ pressed }) => [
                      styles.faq,
                      index < KNOWLEDGE_FAQS.length - 1 && styles.rowBorder,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.faqHead}>
                      <Text style={[TYPE.bodyStrong, styles.rowTitle]}>{faq.question}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={COLORS.inkMuted}
                      />
                    </View>
                    {isExpanded ? <Text style={[TYPE.body, styles.muted, styles.faqAnswer]}>{faq.answer}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.ink, styles.flex]} numberOfLines={1}>
            {selectedCategory || 'All articles'}
          </Text>
          <Text style={[TYPE.numeric, styles.muted]}>
            {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
          </Text>
        </View>

        {filteredArticles.length > 0 ? (
          <View style={styles.sheet}>
            {filteredArticles.map((article, i) => (
              <Pressable
                key={article.id}
                accessibilityRole="button"
                accessibilityLabel={`Read article: ${article.title}`}
                onPress={() => setSelectedArticle(article)}
                style={({ pressed }) => [
                  styles.articleRow,
                  i < filteredArticles.length - 1 && styles.rowBorder,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[TYPE.labelSmall, styles.category]}>{article.category}</Text>
                <Text style={[TYPE.titleSmall, styles.ink]}>{article.title}</Text>
                <Text style={[TYPE.bodySmall, styles.muted]} numberOfLines={2}>
                  {article.summary}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.sheet}>
            <EmptyState
              icon="search-outline"
              title="No matching articles"
              message={
                search
                  ? `Nothing matches "${search}". Try a shorter search, or ask the assistant.`
                  : 'Nothing in this topic yet. Try another topic, or ask the assistant.'
              }
              actionLabel="Ask the assistant"
              onAction={onNavigateToChat}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  scrollArea: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  flex: { flex: 1 },
  measure: { maxWidth: MEASURE },
  ink: { color: COLORS.ink },
  muted: { color: COLORS.inkMuted },
  faint: { color: COLORS.inkFaint },
  link: { color: COLORS.violetInk },
  category: { color: COLORS.violetInk },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 52,
    paddingLeft: SPACING.md,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    borderRadius: RADIUS.md,
  },
  searchInput: { ...TYPE.body, flex: 1, color: COLORS.ink, paddingVertical: SPACING.md },
  clearBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    minHeight: TOUCH,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xs,
  },
  linkBtn: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: SPACING.sm, marginRight: -SPACING.sm },

  sheet: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 56,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.rule },
  rowSelected: { backgroundColor: COLORS.violetWash },
  pressed: { backgroundColor: COLORS.groundDeep },
  rowTitle: { color: COLORS.ink, flex: 1 },

  faq: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, minHeight: 56, justifyContent: 'center' },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  faqAnswer: { marginTop: SPACING.sm, maxWidth: MEASURE },

  articleRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, gap: SPACING.xs },

  // Article reading view
  article: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  articleTitle: { marginTop: SPACING.xs, marginBottom: SPACING.sm, maxWidth: MEASURE },
  rule: { height: 1, backgroundColor: COLORS.rule, marginVertical: SPACING.xxl },
  voteRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },

  stillStuck: { marginTop: SPACING.xxxl },
  stillStuckText: { marginTop: SPACING.xs, marginBottom: SPACING.lg, maxWidth: MEASURE },
  ctaRow: { flexDirection: 'row', gap: SPACING.sm },
});
