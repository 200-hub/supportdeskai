import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ANALYTICS_METRICS } from '../data/mockData';

export const AnalyticsScreen = () => {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Performance & SLA" subtitle="Omnichannel Metrics Dashboard" />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Top 2x2 Metric Grid */}
        <View style={styles.gridRow}>
          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.gridLabel}>First Response Time</Text>
              <Ionicons name="timer-outline" size={16} color={COLORS.secondaryNavy} />
            </View>
            <Text style={styles.gridValue}>{ANALYTICS_METRICS.avgFirstResponseTime}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.successPill}>
                <Ionicons name="arrow-down" size={10} color={COLORS.success} />
                <Text style={styles.pillText}>-18% vs last week</Text>
              </View>
            </View>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.gridLabel}>SLA Compliance</Text>
              <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
            </View>
            <Text style={[styles.gridValue, { color: COLORS.success }]}>
              {ANALYTICS_METRICS.slaComplianceRate}
            </Text>
            <View style={styles.badgeRow}>
              <Text style={styles.targetNote}>Target: &gt; 95.0%</Text>
            </View>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.gridLabel}>Avg Resolution Time</Text>
              <Ionicons name="checkmark-done-circle-outline" size={16} color={COLORS.secondaryNavy} />
            </View>
            <Text style={styles.gridValue}>{ANALYTICS_METRICS.avgResolutionTime}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.targetNote}>Target: &lt; 2h</Text>
            </View>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.gridLabel}>CSAT Satisfaction</Text>
              <Ionicons name="star" size={16} color="#EAB308" />
            </View>
            <Text style={[styles.gridValue, { color: COLORS.mainText }]}>
              {ANALYTICS_METRICS.csatScore} <Text style={{ fontSize: 13, color: COLORS.secondaryText }}>/ 5.0</Text>
            </Text>
            <View style={styles.badgeRow}>
              <Text style={styles.targetNote}>{ANALYTICS_METRICS.csatTotalReviews} ratings</Text>
            </View>
          </View>
        </View>

        {/* Omnichannel Volume Breakdown */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Channel Ticket Distribution</Text>
            <Text style={styles.totalBadge}>113 total</Text>
          </View>

          {ANALYTICS_METRICS.channelBreakdown.map((item, idx) => (
            <View key={idx} style={styles.channelRow}>
              <View style={styles.channelInfo}>
                <Text style={styles.channelName}>{item.channel}</Text>
                <Text style={styles.channelCount}>
                  {item.count} tickets ({item.percentage}%)
                </Text>
              </View>
              {/* Solid Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* SLA Escalation Policy Status */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Active SLA Policy Queues</Text>
          <Text style={styles.sectionSubtitle}>
            Calibrated on standard business calendar (09:00 - 18:00 UTC)
          </Text>

          <View style={styles.slaPolicyRow}>
            <View style={styles.slaPolicyLeft}>
              <Text style={styles.slaPolicyName}>Urgent (P1) Incidents</Text>
              <Text style={styles.slaPolicyTarget}>15 min first response • 2h resolution</Text>
            </View>
            <View style={styles.statusPillAlert}>
              <Text style={styles.statusPillAlertText}>2 At-Risk</Text>
            </View>
          </View>

          <View style={styles.slaPolicyRow}>
            <View style={styles.slaPolicyLeft}>
              <Text style={styles.slaPolicyName}>High (P2) Inquiries</Text>
              <Text style={styles.slaPolicyTarget}>1h first response • 6h resolution</Text>
            </View>
            <View style={styles.statusPillOk}>
              <Text style={styles.statusPillOkText}>On Target</Text>
            </View>
          </View>

          <View style={styles.slaPolicyRow}>
            <View style={styles.slaPolicyLeft}>
              <Text style={styles.slaPolicyName}>Normal (P3/P4) Support</Text>
              <Text style={styles.slaPolicyTarget}>4h first response • 24h resolution</Text>
            </View>
            <View style={styles.statusPillOk}>
              <Text style={styles.statusPillOkText}>On Target</Text>
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
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginHorizontal: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  gridLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    fontWeight: TYPOGRAPHY.medium,
  },
  gridValue: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    marginVertical: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  pillText: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.semiBold,
    marginLeft: 2,
  },
  targetNote: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    marginBottom: SPACING.md,
  },
  totalBadge: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    backgroundColor: COLORS.lightBg,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.xs,
  },
  channelRow: {
    marginBottom: SPACING.md,
  },
  channelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  channelName: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.mainText,
  },
  channelCount: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  slaPolicyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  slaPolicyLeft: {
    flex: 1,
  },
  slaPolicyName: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
  },
  slaPolicyTarget: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  statusPillAlert: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  statusPillAlertText: {
    fontSize: TYPOGRAPHY.xs,
    color: '#B91C1C',
    fontWeight: TYPOGRAPHY.bold,
  },
  statusPillOk: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  statusPillOkText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.semiBold,
  },
});
