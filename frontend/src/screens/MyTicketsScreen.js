import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { TicketCard } from '../components/tickets/TicketCard';
import { EmptyState } from '../components/common/EmptyState';
import { AppButton } from '../components/common/AppButton';

const ITEMS_PER_PAGE = 3;

const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'pending', label: 'Pending' },
  { key: 'resolved', label: 'Resolved' },
];

export const MyTicketsScreen = ({
  tickets = [],
  initialFilter = 'all',
  onSelectTicket,
  onNavigateToCreateTicket,
  onNavigateBack,
  onRefresh,
}) => {
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

  const rangeStart = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredTickets.length);
  const rangeEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredTickets.length);
  const goToPage = (n) => setCurrentPage(Math.min(totalPages, Math.max(1, n)));

  const emptyMessage = search.trim()
    ? `No tickets match “${search.trim()}”. Try another word or clear the search.`
    : selectedStatus === 'all'
    ? 'You haven’t raised a ticket yet. Create one and the team will get back to you.'
    : `You have no ${selectedStatus} tickets right now.`;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My tickets"
        subtitle={`${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'}`}
        showBack={!!onNavigateBack}
        onBack={onNavigateBack}
        rightAction={
          onNavigateToCreateTicket ? (
            <AppButton
              title="New ticket"
              size="sm"
              variant="primary"
              onPress={onNavigateToCreateTicket}
              icon={<Ionicons name="add" size={18} color={COLORS.ink} />}
              style={styles.headerBtn}
            />
          ) : null
        }
      />

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.inkMuted} style={styles.searchIcon} />
          <TextInput
            accessibilityLabel="Search your tickets"
            placeholder="Search by number, subject or words"
            placeholderTextColor={COLORS.inkFaint}
            selectionColor={COLORS.violet}
            cursorColor={COLORS.violetInk}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          />
          {search.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              style={styles.clearBtn}
            >
              <Ionicons name="close" size={20} color={COLORS.inkMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {FILTER_CHIPS.map((chip) => {
          const isSelected = selectedStatus === chip.key;
          const count =
            chip.key === 'all'
              ? tickets.length
              : tickets.filter((t) => t.status === chip.key).length;

          return (
            <Pressable
              key={chip.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${chip.label}, ${count}`}
              hitSlop={4}
              onPress={() => {
                setSelectedStatus(chip.key);
                setCurrentPage(1);
              }}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.pressed,
              ]}
            >
              <Text style={[TYPE.label, { color: isSelected ? COLORS.violetInk : COLORS.ink }]}>
                {chip.label}
              </Text>
              <Text style={[TYPE.numeric, { color: isSelected ? COLORS.violetInk : COLORS.inkMuted }]}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={paginatedTickets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.violetInk}
            colors={[COLORS.violetInk]}
            progressBackgroundColor={COLORS.paper}
          />
        }
        renderItem={({ item }) => (
          <TicketCard ticket={item} onPress={onSelectTicket} showCustomer={false} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="ticket-outline"
            title={search.trim() ? 'No matches' : 'No tickets here'}
            message={emptyMessage}
            actionLabel="Create ticket"
            onAction={onNavigateToCreateTicket}
          />
        }
        ListFooterComponent={
          filteredTickets.length > 0 && totalPages > 1 ? (
            <View style={styles.pagination}>
              <Text style={[TYPE.bodySmall, styles.paginationInfo]}>
                Showing <Text style={TYPE.numeric}>{rangeStart}–{rangeEnd}</Text> of{' '}
                <Text style={TYPE.numeric}>{filteredTickets.length}</Text>
              </Text>
              <View style={styles.paginationControls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous page"
                  accessibilityState={{ disabled: currentPage === 1 }}
                  disabled={currentPage === 1}
                  onPress={() => goToPage(currentPage - 1)}
                  style={({ pressed }) => [styles.pageBtn, pressed && styles.pressed]}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={currentPage === 1 ? COLORS.ruleStrong : COLORS.ink}
                  />
                </Pressable>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isActive = pageNum === currentPage;
                  return (
                    <Pressable
                      key={pageNum}
                      accessibilityRole="button"
                      accessibilityLabel={`Page ${pageNum}`}
                      accessibilityState={{ selected: isActive }}
                      onPress={() => goToPage(pageNum)}
                      style={({ pressed }) => [
                        styles.pageBtn,
                        isActive && styles.pageBtnActive,
                        pressed && !isActive && styles.pressed,
                      ]}
                    >
                      <Text style={[TYPE.numeric, { color: isActive ? COLORS.violetInk : COLORS.ink }]}>
                        {pageNum}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next page"
                  accessibilityState={{ disabled: currentPage === totalPages }}
                  disabled={currentPage === totalPages}
                  onPress={() => goToPage(currentPage + 1)}
                  style={({ pressed }) => [styles.pageBtn, pressed && styles.pressed]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={currentPage === totalPages ? COLORS.ruleStrong : COLORS.ink}
                  />
                </Pressable>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  headerBtn: { marginRight: SPACING.sm },
  pressed: { backgroundColor: COLORS.groundDeep },

  searchSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  searchBox: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    paddingLeft: SPACING.md,
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { ...TYPE.body, flex: 1, color: COLORS.ink, paddingVertical: SPACING.sm, outlineStyle: 'none' },
  clearBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },

  chipsScroll: { flexGrow: 0 },
  chipsRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 40,
    paddingHorizontal: SPACING.md + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.paper,
  },
  chipSelected: { backgroundColor: COLORS.violetWash, borderColor: COLORS.violetWash },

  listContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, paddingBottom: SPACING.xxl },

  pagination: { marginTop: SPACING.md, alignItems: 'center' },
  paginationInfo: { color: COLORS.inkMuted, marginBottom: SPACING.sm },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  pageBtn: {
    minWidth: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnActive: { backgroundColor: COLORS.violetWash },
});
