import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { ChatBubble } from '../components/common/ChatBubble';

export const TicketDetailsScreen = ({
  ticket,
  user,
  onNavigateBack,
  onUpdateTicket,
}) => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState(ticket?.messages || []);
  const [replyText, setReplyText] = useState('');
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(ticket?.status || 'open');
<<<<<<< HEAD
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
=======
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (ticket) {
      setMessages(ticket.messages || []);
      setTicketStatus(ticket.status || 'open');
      setReplyText('');
    }
  }, [ticket?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length]);
>>>>>>> 0b732f9ac4605d0f26e286a0f378ee378b0acd83

  const handleSendReply = () => {
    if (!replyText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderType: isNoteMode ? 'internal_note' : user?.role === 'agent' ? 'agent' : 'customer',
      senderName: isNoteMode
        ? `${user?.name || 'You'} (Internal Note)`
        : user?.name || 'Sarah Connor',
      time: 'Just now',
      content: replyText.trim(),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setReplyText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 60);

    if (onUpdateTicket) {
      onUpdateTicket({
        ...ticket,
        messages: updatedMessages,
        status: ticketStatus,
        updatedAt: 'Just now',
      });
    }
  };

  const handleToggleStatus = () => {
    const nextStatus =
      ticketStatus === 'open' ? 'pending' : ticketStatus === 'pending' ? 'resolved' : 'open';
    setTicketStatus(nextStatus);
    if (onUpdateTicket) {
      onUpdateTicket({
        ...ticket,
        status: nextStatus,
      });
    }
  };

  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'admin';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={`#${ticket.id}`}
        subtitle={ticket.category || 'Customer Inquiry'}
        showBack
        onBack={onNavigateBack}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={isAgentOrAdmin ? handleToggleStatus : undefined}
            style={styles.statusChipBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <StatusBadge status={ticketStatus} size="sm" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
<<<<<<< HEAD
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
=======
>>>>>>> 0b732f9ac4605d0f26e286a0f378ee378b0acd83
      >
        {/* Ticket Header & Metadata Card */}
        <View style={styles.metaCard}>
          <View style={styles.badgesRow}>
            <StatusBadge status={ticketStatus} />
            <View style={{ width: 6 }} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText} numberOfLines={1}>
                  {ticket.category}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.subject}>{ticket.subject}</Text>

          <View style={styles.divider} />

          <Text style={styles.descLabel}>Problem Statement</Text>
          <Text style={styles.description}>
            {ticket.description || (ticket.messages && ticket.messages[0]?.content) || 'No detailed description.'}
          </Text>

          <View style={styles.divider} />

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailKey}>Created</Text>
              <Text style={styles.detailVal}>{ticket.createdDate || 'Oct 15, 2026'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailKey}>Last Update</Text>
              <Text style={styles.detailVal}>{ticket.updatedAt || 'Recent'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailKey}>Assigned Agent</Text>
              <Text style={styles.detailVal} numberOfLines={1}>
                {ticket.assignedTo || 'Sayoni (Senior Support)'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailKey}>SLA Target</Text>
              <Text
                style={[
                  styles.detailVal,
                  { color: ticket.slaStatus === 'at-risk' ? COLORS.error : COLORS.success },
                ]}
              >
                {ticket.slaRemaining ? `${ticket.slaRemaining} remaining` : 'Resolved'}
              </Text>
            </View>
          </View>

          {/* Attachments (if any attached on ticket creation) */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              <View style={styles.divider} />
              <Text style={styles.descLabel}>Attachments ({ticket.attachments.length})</Text>
              <View style={styles.attachmentsWrap}>
                {ticket.attachments.map((file, idx) => (
                  <View key={idx} style={styles.attachmentChip}>
                    <Ionicons name="document-attach-outline" size={13} color={COLORS.primaryNavy} style={{ marginRight: 4 }} />
                    <Text style={styles.attachmentChipText} numberOfLines={1}>{file}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Audit Timeline */}
        {ticket.timeline && ticket.timeline.length > 0 && (
          <View style={styles.timelineCard}>
            <Text style={styles.sectionHeading}>Ticket Lifecycle Events</Text>
            {ticket.timeline.map((event, index) => (
              <View key={event.id || index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineTitle}>{event.title}</Text>
                    <Text style={styles.timelineTime}>{event.time}</Text>
                  </View>
                  <Text style={styles.timelineBy}>By: {event.by}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Message Thread */}
        <View style={styles.threadSection}>
<<<<<<< HEAD
          <Text style={styles.sectionHeading}>Conversation Thread</Text>
          {messages.map((item) => {
            const isUserSender =
              user?.role === 'customer'
                ? item.senderType === 'customer'
                : item.senderType === 'agent';

            return (
              <ChatBubble
                key={item.id}
                senderType={item.senderType}
                senderName={item.senderName}
                message={item.content}
                timestamp={item.time}
                isOutgoing={isUserSender}
              />
            );
          })}
=======
          <Text style={styles.sectionHeading}>Conversation History</Text>
          {messages.map((item) => (
            <ChatBubble
              key={item.id}
              senderType={item.senderType}
              senderName={item.senderName}
              message={item.content}
              timestamp={item.time}
              isOutgoing={
                user?.role === 'agent'
                  ? item.senderType === 'agent'
                  : item.senderType === 'customer'
              }
            />
          ))}
>>>>>>> 0b732f9ac4605d0f26e286a0f378ee378b0acd83
        </View>
      </ScrollView>

      {/* Reply Composer Bar */}
<<<<<<< HEAD
      <View
        style={[
          styles.composerContainer,
          {
            paddingBottom: isKeyboardVisible ? 8 : Math.max(insets.bottom, 12),
          },
        ]}
      >
=======
      <View style={styles.composerContainer}>
        {/* AI Smart Draft Action */}
        {ticket?.aiSmartDraft ? (
          <View style={styles.aiDraftRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setReplyText(ticket.aiSmartDraft)}
              style={styles.aiDraftBtn}
            >
              <Ionicons name="sparkles" size={13} color={COLORS.accentTeal} style={{ marginRight: 4 }} />
              <Text style={styles.aiDraftBtnText}>Use AI Draft</Text>
            </TouchableOpacity>
            <Text style={styles.aiDraftPreview} numberOfLines={1}>
              {ticket.aiSmartDraft}
            </Text>
          </View>
        ) : null}

>>>>>>> 0b732f9ac4605d0f26e286a0f378ee378b0acd83
        {/* If agent/admin, show Internal Note toggle */}
        {isAgentOrAdmin && (
          <View style={styles.modeTabs}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsNoteMode(false)}
              style={[styles.modeTab, !isNoteMode && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, !isNoteMode && styles.modeTabTextActive]}>
                Public Customer Reply
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsNoteMode(true)}
              style={[styles.modeTab, isNoteMode && styles.modeTabNoteActive]}
            >
              <Ionicons name="lock-closed" size={11} color={isNoteMode ? '#92400E' : COLORS.secondaryText} style={{ marginRight: 3 }} />
              <Text style={[styles.modeTabText, isNoteMode && { color: '#92400E', fontWeight: TYPOGRAPHY.bold }]}>
                Internal Team Note
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.inputRow,
            isNoteMode && { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
          ]}
        >
          <TextInput
            multiline
            placeholder={
              isNoteMode
                ? 'Type an internal note visible only to support agents...'
                : 'Type your message or response to this ticket...'
            }
            placeholderTextColor={COLORS.secondaryText}
            value={replyText}
            onChangeText={setReplyText}
            style={styles.replyInput}
            maxHeight={100}
            textAlignVertical="center"
            onFocus={() => {
              setIsKeyboardVisible(true);
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 120);
            }}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSendReply}
            disabled={!replyText.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: isNoteMode
                  ? '#D97706'
                  : replyText.trim()
                  ? COLORS.primaryNavy
                  : COLORS.border,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-up" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  statusChipBtn: {
    padding: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  metaCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.xs,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginLeft: 6,
  },
  categoryBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryNavy,
    fontWeight: TYPOGRAPHY.medium,
  },
  subject: {
    fontSize: TYPOGRAPHY.base + 1,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm + 2,
  },
  descLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  description: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: SPACING.xs + 2,
  },
  detailKey: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
    marginBottom: 1,
  },
  detailVal: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
  },
  timelineCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
    marginBottom: SPACING.sm + 2,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentTeal,
    marginTop: 5,
    marginRight: SPACING.sm + 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineTitle: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
  },
  timelineTime: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
  },
  timelineBy: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 1,
  },
  threadSection: {
    marginBottom: SPACING.sm,
  },
  composerContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: 8,
  },
  aiDraftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.xs + 2,
  },
  aiDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginRight: SPACING.sm,
  },
  aiDraftBtnText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
  },
  aiDraftPreview: {
    flex: 1,
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    fontStyle: 'italic',
  },
  modeTabs: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xs,
    marginRight: SPACING.xs + 2,
    backgroundColor: COLORS.lightBg,
  },
  modeTabActive: {
    backgroundColor: COLORS.primaryNavy,
  },
  modeTabNoteActive: {
    backgroundColor: '#FEF3C7',
  },
  modeTabText: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
  },
  modeTabTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.lightBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    minHeight: 44,
  },
  replyInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
    marginBottom: 2,
  },
  attachmentsSection: {
    marginTop: 2,
  },
  attachmentsWrap: {
    marginTop: SPACING.xs,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm,
    marginBottom: 4,
  },
  attachmentChipText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.mainText,
    flex: 1,
  },
});
