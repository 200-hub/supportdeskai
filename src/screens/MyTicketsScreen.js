import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
<<<<<<< HEAD
  ScrollView,
=======
  RefreshControl,
>>>>>>> 0b732f9ac4605d0f26e286a0f378ee378b0acd83
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { TicketCard } from '../components/tickets/TicketCard';
import { EmptyState } from '../components/common/EmptyState';

const ITEMS_PER_PAGE = 3;

export const MyTicketsScreen = ({
  tickets = [],
  initialFilter = 'all',
  onSelectTicket,
  onNavigateToCreateTicket,
  onNavigateBack,
  onRefresh,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setSelectedStatus(initialFilter || 'all');
    setCurrentPage(1);
  }, [initialFilter]);

  const filterChips = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'pending', label: 'Pending' },
    { key: 'resolved', label: 'Resolved' },
  ];

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedStatus !== 'all' && t.status !== selectedStatus) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchId = (t.id ? String(t.id).toLowerCase() : '').includes(query);
        const matchSubject = (t.subject ? String(t.subject).toLowerCase() : '').includes(query);
        const matchDesc = (t.description ? String(t.description).toLowerCase() : '').includes(query);
        return matchId || matchSubject || matchDesc;
      }
      return true;
    });
  }, [tickets, selectedStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTickets, currentPage]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);

    if (onRefresh) {
      Promise.resolve(onRefresh()).finally(() => {
        setRefreshing(false);
      });
    } else {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  }, [onRefresh]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Support Tickets"
        subtitle={`${tickets.length} total logged inquiries`}
        showBack={!!onNavigateBack}
        onBack={onNavigateBack}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onNavigateToCreateTicket}
            style={styles.newTicketHeaderBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Ionicons name="add" size={17} color={COLORS.white} style={{ marginRight: 2 }} />
            <Text style={styles.newTicketHeaderBtnText}>New Ticket</Text>
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.secondaryText} style={{ marginRight: SPACING.sm }} />
          <TextInput
            placeholder="Search tickets by ID, subject, or keywords..."
            placeholderTextColor={COLORS.secondaryText}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearch('');
              setCurrentPage(1);
            }}>
              <Ionicons name="close-circle" size={18} color={COLORS.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips Row (Horizontal Scroll to prevent overflow on narrow Android devices) */}
      <View style={styles.chipsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {filterChips.map((chip) => {
            const isSelected = selectedStatus === chip.key;
            const count =
              chip.key === 'all'
                ? tickets.length
                : tickets.filter((t) => t.status === chip.key).length;

<<<<<<< HEAD
            return (
              <TouchableOpacity
                key={chip.key}
                activeOpacity={0.7}
                onPress={() => setSelectedStatus(chip.key)}
=======
          return (
            <TouchableOpacity
              key={chip.key}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedStatus(chip.key);
                setCurrentPage(1);
              }}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
              ]}
            >
              <Text
>>>>>>> 0b732f9ac4605d0f26e286a0f378ee378b0acd83
                style={[
                  styles.chip,
                  isSelected ? styles.chipSelected : styles.chipUnselected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? COLORS.white : COLORS.mainText },
                  ]}
                >
                  {chip.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tickets List */}
      <FlatList
        data={paginatedTickets}
        keyExtractor={(item) => item.id}
<<<<<<< HEAD
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 72 },
        ]}
=======
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primaryNavy}
            colors={[COLORS.primaryNavy, COLORS.accentTeal]}
          />
        }
>>>>>>> 0b732f9ac4605d0f26e286a0f378ee378b0acd83
        renderItem={({ item }) => (
          <TicketCard
            ticket={item}
            onPress={onSelectTicket}
            showCustomer={false}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="ticket-outline"
            title="No tickets found"
            message={`No tickets match the "${selectedStatus}" filter. You can create a new ticket anytime.`}
            actionLabel="Create New Ticket"
            onAction={onNavigateToCreateTicket}
          />
        }
        ListFooterComponent={
          filteredTickets.length > 0 ? (
            <View style={styles.paginationContainer}>
              <Text style={styles.paginationInfo}>
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredTickets.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTickets.length)} of {filteredTickets.length} tickets
              </Text>
              <View style={styles.paginationControls}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={[
                    styles.pageBtn,
                    currentPage === 1 && styles.pageBtnDisabled,
                  ]}
                >
                  <Ionicons
                    name="chevron-back"
                    size={16}
                    color={currentPage === 1 ? COLORS.secondaryText : COLORS.primaryNavy}
                  />
                  <Text
                    style={[
                      styles.pageBtnText,
                      currentPage === 1 && styles.pageBtnTextDisabled,
                    ]}
                  >
                    Prev
                  </Text>
                </TouchableOpacity>

                <View style={styles.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isActive = pageNum === currentPage;
                    return (
                      <TouchableOpacity
                        key={pageNum}
                        activeOpacity={0.7}
                        onPress={() => setCurrentPage(pageNum)}
                        style={[
                          styles.pageNumPill,
                          isActive ? styles.pageNumPillActive : styles.pageNumPillInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pageNumText,
                            isActive ? styles.pageNumTextActive : styles.pageNumTextInactive,
                          ]}
                        >
                          {pageNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={[
                    styles.pageBtn,
                    currentPage === totalPages && styles.pageBtnDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageBtnText,
                      currentPage === totalPages && styles.pageBtnTextDisabled,
                    ]}
                  >
                    Next
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={currentPage === totalPages ? COLORS.secondaryText : COLORS.primaryNavy}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  newTicketHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentTeal,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
  },
  newTicketHeaderBtnText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.bold,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
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
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
  },
  chipsSection: {
    paddingVertical: SPACING.md,
  },
  chipsScroll: {
    paddingHorizontal: SPACING.lg,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  chipSelected: {
    backgroundColor: COLORS.primaryNavy,
    borderColor: COLORS.primaryNavy,
  },
  chipUnselected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
  },
  paginationContainer: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.secondaryText,
    fontWeight: TYPOGRAPHY.medium,
    marginBottom: SPACING.md,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageBtnDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.lightBg,
    borderColor: COLORS.border,
  },
  pageBtnText: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.primaryNavy,
  },
  pageBtnTextDisabled: {
    color: COLORS.secondaryText,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  pageNumPill: {
    minWidth: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
  },
  pageNumPillActive: {
    backgroundColor: COLORS.primaryNavy,
    borderColor: COLORS.primaryNavy,
  },
  pageNumPillInactive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  pageNumText: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  pageNumTextActive: {
    color: COLORS.white,
  },
  pageNumTextInactive: {
    color: COLORS.mainText,
  },
});
