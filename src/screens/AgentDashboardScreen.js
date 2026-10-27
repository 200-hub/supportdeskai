import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  onUpdateTicket,
  onRefresh,
}) => {
  const [selectedFilter, setSelectedFilter] = useState('assigned'); // 'assigned', 'unassigned', 'open', 'pending', 'resolved', 'urgent', 'all'
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

  const atRiskTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (t.status === 'resolved' || t.status === 'closed') return false;
      return t.slaStatus === 'at-risk';
    });
  }, [tickets]);

  const atRiskCount = atRiskTickets.length;

  const currentAgentName = user?.name ? `${user.name} (You)` : 'You (Current Agent)';
  const availableAgents = [
    currentAgentName,
    'Sayoni (Senior Support)',
    'Alex Mercer (L2 Infra)',
    'Marcus (Support)',
    'Auto-Routing Queue',
  ];

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
    const cleanAssignee = assignee.endsWith(' (You)')
      ? assignee.replace(' (You)', '')
      : assignee === 'You (Current Agent)'
      ? (user?.name || 'You')
      : assignee;

    const updated = {
      ...ticketToAssign,
      assignedTo: cleanAssignee,
      updatedAt: 'Just now',
    };

    if (onUpdateTicket) {
      onUpdateTicket(updated);
    } else {
      Alert.alert(
        'Assignment Unavailable',
        'Ticket assignment updates cannot be saved because onUpdateTicket is not available.'
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
        'Claim Unavailable',
        'Ticket claim cannot be saved because onUpdateTicket is not available.'
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
    return tickets.filter((t) => {
      if (selectedFilter === 'assigned') {
        if (!isAssignedToUser(t)) return false;
      } else if (selectedFilter === 'unassigned') {
        if (!isTicketUnassigned(t)) return false;
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
  }, [tickets, selectedFilter, search, user?.name]);

  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTickets = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTickets, safeCurrentPage]);

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
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primaryNavy, COLORS.accentTeal]}
            tintColor={COLORS.primaryNavy}
          />
        }
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
            onPress={() => {
              setSelectedFilter('assigned');
              setCurrentPage(1);
            }}
            style={styles.cardSpacing}
          />
          <SummaryCard
            title="Open Tickets"
            value={openCount}
            icon="alert-circle-outline"
            iconColor="#1D4ED8"
            iconBg="#EFF6FF"
            subtitle="Require response"
            onPress={() => {
              setSelectedFilter('open');
              setCurrentPage(1);
            }}
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
            onPress={() => {
              setSelectedFilter('pending');
              setCurrentPage(1);
            }}
            style={styles.cardSpacing}
          />
          <SummaryCard
            title="Resolved"
            value={resolvedCount}
            icon="checkmark-done"
            iconColor={COLORS.success}
            iconBg="#DCFCE7"
            subtitle="Target met"
            onPress={() => {
              setSelectedFilter('resolved');
              setCurrentPage(1);
            }}
            style={styles.cardSpacing}
          />
        </View>

        {/* SLA Escalation Bar */}
        {atRiskCount > 0 && (
          <View style={styles.slaBanner}>
            <View style={styles.slaLeft}>
              <Ionicons name="warning" size={18} color="#DC2626" style={{ marginRight: SPACING.sm }} />
              <View>
                <Text style={styles.slaTitle}>
                  {`${atRiskCount} ${atRiskCount === 1 ? 'Ticket' : 'Tickets'} Near SLA Breach`}
                </Text>
                <Text style={styles.slaDesc}>
                  First response target must be delivered immediately.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setSelectedFilter('urgent');
                setCurrentPage(1);
              }}
              style={styles.slaActionBtn}
            >
              <Text style={styles.slaActionText}>Filter P1</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search & Queue Segment Tabs */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.secondaryText} style={{ marginRight: SPACING.sm }} />
          <TextInput
            placeholder="Filter queue by ID, subject, customer..."
            placeholderTextColor={COLORS.secondaryText}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                setCurrentPage(1);
              }}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.secondaryText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Queue Filter Segment */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.queueSegmentScroll}
        >
          <View style={styles.queueSegment}>
            {[
              { key: 'assigned', label: `My Queue (${assignedToMeCount})` },
              { key: 'unassigned', label: `Unassigned (${unassignedCount})` },
              { key: 'open', label: `Open (${openCount})` },
              { key: 'pending', label: `Pending (${pendingCount})` },
              { key: 'resolved', label: `Resolved (${resolvedCount})` },
              { key: 'urgent', label: 'Urgent (P1)' },
              { key: 'all', label: `All (${totalCount})` },
            ].map((tab) => {
              const isSelected = selectedFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedFilter(tab.key);
                    setCurrentPage(1);
                  }}
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
        </ScrollView>

        {/* Tickets List */}
        <View style={styles.ticketListSection}>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                style={[
                  styles.pageButton,
                  safeCurrentPage === 1 && styles.pageButtonDisabled,
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={14}
                  color={safeCurrentPage === 1 ? COLORS.secondaryText : COLORS.primaryNavy}
                />
                <Text
                  style={[
                    styles.pageButtonText,
                    safeCurrentPage === 1 && styles.pageButtonTextDisabled,
                  ]}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageIndicator}>
                Page {safeCurrentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                style={[
                  styles.pageButton,
                  safeCurrentPage === totalPages && styles.pageButtonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.pageButtonText,
                    safeCurrentPage === totalPages && styles.pageButtonTextDisabled,
                  ]}
                >
                  Next
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={safeCurrentPage === totalPages ? COLORS.secondaryText : COLORS.primaryNavy}
                />
              </TouchableOpacity>
            </View>
          )}

          {filteredTickets.length === 0 && (
            <EmptyState
              icon="checkmark-circle-outline"
              title="Queue is completely clear"
              message="No tickets currently match this queue filter. Excellent job keeping response times optimal."
              actionLabel="Show All Tickets"
              onAction={() => {
                setSelectedFilter('all');
                setCurrentPage(1);
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Assignee Selection Modal */}
      <Modal
        visible={isAssignModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseAssignModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseAssignModal}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign Ticket</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {ticketToAssign ? `#${ticketToAssign.id} - ${ticketToAssign.subject || ticketToAssign.title}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseAssignModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={COLORS.secondaryText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionLabel}>SELECT AGENT OR QUEUE</Text>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {availableAgents.map((agentName) => {
                const isSelected =
                  (ticketToAssign?.assignedTo || '').toLowerCase() === agentName.toLowerCase();
                const isQueue = agentName === 'Auto-Routing Queue';

                return (
                  <TouchableOpacity
                    key={agentName}
                    style={[styles.agentOption, isSelected && styles.agentOptionSelected]}
                    onPress={() => handleSelectAssignee(agentName)}
                  >
                    <View style={styles.agentOptionLeft}>
                      <View style={[styles.agentAvatar, isQueue && styles.queueAvatar]}>
                        <Ionicons
                          name={isQueue ? 'git-network-outline' : 'person-outline'}
                          size={16}
                          color={isQueue ? COLORS.warning : COLORS.primaryNavy}
                        />
                      </View>
                      <View>
                        <Text style={[styles.agentName, isSelected && styles.agentNameSelected]}>
                          {agentName}
                        </Text>
                        <Text style={styles.agentRole}>
                          {isQueue ? 'Unassigned / Global routing' : 'Support Team Member'}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primaryNavy} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.modalCancelButton} onPress={handleCloseAssignModal}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  queueSegmentScroll: {
    marginVertical: SPACING.md,
  },
  queueSegment: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    padding: 3,
  },
  segmentTab: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 4,
  },
  pageButtonDisabled: {
    opacity: 0.4,
    backgroundColor: '#F1F5F9',
  },
  pageButtonText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.primaryNavy,
  },
  pageButtonTextDisabled: {
    color: COLORS.secondaryText,
  },
  pageIndicator: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    fontWeight: TYPOGRAPHY.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 2,
    maxWidth: 240,
  },
  modalSectionLabel: {
    fontSize: TYPOGRAPHY.xs - 1,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.secondaryText,
    letterSpacing: 0.5,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  modalList: {
    maxHeight: 280,
  },
  agentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    marginVertical: 2,
  },
  agentOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  agentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueAvatar: {
    backgroundColor: '#FEF3C7',
  },
  agentName: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
  },
  agentNameSelected: {
    color: COLORS.primaryNavy,
    fontWeight: TYPOGRAPHY.bold,
  },
  agentRole: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
  },
  modalCancelButton: {
    marginTop: SPACING.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.secondaryText,
  },
});
