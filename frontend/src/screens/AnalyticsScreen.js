import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ANALYTICS_METRICS } from '../data/mockData';

const kpis = [
  {
    label: 'First response time',
    value: ANALYTICS_METRICS.avgFirstResponseTime,
    note: '18% faster than last week',
    good: true,
  },
  { label: 'SLA compliance', value: ANALYTICS_METRICS.slaComplianceRate, note: 'Target above 95%' },
  { label: 'Average resolution time', value: ANALYTICS_METRICS.avgResolutionTime, note: 'Target under 2 h' },
  {
    label: 'Customer satisfaction',
    value: `${ANALYTICS_METRICS.csatScore} / 5`,
    note: `${ANALYTICS_METRICS.csatTotalReviews} ratings`,
  },
];

const slaPolicies = [
  { name: 'Urgent (P1) incidents', firstResponse: '15 min', resolution: '2 h', atRisk: 2 },
  { name: 'High (P2) inquiries', firstResponse: '1 h', resolution: '6 h', atRisk: 0 },
  { name: 'Normal (P3, P4) support', firstResponse: '4 h', resolution: '24 h', atRisk: 0 },
];

export const AnalyticsScreen = () => {
  const channels = ANALYTICS_METRICS.channelBreakdown;
  const total = channels.reduce((sum, c) => sum + c.count, 0);
  const maxCount = Math.max(1, ...channels.map((c) => c.count));

  return (
    <View style={styles.container}>
      <ScreenHeader title="Reports" subtitle="Response times, SLA and volume" />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <View style={styles.demo}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.inkMuted} />
          <Text style={[TYPE.bodySmall, styles.demoText]}>
            Demo data. These sample figures are not from your workspace yet.
          </Text>
        </View>

        {/* Key figures: rows on one sheet */}
        <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.heading, styles.firstHeading]}>
          This week
        </Text>
        <View style={styles.sheet}>
          {kpis.map((k, i) => (
            <View key={k.label} style={[styles.kpiRow, i > 0 && styles.rowRule]} accessible>
              <View style={styles.flex}>
                <Text style={[TYPE.bodyStrong, styles.ink]}>{k.label}</Text>
                <Text style={[TYPE.bodySmall, k.good ? styles.good : styles.muted]}>{k.note}</Text>
              </View>
              <Text style={[TYPE.title, styles.kpiValue]}>{k.value}</Text>
            </View>
          ))}
        </View>

        {/* Channel volume: bars built from Views */}
        <View style={styles.headRow}>
          <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.heading]}>
            Tickets by channel
          </Text>
          <Text style={[TYPE.numeric, styles.muted]}>{total} total</Text>
        </View>
        <View style={[styles.sheet, styles.chart]}>
          {channels.map((item) => (
            <View
              key={item.channel}
              accessible
              accessibilityLabel={`${item.channel}: ${item.count} tickets, ${item.percentage} percent`}
            >
              <View style={styles.barLabels}>
                <Text style={[TYPE.label, styles.ink]}>{item.channel}</Text>
                <Text style={[TYPE.numeric, styles.muted]}>
                  {item.count}
                  <Text style={styles.barPct}>{`  ${item.percentage}%`}</Text>
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { width: `${(item.count / maxCount) * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>

        {/* SLA policies */}
        <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.heading, styles.sectionGap]}>
          SLA policies
        </Text>
        <Text style={[TYPE.bodySmall, styles.muted, styles.headingNote]}>
          Clocks run in business hours, 09:00 to 18:00 UTC.
        </Text>
        <View style={styles.sheet}>
          {slaPolicies.map((p, i) => (
            <View key={p.name} style={[styles.policyRow, i > 0 && styles.rowRule]} accessible>
              <View style={styles.flex}>
                <Text style={[TYPE.bodyStrong, styles.ink]}>{p.name}</Text>
                <Text style={[TYPE.bodySmall, styles.muted]}>First response in {p.firstResponse}</Text>
                <Text style={[TYPE.bodySmall, styles.muted]}>Resolved in {p.resolution}</Text>
              </View>
              {p.atRisk > 0 ? (
                <View style={styles.flag}>
                  <Text style={[TYPE.label, styles.flagText]}>{p.atRisk} at risk</Text>
                </View>
              ) : (
                <View style={styles.ok}>
                  <Ionicons name="checkmark" size={16} color={COLORS.success} />
                  <Text style={[TYPE.label, styles.good]}>On target</Text>
                </View>
              )}
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
  ink: { color: COLORS.ink },
  muted: { color: COLORS.inkMuted },
  good: { color: COLORS.success },

  demo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  demoText: { flex: 1, color: COLORS.inkMuted },

  heading: { color: COLORS.ink },
  firstHeading: { marginTop: SPACING.xxl, marginBottom: SPACING.md },
  sectionGap: { marginTop: SPACING.xxxl },
  headingNote: { marginTop: 2, marginBottom: SPACING.md },
  headRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.md,
  },

  sheet: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
  },
  rowRule: { borderTopWidth: 1, borderTopColor: COLORS.rule },

  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 64,
  },
  kpiValue: { color: COLORS.ink },

  chart: { padding: SPACING.lg, gap: SPACING.lg },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.xs + 2,
  },
  barPct: { color: COLORS.inkFaint },
  barTrack: { height: 12 },
  // Series colour is violet; lemon is reserved for a bar that needs attention.
  bar: { height: 12, backgroundColor: COLORS.violet, borderRadius: RADIUS.xs },

  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  flag: {
    backgroundColor: COLORS.lemon,
    borderRadius: RADIUS.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  flagText: { color: COLORS.ink },
  ok: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
});
