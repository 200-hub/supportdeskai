import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH, ELEVATION } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { AppButton } from '../components/common/AppButton';
import { TicketCard } from '../components/tickets/TicketCard';
import { EmptyState } from '../components/common/EmptyState';

const isAtRisk = (t) =>
  t.status !== 'resolved' &&
  t.status !== 'closed' &&
  (t.slaStatus === 'at-risk' || t.slaStatus === 'breached');

export const AgentDashboardScreen = ({
  user,
  tickets = [],
  onSelectTicket,
  onSwitchRole,
  onNavigateToNotifications,
  onNavigateBack,
  onUpdateTicket,
  onRefresh,
}) => {
  const [selectedFilter, setSelectedFilter] = useState('assigned'); // 'assigned', 'at-risk', 'unassigned', 'open', 'pending', 'resolved', 'urgent', 'all'
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [ticketToAssign, setTicketToAssign] = useState(null);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);

  const isAssignedToUser = (ticket) => {
    const assigned = (ticket.assignedTo || '').toLowerCase();
    const currentName = (user?.name || '').toLowerCase();
    if (!assigned) return false;
    if (assigned.includes('you')) return true;
    if (currentName) {
      if (assigned.includes(currentName)) return true;
      const firstName = currentName.split(' ')[0];
      if (firstName && firstName.length > 2 && assigned.includes(firstName)) return true;
    }
    return assigned.includes('sayoni');
  };

  const isTicketUnassigned = (ticket) => {
    const assigned = (ticket.assignedTo || '').trim().toLowerCase();
    return !assigned || assigned === 'auto-routing queue';
  };

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'open').length;
  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;
  const assignedToMeCount = tickets.filter(isAssignedToUser).length;
  const unassignedCount = tickets.filter(isTicketUnassigned).length;
  const urgentCount = tickets.filter((t) => t.priority === 'urgent').length;
  const atRiskCount = useMemo(() => tickets.filter(isAtRisk).length, [tickets]);

  const currentAgentName = user?.name ? `${user.name} (You)` : 'You (Current Agent)';
  const availableAgents = [
    currentAgentName,
    'Sayoni (Senior Support)',
    'Alex Mercer (L2 Infra)',
    'Marcus (Support)',
    'Auto-Routing Queue',
  ];

  // The name actually stored on the ticket for a picker entry.
  const toAssignee = (agentName) =>
    agentName.endsWith(' (You)')
      ? agentName.replace(' (You)', '')
      : agentName === 'You (Current Agent)'
      ? user?.name || 'You'
      : agentName;

  const selectFilter = (key) => {
    setSelectedFilter(key);
    setCurrentPage(1);
  };

  const handleOpenAssignModal = (ticket) => {
    setTicketToAssign(ticket);
    setIsAssignModalVisible(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalVisible(false);
    setTicketToAssign(null);
  };

  const handleSelectAssignee = (assignee) => {
    if (!ticketToAssign) return;
    const updated = {
      ...ticketToAssign,
      assignedTo: toAssignee(assignee),
      updatedAt: 'Just now',
    };

    if (onUpdateTicket) {
      onUpdateTicket(updated);
    } else {
      Alert.alert(
        'Assignment not saved',
        'This view cannot update tickets right now. Open the ticket and assign it from there.'
      );
    }

    handleCloseAssignModal();
  };

  const handleClaimTicket = (ticket) => {
    const myName = user?.name || 'You';
    const updated = {
      ...ticket,
      assignedTo: myName,
      updatedAt: 'Just now',
    };

    if (onUpdateTicket) {
      onUpdateTicket(updated);
    } else {
      Alert.alert(
        'Claim not saved',
        'This view cannot update tickets right now. Open the ticket and claim it from there.'
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTickets = useMemo(() => {
    const matches = tickets.filter((t) => {
      if (selectedFilter === 'assigned') {
        if (!isAssignedToUser(t)) return false;
      } else if (selectedFilter === 'unassigned') {
        if (!isTicketUnassigned(t)) return false;
      } else if (selectedFilter === 'at-risk') {
        if (!isAtRisk(t)) return false;
      } else if (selectedFilter === 'open' && t.status !== 'open') {
        return false;
      } else if (selectedFilter === 'pending' && t.status !== 'pending') {
        return false;
      } else if (selectedFilter === 'resolved' && t.status !== 'resolved') {
        return false;
      } else if (selectedFilter === 'urgent' && t.priority !== 'urgent') {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const mId = (t.id || '').toLowerCase().includes(q);
        const mSub = (t.subject || '').toLowerCase().includes(q);
        const mCust = (t.customer?.name || '').toLowerCase().includes(q);
        const mAssign = (t.assignedTo || '').toLowerCase().includes(q);
        return mId || mSub || mCust || mAssign;
      }
      return true;
    });
    // At-risk cards lead every view so they are never stranded on a later page.
    return [...matches.filter(isAtRisk), ...matches.filter((t) => !isAtRisk(t))];
  }, [tickets, selectedFilter, search, user?.name]);

  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTickets = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTickets, safeCurrentPage]);

  const filters = [
    { key: 'assigned', label: 'My queue', count: assignedToMeCount },
    { key: 'at-risk', label: 'At risk', count: atRiskCount, attention: atRiskCount > 0 },
    { key: 'unassigned', label: 'Unassigned', count: unassignedCount },
    { key: 'open', label: 'Open', count: openCount },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'resolved', label: 'Resolved', count: resolvedCount },
    { key: 'urgent', label: 'Urgent', count: urgentCount },
    { key: 'all', label: 'All', count: totalCount },
  ];
  const activeFilter = filters.find((f) => f.key === selectedFilter) || filters[0];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Queue"
        subtitle={user?.name ? `Signed in as ${user.name}` : undefined}
        showBack={false}
        rightAction={
          <>
            {onSwitchRole ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Switch role"
                onPress={onSwitchRole}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              >
                <Ionicons name="swap-horizontal" size={22} color={COLORS.ink} />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={onNavigateToNotifications}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.ink} />
            </Pressable>
          </>
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.violetInk]}
            tintColor={COLORS.violetInk}
          />
        }
      >
        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.inkMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search tickets"
            placeholderTextColor={COLORS.inkFaint}
            selectionColor={COLORS.violet}
            accessibilityLabel="Search the queue"
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.inkMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
        >
          {filters.map((f) => {
            const selected = selectedFilter === f.key;
            return (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${f.label}, ${f.count}`}
                onPress={() => selectFilter(f.key)}
                style={styles.chipTarget}
              >
                {({ pressed }) => (
                  <View
                    style={[
                      styles.chip,
                      selected && styles.chipSelected,
                      pressed && !selected && styles.chipPressed,
                    ]}
                  >
                    <Text style={[TYPE.label, selected ? styles.chipTextSelected : styles.chipText]}>
                      {f.label}
                    </Text>
                    <View style={[styles.chipCount, f.attention && styles.chipCountAttention]}>
                      <Text
                        style={[
                          TYPE.numeric,
                          styles.chipCountText,
                          { color: f.attention ? COLORS.ink : selected ? COLORS.violetInk : COLORS.inkMuted },
                        ]}
                      >
                        {f.count}
                      </Text>
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Ticket list */}
        <View style={styles.listHead}>
          <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.listTitle]}>
            {activeFilter.label}
          </Text>
          <Text style={[TYPE.numeric, styles.listCount]}>
            {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
          </Text>
        </View>

        {paginatedTickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onPress={onSelectTicket}
            showCustomer={true}
            showAssignee={true}
            onClaimTicket={handleClaimTicket}
            onAssignTicket={handleOpenAssignModal}
          />
        ))}

        {totalPages > 1 && (
          <View style={styles.pagination}>
            <AppButton
              title="Previous"
              variant="outline"
              size="sm"
              disabled={safeCurrentPage === 1}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              icon={
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={safeCurrentPage === 1 ? COLORS.inkFaint : COLORS.ink}
                />
              }
            />
            <Text style={[TYPE.numeric, styles.pageIndicator]}>
              Page {safeCurrentPage} of {totalPages}
            </Text>
            <AppButton
              title="Next"
              variant="outline"
              size="sm"
              iconPosition="right"
              disabled={safeCurrentPage === totalPages}
              onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              icon={
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={safeCurrentPage === totalPages ? COLORS.inkFaint : COLORS.ink}
                />
              }
            />
          </View>
        )}

        {filteredTickets.length === 0 && (
          <EmptyState
            icon="checkmark-done-outline"
            title={search.trim() ? 'No tickets match your search' : 'Nothing in this view'}
            message={
              search.trim()
                ? 'Check the ticket ID or name, or search across every ticket.'
                : 'No tickets match this filter right now.'
            }
            actionLabel="Show all tickets"
            onAction={() => {
              setSearch('');
              selectFilter('all');
            }}
          />
        )}
      </ScrollView>

      {/* Assign sheet */}
      <Modal
        visible={isAssignModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseAssignModal}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={handleCloseAssignModal}
            style={styles.scrim}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitles}>
                <Text accessibilityRole="header" style={[TYPE.title, styles.modalTitle]}>
                  Assign ticket
                </Text>
                {ticketToAssign ? (
                  <Text style={[TYPE.bodySmall, styles.modalSubtitle]} numberOfLines={2}>
                    <Text style={TYPE.numeric}>#{ticketToAssign.id}</Text>
                    {`  ${ticketToAssign.subject || ticketToAssign.title || ''}`}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={handleCloseAssignModal}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              >
                <Ionicons name="close" size={24} color={COLORS.ink} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {availableAgents.map((agentName, i) => {
                const isSelected =
                  (ticketToAssign?.assignedTo || '').toLowerCase() ===
                  toAssignee(agentName).toLowerCase();
                const isQueue = agentName === 'Auto-Routing Queue';

                return (
                  <Pressable
                    key={agentName}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Assign to ${agentName}`}
                    onPress={() => handleSelectAssignee(agentName)}
                    style={({ pressed }) => [
                      styles.agentOption,
                      i > 0 && styles.agentOptionRule,
                      isSelected && styles.agentOptionSelected,
                      pressed && !isSelected && styles.agentOptionPressed,
                    ]}
                  >
                    <Ionicons
                      name={isQueue ? 'git-network-outline' : 'person-outline'}
                      size={22}
                      color={isSelected ? COLORS.violetInk : COLORS.inkMuted}
                    />
                    <View style={styles.agentText}>
                      <Text style={[TYPE.bodyStrong, { color: isSelected ? COLORS.violetInk : COLORS.ink }]}>
                        {agentName}
                      </Text>
                      <Text style={[TYPE.bodySmall, styles.agentRole]}>
                        {isQueue ? 'Leave unassigned and let routing pick an agent' : 'Support team'}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark" size={22} color={COLORS.violetInk} />}
                  </Pressable>
                );
              })}
            </ScrollView>

            <AppButton
              title="Cancel"
              variant="ghost"
              onPress={handleCloseAssignModal}
              style={styles.modalCancel}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  iconBtn: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { backgroundColor: COLORS.groundDeep },
  scrollArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },


  // Search
  searchBox: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    paddingLeft: SPACING.md,
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { ...TYPE.body, flex: 1, color: COLORS.ink, paddingVertical: SPACING.md },
  clearBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },

  // Filter chips
  chipScroll: { marginHorizontal: -SPACING.lg, marginTop: SPACING.sm },
  chipRow: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  chipTarget: { minHeight: TOUCH, justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.paper,
  },
  chipSelected: { backgroundColor: COLORS.violetWash, borderColor: COLORS.violetWash },
  chipPressed: { backgroundColor: COLORS.groundDeep },
  chipText: { color: COLORS.ink },
  chipTextSelected: { color: COLORS.violetInk },
  chipCount: {
    minWidth: 22,
    height: 22,
    marginLeft: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCountAttention: { backgroundColor: COLORS.lemon },
  chipCountText: { fontSize: 12 },

  // List
  listHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  listTitle: { color: COLORS.ink },
  listCount: { color: COLORS.inkMuted },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  pageIndicator: { color: COLORS.inkMuted },

  // Assign dialog
  modalRoot: { flex: 1, justifyContent: 'center', padding: SPACING.lg },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.ink, opacity: 0.4 },
  modalContent: {
    maxHeight: '80%',
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    ...ELEVATION.raised,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: SPACING.xxl,
    paddingRight: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  modalTitles: { flex: 1, paddingTop: SPACING.md },
  modalTitle: { color: COLORS.ink },
  modalSubtitle: { color: COLORS.inkMuted, marginTop: SPACING.xs },
  modalList: { maxHeight: 340, borderTopWidth: 1, borderTopColor: COLORS.rule },
  agentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    minHeight: 64,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  agentOptionRule: { borderTopWidth: 1, borderTopColor: COLORS.rule },
  agentOptionSelected: { backgroundColor: COLORS.violetWash },
  agentOptionPressed: { backgroundColor: COLORS.groundDeep },
  agentText: { flex: 1 },
  agentRole: { color: COLORS.inkMuted, marginTop: 2 },
  modalCancel: { alignSelf: 'flex-end', marginTop: SPACING.sm, marginRight: SPACING.md },
});
