import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { TicketCard } from '../components/tickets/TicketCard';

export const InboxScreen = ({ tickets, onSelectTicket, onNewTicket }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const channels = [
    { key: 'all', label: 'All Channels', icon: 'apps-outline' },
    { key: 'email', label: 'Email', icon: 'mail-outline' },
    { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
    { key: 'chat', label: 'Live Chat', icon: 'chatbubbles-outline' },
    { key: 'web', label: 'Web Form', icon: 'globe-outline' },
  ];

  const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'pending', label: 'Pending' },
    { key: 'resolved', label: 'Resolved' },
  ];

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Channel match
      if (selectedChannel !== 'all' && ticket.channel !== selectedChannel) {
        return false;
      }
      // Status match
      if (selectedStatus !== 'all' && ticket.status !== selectedStatus) {
        return false;
      }
      // Search match
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesSubject = ticket.subject.toLowerCase().includes(query);
        const matchesCustomer = ticket.customer.name.toLowerCase().includes(query);
        const matchesId = ticket.id.toLowerCase().includes(query);
        if (!matchesSubject && !matchesCustomer && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, selectedChannel, selectedStatus, searchQuery]);

  return (
    <View style={styles.container}>
      <Header title="SupportDesk AI" subtitle="Omnichannel Inbox" />

      {/* SLA & Quick Metrics Strip */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Open</Text>
          <Text style={styles.metricValue}>18</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pending</Text>
          <Text style={styles.metricValue}>6</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={[styles.metricCard, styles.alertMetricCard]}>
          <Text style={[styles.metricLabel, { color: '#B91C1C' }]}>At-Risk</Text>
          <Text style={[styles.metricValue, { color: '#B91C1C' }]}>2</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>CSAT</Text>
          <Text style={[styles.metricValue, { color: COLORS.success }]}>4.9★</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.secondaryText} style={styles.searchIcon} />
          <TextInput
            placeholder="Search tickets by ID, subject, customer..."
            placeholderTextColor={COLORS.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.input}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Channel Filters Scroll */}
      <View style={styles.channelsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.channelsScroll}
        >
          {channels.map((chan) => {
            const isSelected = selectedChannel === chan.key;
            return (
              <TouchableOpacity
                key={chan.key}
                activeOpacity={0.7}
                onPress={() => setSelectedChannel(chan.key)}
                style={[
                  styles.channelFilterChip,
                  {
                    backgroundColor: isSelected ? COLORS.primaryNavy : COLORS.white,
                    borderColor: isSelected ? COLORS.primaryNavy : COLORS.border,
                  },
                ]}
              >
                <Ionicons
                  name={chan.icon}
                  size={14}
                  color={isSelected ? COLORS.white : COLORS.secondaryText}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.channelFilterText,
                    { color: isSelected ? COLORS.white : COLORS.mainText },
                  ]}
                >
                  {chan.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Status Segmented Tabs */}
      <View style={styles.statusSection}>
        <View style={styles.statusSegment}>
          {statusFilters.map((st) => {
            const isSelected = selectedStatus === st.key;
            return (
              <TouchableOpacity
                key={st.key}
                activeOpacity={0.7}
                onPress={() => setSelectedStatus(st.key)}
                style={[
                  styles.statusTab,
                  isSelected && styles.statusTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    {
                      color: isSelected ? COLORS.white : COLORS.secondaryText,
                      fontWeight: isSelected ? TYPOGRAPHY.bold : TYPOGRAPHY.medium,
                    },
                  ]}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tickets List */}
      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TicketCard ticket={item} onPress={onSelectTicket} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="file-tray-outline" size={32} color={COLORS.secondaryText} />
            </View>
            <Text style={styles.emptyTitle}>No tickets found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search query or channel filters.
            </Text>
          </View>
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
  metricsContainer: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  alertMetricCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.sm,
    paddingVertical: 2,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginBottom: 2,
    fontWeight: TYPOGRAPHY.medium,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
  },
  channelsSection: {
    marginTop: SPACING.md,
  },
  channelsScroll: {
    paddingHorizontal: SPACING.lg,
  },
  channelFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  channelFilterText: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.medium,
  },
  statusSection: {
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
  },
  statusSegment: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    padding: 3,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  statusTabActive: {
    backgroundColor: COLORS.secondaryNavy,
  },
  statusTabText: {
    fontSize: TYPOGRAPHY.xs + 1,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.secondaryText,
    textAlign: 'center',
    maxWidth: 260,
  },
});
