import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { SolidButton } from '../components/common/SolidButton';

export const AICopilotScreen = () => {
  const [prompt, setPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const samplePrompts = [
    'How do I re-verify WhatsApp Cloud API webhooks?',
    'SAML single sign-on user authorization failure',
    'Customer wants refund for annual invoice seat reduction',
  ];

  const handleTestInference = () => {
    if (!prompt.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        summary: 'Detected Billing & Tenant Admin category with 96% confidence.',
        answer:
          'Based on Tenant Knowledge Base Article #KB-3: Prorated refunds are automatically computed when seats are removed mid-cycle. The credit balance is applied to the next billing invoice or can be refunded via Stripe API.',
        citations: ['KB #3: Managing Team Seats & Billing', 'Policy: Subscription Terms Sec 4.2'],
        suggestedDraft:
          'Hi there! We have adjusted your subscription. The unused balance for the removed seat has been credited to your billing account and will apply automatically to your upcoming invoice.',
      });
    }, 600);
  };

  return (
    <View style={styles.container}>
      <Header title="AI Copilot Studio" subtitle="Grounded RAG Assistant & Deflection" />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Metric Cards Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconBox}>
              <Ionicons name="sparkles" size={16} color={COLORS.accentTeal} />
            </View>
            <Text style={styles.metricValue}>41.9%</Text>
            <Text style={styles.metricLabel}>Auto-Deflected</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconBox}>
              <Ionicons name="time" size={16} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.metricValue}>164 hrs</Text>
            <Text style={styles.metricLabel}>Saved in Oct</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconBox}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            </View>
            <Text style={styles.metricValue}>98.4%</Text>
            <Text style={styles.metricLabel}>RAG Faithfulness</Text>
          </View>
        </View>

        {/* AI Copilot Query Box */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="hardware-chip-outline" size={18} color={COLORS.primaryNavy} style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>Knowledge Grounding Simulator</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Test how the AI retrieves tenant knowledge, verifies citations, and formulates response drafts.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              multiline
              placeholder="Enter customer question or support scenario..."
              placeholderTextColor={COLORS.secondaryText}
              value={prompt}
              onChangeText={setPrompt}
              style={styles.textInput}
            />
          </View>

          {/* Quick Prompts */}
          <Text style={styles.quickPromptLabel}>Try asking:</Text>
          <View style={styles.quickPromptsWrap}>
            {samplePrompts.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => setPrompt(p)}
                style={styles.promptPill}
              >
                <Text style={styles.promptPillText} numberOfLines={1}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <SolidButton
            title={analyzing ? 'Synthesizing Knowledge...' : 'Run Copilot Analysis'}
            onPress={handleTestInference}
            disabled={analyzing || !prompt.trim()}
            variant="primary"
            style={{ marginTop: SPACING.md }}
          />
        </View>

        {/* Inference Result Display */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{ marginRight: 6 }} />
              <Text style={styles.resultTitle}>Grounded AI Output</Text>
            </View>

            <View style={styles.resultSection}>
              <Text style={styles.resultSubhead}>Intent & Classification</Text>
              <Text style={styles.resultText}>{result.summary}</Text>
            </View>

            <View style={styles.resultSection}>
              <Text style={styles.resultSubhead}>Knowledge Grounding & Citations</Text>
              {result.citations.map((cite, i) => (
                <View key={i} style={styles.citationRow}>
                  <Ionicons name="bookmark" size={12} color={COLORS.accentTeal} style={{ marginRight: 4 }} />
                  <Text style={styles.citationText}>{cite}</Text>
                </View>
              ))}
            </View>

            <View style={styles.resultSection}>
              <Text style={styles.resultSubhead}>Suggested Customer Reply</Text>
              <View style={styles.draftBox}>
                <Text style={styles.draftText}>{result.suggestedDraft}</Text>
              </View>
            </View>
          </View>
        )}

        {/* AI Capabilities Overview */}
        <View style={styles.capabilitiesCard}>
          <Text style={styles.capTitle}>Configured Copilot Capabilities</Text>

          <View style={styles.capItem}>
            <View style={styles.capDot} />
            <View style={styles.capContent}>
              <Text style={styles.capHead}>Tenant Isolation & RLS</Text>
              <Text style={styles.capDesc}>All RAG embeddings are strictly partitioned by tenant ID.</Text>
            </View>
          </View>

          <View style={styles.capItem}>
            <View style={styles.capDot} />
            <View style={styles.capContent}>
              <Text style={styles.capHead}>PII Redaction</Text>
              <Text style={styles.capDesc}>Customer credit cards and passwords are automatically masked before LLM calls.</Text>
            </View>
          </View>

          <View style={styles.capItem}>
            <View style={styles.capDot} />
            <View style={styles.capContent}>
              <Text style={styles.capHead}>Human-in-the-Loop Hand-off</Text>
              <Text style={styles.capDesc}>Tickets automatically escalate to agent queue if retrieval confidence is under 85%.</Text>
            </View>
          </View>
        </View>
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  metricIconBox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.lightBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  inputContainer: {
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  textInput: {
    minHeight: 70,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
    textAlignVertical: 'top',
  },
  quickPromptLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    fontWeight: TYPOGRAPHY.semiBold,
    marginBottom: SPACING.xs,
  },
  quickPromptsWrap: {
    flexDirection: 'column',
  },
  promptPill: {
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    marginBottom: 6,
  },
  promptPillText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryNavy,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.success,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
  },
  resultSection: {
    marginBottom: SPACING.md,
  },
  resultSubhead: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resultText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  citationText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryNavy,
  },
  draftBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
    padding: SPACING.md,
  },
  draftText: {
    fontSize: TYPOGRAPHY.sm,
    color: '#0F766E',
    lineHeight: TYPOGRAPHY.lineHeightNormal,
  },
  capabilitiesCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  capTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
    marginBottom: SPACING.md,
  },
  capItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  capDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentTeal,
    marginTop: 5,
    marginRight: SPACING.sm,
  },
  capContent: {
    flex: 1,
  },
  capHead: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
  },
  capDesc: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 1,
    lineHeight: 16,
  },
});
