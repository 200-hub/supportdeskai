import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { AppButton } from '../components/common/AppButton';
import { EmptyState } from '../components/common/EmptyState';
import { TicketCard } from '../components/tickets/TicketCard';

const channels = [
  { key: 'all', label: 'All channels', icon: 'apps-outline' },
  { key: 'email', label: 'Email', icon: 'mail-outline' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
  { key: 'chat', label: 'Live chat', icon: 'chatbubbles-outline' },
  { key: 'web', label: 'Web form', icon: 'globe-outline' },
];

const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'pending', label: 'Pending' },
  { key: 'resolved', label: 'Resolved' },
];

export const InboxScreen = ({ tickets = [], onSelectTicket, onNewTicket }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const counts = useMemo(
    () => ({
      open: tickets.filter((t) => t.status === 'open').length,
      pending: tickets.filter((t) => t.status === 'pending').length,
    }),
    [tickets]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (selectedChannel !== 'all' && ticket.channel !== selectedChannel) return false;
      if (selectedStatus !== 'all' && ticket.status !== selectedStatus) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        // Tickets created offline have no customer yet; guard every field.
        const matchesSubject = (ticket.subject || '').toLowerCase().includes(query);
        const matchesCustomer = (ticket.customer?.name || '').toLowerCase().includes(query);
        const matchesId = (ticket.id || '').toLowerCase().includes(query);
        if (!matchesSubject && !matchesCustomer && !matchesId) return false;
      }
      return true;
    });
  }, [tickets, selectedChannel, selectedStatus, searchQuery]);

  const hasFilters = searchQuery.trim() !== '' || selectedChannel !== 'all' || selectedStatus !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedChannel('all');
    setSelectedStatus('all');
  };

  const statusCount = {
    all: tickets.length,
    open: counts.open,
    pending: counts.pending,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  // One chip: same shape for status and channel filters, 48dp target.
  const renderChip = ({ key, label, icon, count, selected, onPress, a11y }) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={a11y}
      onPress={onPress}
      style={styles.chipTarget}
    >
      {({ pressed }) => (
        <View style={[styles.chip, selected && styles.chipSelected, pressed && !selected && styles.pressed]}>
          {icon ? (
            <Ionicons name={icon} size={16} color={selected ? COLORS.violetInk : COLORS.inkMuted} style={styles.chipIcon} />
          ) : null}
          <Text style={[TYPE.label, { color: selected ? COLORS.violetInk : COLORS.ink }]}>{label}</Text>
          {count !== undefined ? (
            <Text style={[TYPE.label, styles.chipCount, selected && { color: COLORS.violetInk }]}>{count}</Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );

  const header = (
    <View>
      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={COLORS.inkMuted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search tickets"
          placeholderTextColor={COLORS.inkFaint}
          selectionColor={COLORS.violet}
          accessibilityLabel="Search tickets"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.input}
        />
        {searchQuery.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setSearchQuery('')}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.inkMuted} />
          </Pressable>
        )}
      </View>

      {/* One filter row: status (with counts), then channel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {statusFilters.map((st) =>
          renderChip({
            key: st.key,
            label: st.label,
            count: statusCount[st.key],
            selected: selectedStatus === st.key,
            onPress: () => setSelectedStatus(st.key),
            a11y: `Status: ${st.label}, ${statusCount[st.key]}`,
          })
        )}
        <View style={styles.chipDivider} />
        {channels.map((chan) =>
          renderChip({
            key: `ch-${chan.key}`,
            label: chan.label,
            icon: chan.icon,
            selected: selectedChannel === chan.key,
            onPress: () => setSelectedChannel(chan.key),
            a11y: `Channel: ${chan.label}`,
          })
        )}
      </ScrollView>

      <View style={styles.listHead}>
        <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.listTitle]}>
          Tickets
        </Text>
        <Text style={[TYPE.numeric, styles.listCount]}>{filteredTickets.length}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Inbox"
        subtitle="Every channel in one list"
        rightAction={
          onNewTicket ? (
            <AppButton
              title="New ticket"
              size="sm"
              variant="primary"
              onPress={onNewTicket}
              icon={<Ionicons name="add" size={18} color={COLORS.ink} />}
              style={styles.newBtn}
            />
          ) : null
        }
      />

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TicketCard ticket={item} onPress={onSelectTicket} />}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          hasFilters ? (
            <EmptyState
              icon="search-outline"
              title="No tickets match"
              message="Nothing fits this search and these filters. Clear them to see the whole inbox."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <EmptyState
              icon="file-tray-outline"
              title="Inbox is empty"
              message="New tickets from email, WhatsApp, live chat and web forms land here."
              actionLabel={onNewTicket ? 'New ticket' : undefined}
              onAction={onNewTicket}
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  newBtn: { marginRight: SPACING.sm },
  listContent: {
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    minHeight: TOUCH,
    marginTop: 0,
  },
  searchIcon: { marginRight: SPACING.sm },
  input: { ...TYPE.body, flex: 1, color: COLORS.ink, paddingVertical: SPACING.md },
  clearBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },

  pressed: { backgroundColor: COLORS.groundDeep },

  // Channel chips
  chipScroll: { marginHorizontal: -SPACING.lg, marginTop: SPACING.xs },
  chipRow: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  chipTarget: { minHeight: TOUCH, justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.paper,
  },
  chipSelected: { backgroundColor: COLORS.violetWash, borderColor: COLORS.violetWash },
  chipIcon: { marginRight: SPACING.xs + 2 },
  chipCount: { color: COLORS.inkMuted, marginLeft: SPACING.sm },
  chipDivider: { width: 1, alignSelf: 'stretch', marginVertical: SPACING.md, backgroundColor: COLORS.ruleStrong },

  listHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  listTitle: { color: COLORS.ink },
  listCount: { color: COLORS.inkMuted },
});
