import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { AppButton } from '../components/common/AppButton';
import { AppTextInput } from '../components/common/AppTextInput';
import { api } from '../services/apiClient';

const samplePrompts = [
  'How do I re-verify WhatsApp Cloud API webhooks?',
  'SAML single sign-on user authorization failure',
  'Customer wants refund for annual invoice seat reduction',
];

const stats = [
  { key: 'deflected', value: '41.9%', label: 'Answered without an agent' },
  { key: 'saved', value: '164 h', label: 'Agent time saved in October' },
  { key: 'faithful', value: '98.4%', label: 'Answers matching their sources' },
];

const safeguards = [
  {
    icon: 'lock-closed-outline',
    title: 'Tenant isolation',
    body: 'Knowledge embeddings are partitioned by tenant ID, so Copilot only reads your workspace.',
  },
  {
    icon: 'eye-off-outline',
    title: 'PII redaction',
    body: 'Card numbers and passwords are masked before any model call.',
  },
  {
    icon: 'people-outline',
    title: 'Hands off to an agent',
    body: 'When retrieval confidence is under 85%, the ticket goes to the agent queue.',
  },
];

// Copilot provenance mark: sparkles + name, always visible on AI output.
const CopilotMark = ({ note }) => (
  <View style={styles.mark}>
    <Ionicons name="sparkles" size={16} color={COLORS.violet} />
    <Text style={[TYPE.label, styles.markName]}>Copilot</Text>
    {note ? <Text style={[TYPE.labelSmall, styles.markNote]}>{note}</Text> : null}
  </View>
);

export const AICopilotScreen = ({ onOpenArticles }) => {
  const [prompt, setPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleTestInference = async () => {
    if (!prompt.trim()) return;
    setAnalyzing(true);
    const res = await api.post('/api/v1/ai/chat', { query: prompt.trim() });
    setAnalyzing(false);
    if (!res.success || !res.data?.response) {
      setResult({
        error: res.isNetworkError
          ? "Copilot couldn't reach the server. Check that the backend is running and try again."
          : res.error || 'Copilot could not answer this one.',
      });
      return;
    }
    const d = res.data;
    setResult({
      summary: d.suggested_action
        ? `${d.suggested_action} (confidence ${d.confidence})`
        : `Confidence ${d.confidence}`,
      citations: (d.citations || []).map((c) => c.title),
      suggestedDraft: d.response,
      // Without an AI key the backend answers by matching help articles only.
      articleMatchOnly: d.provider === 'supportdesk-grounded-engine',
    });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Copilot"
        subtitle="Grounded in your knowledge base"
        rightAction={
          onOpenArticles ? (
            <AppButton
              title="Articles"
              size="sm"
              variant="ghost"
              onPress={onOpenArticles}
              icon={<Ionicons name="book-outline" size={18} color={COLORS.violetInk} />}
            />
          ) : null
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Ask */}
        <View style={styles.sheet}>
          <View style={styles.sheetBody}>
            <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.heading]}>
              Test a question
            </Text>
            <Text style={[TYPE.bodySmall, styles.muted]}>
              See which articles Copilot retrieves and the reply it would draft.
            </Text>

            <AppTextInput
              label="Customer question"
              placeholder="Paste a customer question or describe the case"
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
              style={styles.input}
            />
          </View>

          <Text style={[TYPE.label, styles.examplesLabel]}>Or start from an example</Text>
          {samplePrompts.map((p) => (
            <Pressable
              key={p}
              accessibilityRole="button"
              accessibilityLabel={`Use example: ${p}`}
              onPress={() => setPrompt(p)}
              style={({ pressed }) => [styles.exampleRow, pressed && styles.pressed]}
            >
              <Text style={[TYPE.bodySmall, styles.exampleText]} numberOfLines={2}>
                {p}
              </Text>
              <Ionicons name="arrow-up-outline" size={18} color={COLORS.inkFaint} style={styles.exampleIcon} />
            </Pressable>
          ))}

          <View style={styles.sheetBody}>
            <AppButton
              title={analyzing ? 'Copilot is reading your articles' : 'Ask Copilot'}
              onPress={handleTestInference}
              loading={analyzing}
              disabled={analyzing || !prompt.trim()}
              variant="primary"
              icon={<Ionicons name="sparkles" size={18} color={prompt.trim() ? COLORS.ink : COLORS.inkFaint} />}
            />
          </View>
        </View>

        {/* Copilot output */}
        {result?.error ? (
          <Text accessibilityRole="alert" style={[TYPE.body, { color: COLORS.error, marginTop: SPACING.lg }]}>
            {result.error}
          </Text>
        ) : null}

        {result && !result.error && (
          <View style={styles.answer} accessibilityLabel="Copilot answer">
            <CopilotMark note={result.articleMatchOnly ? 'Article match, no AI model connected' : null} />

            <Text style={[TYPE.labelSmall, styles.answerLabel]}>Suggested action</Text>
            <Text style={[TYPE.body, styles.answerText]}>{result.summary}</Text>

            <View style={styles.answerRule} />
            <Text style={[TYPE.labelSmall, styles.answerLabel]}>Sources</Text>
            {result.citations.length === 0 ? (
              <Text style={[TYPE.bodySmall, styles.citationText]}>No matching articles in your knowledge base.</Text>
            ) : null}
            {result.citations.map((cite) => (
              <View key={cite} style={styles.citationRow}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.violetInk} />
                <Text style={[TYPE.bodySmall, styles.citationText]}>{cite}</Text>
              </View>
            ))}

            <View style={styles.answerRule} />
            <Text style={[TYPE.labelSmall, styles.answerLabel]}>Suggested reply</Text>
            <Text style={[TYPE.body, styles.answerText]}>{result.suggestedDraft}</Text>
            <Text style={[TYPE.bodySmall, styles.answerHint]}>
              Drafted by Copilot. Read it before you send it to a customer.
            </Text>
          </View>
        )}

        {/* Performance */}
        <View style={styles.sectionHead}>
          <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.heading]}>
            How Copilot is doing
          </Text>
          <Text style={[TYPE.labelSmall, styles.demoNote]}>Demo data</Text>
        </View>
        {/* Rows, like Reports: label left, figure right */}
        <View style={styles.sheet}>
          {stats.map((st, i) => (
            <View
              key={st.key}
              accessible
              accessibilityLabel={`${st.label}: ${st.value}`}
              style={[styles.statRow, i > 0 && styles.rowRule]}
            >
              <Text style={[TYPE.body, styles.statLabel]}>{st.label}</Text>
              <Text style={[TYPE.titleSmall, styles.statValue]}>{st.value}</Text>
            </View>
          ))}
        </View>

        {/* Safeguards */}
        <View style={styles.sectionHead}>
          <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.heading]}>
            Safeguards
          </Text>
        </View>
        <View style={styles.sheet}>
          {safeguards.map((g, i) => (
            <View key={g.title} style={[styles.guardRow, i > 0 && styles.rowRule]}>
              <Ionicons name={g.icon} size={22} color={COLORS.violetInk} style={styles.guardIcon} />
              <View style={styles.flex}>
                <Text style={[TYPE.bodyStrong, styles.heading]}>{g.title}</Text>
                <Text style={[TYPE.bodySmall, styles.muted]}>{g.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  scrollArea: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  flex: { flex: 1 },
  heading: { color: COLORS.ink },
  muted: { color: COLORS.inkMuted, marginTop: 2 },
  pressed: { backgroundColor: COLORS.groundDeep },

  sheet: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    overflow: 'hidden',
  },
  sheetBody: { padding: SPACING.lg },
  input: { marginTop: SPACING.lg, marginBottom: 0 },

  examplesLabel: {
    color: COLORS.inkMuted,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
  },
  exampleText: { flex: 1, color: COLORS.violetInk },
  exampleIcon: { marginLeft: SPACING.md, transform: [{ rotate: '-45deg' }] },

  // AI output: violet wash, marked as Copilot
  answer: {
    backgroundColor: COLORS.violetWash,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  mark: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.md },
  markName: { color: COLORS.violetInk },
  markNote: { color: COLORS.violetInk, marginLeft: 'auto' },
  answerLabel: { color: COLORS.violetInk, marginBottom: SPACING.xs },
  answerText: { color: COLORS.ink },
  answerRule: { height: 1, backgroundColor: COLORS.ai.border, marginVertical: SPACING.md },
  citationRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
  citationText: { flex: 1, color: COLORS.violetInk },
  answerHint: { color: COLORS.inkMuted, marginTop: SPACING.md },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.md,
  },
  demoNote: { color: COLORS.inkFaint },

  // Quiet figures, divided by hairlines
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  statLabel: { color: COLORS.ink, flex: 1 },
  statValue: { color: COLORS.ink },

  guardRow: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.lg },
  rowRule: { borderTopWidth: 1, borderTopColor: COLORS.rule },
  guardIcon: { marginRight: SPACING.md, marginTop: 1 },
});
