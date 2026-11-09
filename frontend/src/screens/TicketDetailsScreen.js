import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { SlaStamp } from '../components/common/SlaStamp';
import { ChatBubble } from '../components/common/ChatBubble';
import { syncManager } from '../services/syncManager';
import { ticketService, toUiMessage } from '../services/ticketService';
import { getApiAuthToken } from '../services/apiClient';

const CHANNEL_ICON = {
  email: 'mail-outline',
  whatsapp: 'logo-whatsapp',
  chat: 'chatbubbles-outline',
  web: 'globe-outline',
};

const STATUS_OPTIONS = [
  { key: 'open', label: 'Open' },
  { key: 'pending', label: 'Pending' },
  { key: 'resolved', label: 'Resolved' },
];

export const TicketDetailsScreen = ({
  ticket,
  user,
  onNavigateBack,
  onUpdateTicket,
}) => {
  const [messages, setMessages] = useState(ticket?.messages || []);
  const [replyText, setReplyText] = useState('');
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(ticket?.status || 'open');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (ticket) {
      setMessages(ticket.messages || []);
      setTicketStatus(ticket.status || 'open');
      setReplyText('');

      const token = getApiAuthToken();
      if (token && ticket.id) {
        ticketService.getMessages(ticket.id, token).then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            // toUiMessage reads server timestamps as UTC, same as the activity list.
            setMessages(res.data.map(toUiMessage));
          }
        }).catch(() => {});
      }
    }
  }, [ticket?.id]);



  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'admin';
  const [statusError, setStatusError] = useState(null);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    const senderType = isNoteMode ? 'internal_note' : isAgentOrAdmin ? 'agent' : 'customer';

    const content = replyText.trim();
    const token = getApiAuthToken();

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderType,
      // ChatBubble already labels notes "Internal note, <name>".
      senderName: user?.name || (isNoteMode ? 'You' : 'Me'),
      time: 'Just now',
      content,
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    // Opening a ticket starts at its header; only a new message scrolls to the bottom.
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    setReplyText('');

    if (onUpdateTicket) {
      onUpdateTicket({
        ...ticket,
        messages: updatedMessages,
        status: ticketStatus,
        updatedAt: 'Just now',
      });
    }

    try {
      await syncManager.addMessage(
        ticket.id,
        {
          content,
          sender_type: senderType,
          sender_name: user?.name || 'User',
        },
        token
      );
    } catch (_) {}
  };

  const handleSetStatus = async (nextStatus) => {
    if (nextStatus === ticketStatus) return;
    const previous = ticketStatus;
    setTicketStatus(nextStatus);
    onUpdateTicket?.({ ...ticket, status: nextStatus });

    const token = getApiAuthToken();
    if (!token || !ticket?.id) return;
    const res = await ticketService.updateTicket(ticket.id, { status: nextStatus }, token);
    // The server refused the change: put the old status back so the screen tells the truth.
    if (!res.success && !res.isOffline) {
      setTicketStatus(previous);
      onUpdateTicket?.({ ...ticket, status: previous });
      setStatusError(res.error || 'The status wasn’t changed. Try again.');
    } else {
      setStatusError(null);
    }
  };

  // Customers never see the team's internal notes.
  const visibleMessages = isAgentOrAdmin
    ? messages
    : messages.filter((m) => m.senderType !== 'internal_note');

  const isDone = ticketStatus === 'resolved' || ticketStatus === 'closed';
  const slaLabel = isDone
    ? ticketStatus.charAt(0).toUpperCase() + ticketStatus.slice(1)
    : ticket.slaRemaining;
  const channel = COLORS.channel[ticket.channel];
  const description =
    ticket.description || (ticket.messages && ticket.messages[0]?.content) || 'No description given.';

  const details = [
    ticket.createdDate ? { key: 'Created', value: ticket.createdDate } : null,
    { key: 'Last update', value: ticket.updatedAt || 'Recently' },
    { key: 'Assigned to', value: ticket.assignedTo || 'Not assigned yet' },
  ].filter(Boolean);

  const canSend = !!replyText.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScreenHeader
        title="Ticket"
        subtitle={ticket.category || undefined}
        showBack
        onBack={onNavigateBack}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* The ticket as an index card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[TYPE.numeric, styles.id]}>#{ticket.id}</Text>
            <Ionicons
              name={CHANNEL_ICON[ticket.channel] || 'chatbox-outline'}
              size={16}
              color={COLORS.inkMuted}
              style={styles.channelIcon}
            />
            <Text style={[TYPE.label, styles.channel]} numberOfLines={1}>
              {channel?.label || ticket.channel || 'Ticket'}
            </Text>
            <SlaStamp remaining={slaLabel} status={ticket.slaStatus} />
          </View>

          <Text accessibilityRole="header" style={[TYPE.title, styles.subject]}>
            {ticket.subject}
          </Text>

          <View style={styles.badgesRow}>
            <StatusBadge status={ticketStatus} />
            <PriorityBadge priority={ticket.priority} />
          </View>

          <Text style={[TYPE.body, styles.description]}>{description}</Text>

          <View style={styles.details}>
            {details.map((d) => (
              <View key={d.key} style={styles.detailRow}>
                <Text style={[TYPE.bodySmall, styles.detailKey]}>{d.key}</Text>
                <Text style={[TYPE.bodyStrong, styles.detailVal]} numberOfLines={2}>
                  {d.value}
                </Text>
              </View>
            ))}
          </View>

          {ticket.attachments && ticket.attachments.length > 0 ? (
            <View style={styles.attachments}>
              <Text style={[TYPE.label, styles.attachmentsTitle]}>
                Attachments{' '}
                <Text style={[TYPE.numeric, styles.muted]}>{ticket.attachments.length}</Text>
              </Text>
              {ticket.attachments.map((file, idx) => (
                <View key={idx} style={styles.attachmentRow}>
                  <Ionicons name="document-attach-outline" size={18} color={COLORS.inkMuted} />
                  <Text style={[TYPE.bodySmall, styles.attachmentName]} numberOfLines={1}>
                    {file}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {isAgentOrAdmin ? (
            <View style={styles.statusControl}>
              <Text style={[TYPE.label, styles.statusLabel]}>Change status</Text>
              <View style={styles.segmented} accessibilityRole="radiogroup">
                {STATUS_OPTIONS.map((opt, i) => {
                  const selected = ticketStatus === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Mark ${opt.label.toLowerCase()}`}
                      onPress={() => handleSetStatus(opt.key)}
                      style={({ pressed }) => [
                        styles.segment,
                        i > 0 && styles.segmentDivider,
                        selected && styles.segmentSelected,
                        pressed && !selected && styles.segmentPressed,
                      ]}
                    >
                      {selected ? (
                        <Ionicons name="checkmark" size={16} color={COLORS.violetInk} style={styles.segmentCheck} />
                      ) : null}
                      <Text style={[TYPE.label, { color: selected ? COLORS.violetInk : COLORS.ink }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {statusError ? (
                <Text accessibilityRole="alert" style={[TYPE.bodySmall, { color: COLORS.error, marginTop: SPACING.sm }]}>
                  {statusError}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {ticket.timeline && ticket.timeline.length > 0 ? (
          <>
            <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.sectionHeading]}>
              Activity
            </Text>
            <View style={styles.sheet}>
              {ticket.timeline.map((event, index) => (
                <View
                  key={event.id || index}
                  style={[styles.eventRow, index > 0 && styles.eventDivider]}
                >
                  <View style={styles.eventTop}>
                    <Text style={[TYPE.bodyStrong, styles.eventTitle]}>{event.title}</Text>
                    <Text style={[TYPE.numeric, styles.muted]}>{event.time}</Text>
                  </View>
                  {event.by ? (
                    <Text style={[TYPE.bodySmall, styles.muted]}>by {event.by}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text accessibilityRole="header" style={[TYPE.titleSmall, styles.sectionHeading]}>
          Conversation
        </Text>
        {visibleMessages.length === 0 ? (
          <Text style={[TYPE.body, styles.muted]}>No messages yet.</Text>
        ) : (
          visibleMessages.map((item) => (
            <ChatBubble
              key={item.id}
              senderType={item.senderType}
              senderName={item.senderName}
              message={item.content}
              timestamp={item.time}
              isOutgoing={
                isAgentOrAdmin ? item.senderType === 'agent' : item.senderType === 'customer'
              }
            />
          ))
        )}
      </ScrollView>

      {/* Composer, pinned. App.js's SafeAreaView already pads the bottom inset. */}
      <View style={styles.composer}>
        {ticket?.aiSmartDraft ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use the AI draft as your reply"
            onPress={() => setReplyText(ticket.aiSmartDraft)}
            style={({ pressed }) => [styles.aiDraft, pressed && styles.aiDraftPressed]}
          >
            <Ionicons name="sparkles" size={16} color={COLORS.violet} />
            <Text style={[TYPE.label, styles.aiDraftLabel]}>Use AI draft</Text>
            <Text style={[TYPE.bodySmall, styles.aiDraftPreview]} numberOfLines={1}>
              {ticket.aiSmartDraft}
            </Text>
          </Pressable>
        ) : null}

        {isAgentOrAdmin ? (
          <View style={styles.modeRow} accessibilityRole="radiogroup">
            {[
              { note: false, label: 'Reply', icon: 'arrow-undo-outline' },
              { note: true, label: 'Internal note', icon: 'lock-closed-outline' },
            ].map((m) => {
              const selected = isNoteMode === m.note;
              return (
                <Pressable
                  key={m.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={m.note ? 'Write an internal note' : 'Write a reply to the customer'}
                  onPress={() => setIsNoteMode(m.note)}
                  hitSlop={4}
                  style={[
                    styles.modeChip,
                    selected && (m.note ? styles.modeChipNote : styles.modeChipSelected),
                  ]}
                >
                  <Ionicons
                    name={m.icon}
                    size={14}
                    color={selected ? (m.note ? COLORS.internalNote.text : COLORS.violetInk) : COLORS.inkMuted}
                  />
                  <Text
                    style={[
                      TYPE.label,
                      {
                        color: selected
                          ? m.note
                            ? COLORS.internalNote.text
                            : COLORS.violetInk
                          : COLORS.inkMuted,
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            multiline
            accessibilityLabel={isNoteMode ? 'Internal note' : 'Reply'}
            placeholder={isNoteMode ? 'Note for the team. The customer won’t see it.' : 'Write a reply'}
            placeholderTextColor={COLORS.inkFaint}
            selectionColor={COLORS.violet}
            cursorColor={COLORS.violetInk}
            value={replyText}
            onChangeText={setReplyText}
            style={[styles.replyInput, isNoteMode && styles.replyInputNote]}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isNoteMode ? 'Add note' : 'Send reply'}
            accessibilityState={{ disabled: !canSend }}
            onPress={handleSendReply}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendBtn,
              !canSend && styles.sendBtnDisabled,
              pressed && canSend && styles.sendBtnPressed,
            ]}
          >
            <Ionicons name="send" size={20} color={canSend ? COLORS.ink : COLORS.inkFaint} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  scrollArea: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  muted: { color: COLORS.inkMuted },

  card: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.violet,
    marginBottom: SPACING.lg,
  },
  id: { color: COLORS.ink },
  channelIcon: { marginLeft: SPACING.md, marginRight: SPACING.xs },
  channel: { color: COLORS.inkMuted, flex: 1, marginRight: SPACING.sm },
  subject: { color: COLORS.ink },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.md },
  description: { color: COLORS.ink, marginTop: SPACING.lg },

  details: { marginTop: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.rule },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.rule,
  },
  detailKey: { color: COLORS.inkMuted, width: 104 },
  detailVal: { color: COLORS.ink, flex: 1 },

  attachments: { marginTop: SPACING.lg },
  attachmentsTitle: { color: COLORS.ink, marginBottom: SPACING.xs },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 36 },
  attachmentName: { color: COLORS.ink, flex: 1 },

  statusControl: { marginTop: SPACING.xxl },
  statusLabel: { color: COLORS.ink, marginBottom: SPACING.sm },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.paper,
  },
  segmentDivider: { borderLeftWidth: 1, borderLeftColor: COLORS.ruleStrong },
  segmentSelected: { backgroundColor: COLORS.violetWash },
  segmentPressed: { backgroundColor: COLORS.groundDeep },
  segmentCheck: { marginRight: SPACING.xs },

  sectionHeading: { color: COLORS.ink, marginTop: SPACING.xxxl, marginBottom: SPACING.md },
  sheet: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    paddingHorizontal: SPACING.lg,
  },
  eventRow: { paddingVertical: SPACING.md },
  eventDivider: { borderTopWidth: 1, borderTopColor: COLORS.rule },
  eventTop: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.md },
  eventTitle: { color: COLORS.ink, flex: 1 },

  composer: {
    backgroundColor: COLORS.paper,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  aiDraft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: TOUCH,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ai.bg,
  },
  aiDraftPressed: { backgroundColor: COLORS.violetWash, opacity: 0.85 },
  aiDraftLabel: { color: COLORS.ai.text },
  aiDraftPreview: { color: COLORS.inkMuted, flex: 1 },

  modeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 40,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.paper,
  },
  modeChipSelected: { backgroundColor: COLORS.violetWash, borderColor: COLORS.violetWash },
  modeChipNote: { backgroundColor: COLORS.internalNote.bg, borderColor: COLORS.internalNote.border },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm },
  replyInput: {
    ...TYPE.body,
    flex: 1,
    color: COLORS.ink,
    minHeight: TOUCH,
    maxHeight: 120,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    borderRadius: RADIUS.md,
    textAlignVertical: 'top',
  },
  replyInputNote: {
    backgroundColor: COLORS.internalNote.bg,
    borderColor: COLORS.internalNote.border,
    color: COLORS.internalNote.text,
  },
  sendBtn: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lemon,
  },
  sendBtnDisabled: { backgroundColor: COLORS.groundDeep },
  sendBtnPressed: { opacity: 0.85 },
});
