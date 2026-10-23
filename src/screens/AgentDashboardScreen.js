import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { SummaryCard } from '../components/common/SummaryCard';
import { TicketCard } from '../components/tickets/TicketCard';
import { EmptyState } from '../components/common/EmptyState';

export const AgentDashboardScreen = ({
  user,
  tickets = [],
  onSelectTicket,
  onSwitchRole,
  onNavigateToNotifications,
  onNavigateBack,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('assigned'); // 'assigned', 'all', 'open', 'urgent'
  const [search, setSearch] = useState('');

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'open').length;
  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;
  const assignedToMeCount = tickets.filter((t) =>
    (t.assignedTo || '').toLowerCase().includes('sayoni') || (t.assignedTo || '').toLowerCase().includes('you')
  ).length;

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedFilter === 'assigned') {
        const isAssigned =
          (t.assignedTo || '').toLowerCase().includes('sayoni') ||
          (t.assignedTo || '').toLowerCase().includes('you');
        if (!isAssigned) return false;
      } else if (selectedFilter === 'open' && t.status !== 'open') {
        return false;
      } else if (selectedFilter === 'urgent' && t.priority !== 'urgent') {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const mId = t.id.toLowerCase().includes(q);
        const mSub = t.subject.toLowerCase().includes(q);
        const mCust = (t.customer?.name || '').toLowerCase().includes(q);
        return mId || mSub || mCust;
      }
      return true;
    });
  }, [tickets, selectedFilter, search]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Agent Workspace"
        subtitle={`Logged in as ${user?.name || 'Sayoni (Senior Support)'}`}
        showBack={!!onNavigateBack}
        onBack={onNavigateBack}
        rightAction={
          <View style={styles.headerRightRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onSwitchRole}
              style={styles.roleToggle}
            >
              <Ionicons name="swap-horizontal" size={13} color={COLORS.accentTeal} style={{ marginRight: 3 }} />
              <Text style={styles.roleToggleText}>Role: Agent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateToNotifications}
              style={styles.bellBtn}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {/* Metric Cards Row */}
        <View style={styles.metricsGrid}>
          <SummaryCard
            title="Assigned to Me"
            value={assignedToMeCount}
            icon="person"
            iconColor={COLORS.white}
            iconBg={COLORS.primaryNavy}
            subtitle="My primary queue"
            onPress={() => setSelectedFilter('assigned')}
            style={styles.cardSpacing}
          />
          <SummaryCard
            title="Open Tickets"
            value={openCount}
            icon="alert-circle-outline"
            iconColor="#1D4ED8"
            iconBg="#EFF6FF"
            subtitle="Require response"
            onPress={() => setSelectedFilter('open')}
            style={styles.cardSpacing}
          />
        </View>

        <View style={styles.metricsGrid}>
          <SummaryCard
            title="Pending Client"
            value={pendingCount}
            icon="time-outline"
            iconColor={COLORS.warning}
            iconBg="#FEF3C7"
            subtitle="Awaiting input"
            onPress={() => setSelectedFilter('all')}
            style={styles.cardSpacing}
          />
          <SummaryCard
            title="Resolved"
            value={resolvedCount}
            icon="checkmark-done"
            iconColor={COLORS.success}
            iconBg="#DCFCE7"
            subtitle="Target met"
            onPress={() => setSelectedFilter('all')}
            style={styles.cardSpacing}
          />
        </View>

        {/* SLA Escalation Bar */}
        <View style={styles.slaBanner}>
          <View style={styles.slaLeft}>
            <Ionicons name="warning" size={18} color="#DC2626" style={{ marginRight: SPACING.sm }} />
            <View>
              <Text style={styles.slaTitle}>2 Tickets Near SLA Breach (&lt; 20m)</Text>
              <Text style={styles.slaDesc}>First response target must be delivered.</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSelectedFilter('urgent')}
            style={styles.slaActionBtn}
          >
            <Text style={styles.slaActionText}>Filter P1</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Queue Segment Tabs */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.secondaryText} style={{ marginRight: SPACING.sm }} />
          <TextInput
            placeholder="Filter queue by ID, subject, customer..."
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

        {/* Queue Filter Segment */}
        <View style={styles.queueSegment}>
          {[
            { key: 'assigned', label: `My Queue (${assignedToMeCount})` },
            { key: 'open', label: `Open (${openCount})` },
            { key: 'urgent', label: 'Urgent (P1)' },
            { key: 'all', label: `All (${totalCount})` },
          ].map((tab) => {
            const isSelected = selectedFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.7}
                onPress={() => setSelectedFilter(tab.key)}
                style={[
                  styles.segmentTab,
                  isSelected && styles.segmentTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isSelected && styles.segmentTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tickets List */}
        <View style={styles.ticketListSection}>
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onPress={onSelectTicket}
              showCustomer={true}
            />
          ))}

          {filteredTickets.length === 0 && (
            <EmptyState
              icon="checkmark-circle-outline"
              title="Queue is completely clear"
              message="No tickets currently match this queue filter. Excellent job keeping response times optimal."
              actionLabel="Show All Tickets"
              onAction={() => setSelectedFilter('all')}
            />
          )}
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
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryNavy,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: SPACING.sm,
  },
  roleToggleText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.secondaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 2,
  },
  cardSpacing: {
    marginHorizontal: 3,
  },
  slaBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.sm,
  },
  slaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slaTitle: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.bold,
    color: '#991B1B',
  },
  slaDesc: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: '#B91C1C',
    marginTop: 1,
  },
  slaActionBtn: {
    backgroundColor: '#DC2626',
    borderRadius: RADIUS.xs,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  slaActionText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.bold,
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
    marginTop: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
  },
  queueSegment: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    padding: 3,
    marginVertical: SPACING.md,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  segmentTabActive: {
    backgroundColor: COLORS.primaryNavy,
  },
  segmentText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    fontWeight: TYPOGRAPHY.medium,
  },
  segmentTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.bold,
  },
  ticketListSection: {
    marginTop: SPACING.xs,
  },
});
