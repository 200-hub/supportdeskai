import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { TicketCard } from '../components/tickets/TicketCard';
import { EmptyState } from '../components/common/EmptyState';

export const MyTicketsScreen = ({
  tickets = [],
  initialFilter = 'all',
  onSelectTicket,
  onNavigateToCreateTicket,
  onNavigateBack,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialFilter);

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
        const matchId = t.id.toLowerCase().includes(query);
        const matchSubject = t.subject.toLowerCase().includes(query);
        const matchDesc = (t.description || '').toLowerCase().includes(query);
        return matchId || matchSubject || matchDesc;
      }
      return true;
    });
  }, [tickets, selectedStatus, search]);

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
          >
            <Ionicons name="add" size={18} color={COLORS.white} style={{ marginRight: 2 }} />
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
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips Row */}
      <View style={styles.chipsSection}>
        {filterChips.map((chip) => {
          const isSelected = selectedStatus === chip.key;
          const count =
            chip.key === 'all'
              ? tickets.length
              : tickets.filter((t) => t.status === chip.key).length;

          return (
            <TouchableOpacity
              key={chip.key}
              activeOpacity={0.7}
              onPress={() => setSelectedStatus(chip.key)}
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
      </View>

      {/* Tickets List */}
      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
    borderRadius: RADIUS.md,
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
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
    paddingBottom: SPACING.xxl,
  },
});
