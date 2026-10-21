import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { SolidButton } from '../components/common/SolidButton';

export const TicketDetailScreen = ({ ticket, onBack, onUpdateTicket }) => {
  const [messages, setMessages] = useState(ticket.messages || []);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('public'); // 'public' | 'note'
  const [showAiModal, setShowAiModal] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(ticket.status);

  const isAtRisk = ticket.slaStatus === 'at-risk';

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: `m_${Date.now()}`,
      senderType: mode === 'public' ? 'agent' : 'internal_note',
      senderName: mode === 'public' ? 'Sayoni Bhattacharjee' : 'Sayoni (Internal Note)',
      time: 'Just now',
      content: inputText.trim(),
    };

    const updatedList = [...messages, newMessage];
    setMessages(updatedList);
    setInputText('');

    if (onUpdateTicket) {
      onUpdateTicket({
        ...ticket,
        messages: updatedList,
        status: ticketStatus,
        updatedAt: 'Just now',
      });
    }
  };

  const handleApplySmartDraft = () => {
    if (ticket.aiSmartDraft) {
      setInputText(ticket.aiSmartDraft);
      setMode('public');
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={`#${ticket.id}`}
        showBack
        onBack={onBack}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleToggleStatus}
            style={styles.statusToggleBtn}
          >
            <Badge label={ticketStatus} variant="status" type={ticketStatus} size="sm" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Customer & SLA Header Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerTopRow}>
            <View style={styles.customerIdentity}>
              <Avatar
                initials={ticket.customer.avatarInitials}
                size={38}
                bgColor={COLORS.secondaryNavy}
              />
              <View style={styles.customerTextContainer}>
                <Text style={styles.customerName}>{ticket.customer.name}</Text>
                <Text style={styles.customerMeta}>
                  {ticket.customer.email} • {ticket.customer.tier}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.slaBadge,
                {
                  backgroundColor: isAtRisk ? COLORS.priority.urgent.bg : COLORS.lightBg,
                  borderColor: isAtRisk ? '#FCA5A5' : COLORS.border,
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={13}
                color={isAtRisk ? COLORS.priority.urgent.text : COLORS.secondaryText}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.slaText,
                  { color: isAtRisk ? COLORS.priority.urgent.text : COLORS.secondaryText },
                ]}
              >
                SLA: {ticket.slaRemaining}
              </Text>
            </View>
          </View>

          <View style={styles.subjectBox}>
            <Text style={styles.subjectLabel}>Subject</Text>
            <Text style={styles.subjectText}>{ticket.subject}</Text>
          </View>
        </View>

        {/* AI Copilot Assistance Toolbar */}
        <View style={styles.aiAssistBanner}>
          <View style={styles.aiHeaderRow}>
            <View style={styles.aiBrandRow}>
              <Ionicons name="sparkles" size={16} color={COLORS.accentTeal} style={{ marginRight: 6 }} />
              <Text style={styles.aiTitle}>AI Copilot Grounded Assistant</Text>
            </View>
            <View style={styles.confidenceChip}>
              <Text style={styles.confidenceText}>{ticket.aiConfidence || '95%'} Confidence</Text>
            </View>
          </View>

          <Text style={styles.aiSummaryText}>
            💡 {ticket.aiSummary || 'Analyzed conversation and verified knowledge base grounding.'}
          </Text>

          <View style={styles.aiActionRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleApplySmartDraft}
              style={styles.aiActionBtn}
            >
              <Ionicons name="flash-outline" size={14} color={COLORS.primaryNavy} style={{ marginRight: 4 }} />
              <Text style={styles.aiActionBtnText}>Insert Smart Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowAiModal(!showAiModal)}
              style={styles.aiActionOutlineBtn}
            >
              <Ionicons
                name={showAiModal ? 'chevron-up' : 'book-outline'}
                size={14}
                color={COLORS.secondaryNavy}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.aiActionOutlineBtnText}>
                {showAiModal ? 'Hide Details' : 'View Citations'}
              </Text>
            </TouchableOpacity>
          </View>

          {showAiModal && (
            <View style={styles.citationsBox}>
              <Text style={styles.citationsTitle}>Grounded Knowledge Source:</Text>
              <Text style={styles.citationsContent}>
                • KB #1: "Webhook signature rotation and dead-letter replay protocol"
              </Text>
              <Text style={styles.citationsSub}>
                Suggested API: POST /v1/webhooks/replay
              </Text>
            </View>
          )}
        </View>

        {/* Message Thread */}
        <View style={styles.threadSection}>
          <Text style={styles.threadDividerText}>Conversation Timeline</Text>

          {messages.map((item) => {
            if (item.senderType === 'customer') {
              return (
                <View key={item.id} style={styles.customerBubbleWrapper}>
                  <View style={styles.customerBubbleHeader}>
                    <Text style={styles.senderName}>{item.senderName}</Text>
                    <Text style={styles.messageTime}>{item.time}</Text>
                  </View>
                  <View style={styles.customerBubble}>
                    <Text style={styles.customerMessageText}>{item.content}</Text>
                  </View>
                </View>
              );
            }

            if (item.senderType === 'internal_note') {
              return (
                <View key={item.id} style={styles.noteBubbleWrapper}>
                  <View style={styles.noteBubbleHeader}>
                    <View style={styles.noteTag}>
                      <Ionicons name="lock-closed" size={12} color="#92400E" style={{ marginRight: 4 }} />
                      <Text style={styles.noteTagText}>Internal Team Note</Text>
                    </View>
                    <Text style={styles.messageTime}>{item.time}</Text>
                  </View>
                  <View style={styles.noteBubble}>
                    <Text style={styles.noteSenderName}>{item.senderName}:</Text>
                    <Text style={styles.noteMessageText}>{item.content}</Text>
                  </View>
                </View>
              );
            }

            // Agent Reply
            return (
              <View key={item.id} style={styles.agentBubbleWrapper}>
                <View style={styles.agentBubbleHeader}>
                  <Text style={styles.messageTime}>{item.time}</Text>
                  <Text style={styles.senderName}>{item.senderName}</Text>
                </View>
                <View style={styles.agentBubble}>
                  <Text style={styles.agentMessageText}>{item.content}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Composer Bottom Box */}
      <View style={styles.composerContainer}>
        {/* Mode Switcher */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMode('public')}
            style={[styles.modeTab, mode === 'public' && styles.modeTabActive]}
          >
            <Ionicons
              name="send"
              size={12}
              color={mode === 'public' ? COLORS.white : COLORS.secondaryText}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.modeTabText,
                { color: mode === 'public' ? COLORS.white : COLORS.secondaryText },
              ]}
            >
              Public Reply
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMode('note')}
            style={[styles.modeTab, mode === 'note' && styles.modeTabNoteActive]}
          >
            <Ionicons
              name="lock-closed"
              size={12}
              color={mode === 'note' ? '#92400E' : COLORS.secondaryText}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.modeTabText,
                { color: mode === 'note' ? '#92400E' : COLORS.secondaryText },
              ]}
            >
              Internal Note
            </Text>
          </TouchableOpacity>
        </View>

        {/* Text Input Row */}
        <View
          style={[
            styles.inputBox,
            mode === 'note' && { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
          ]}
        >
          <TextInput
            multiline
            placeholder={
              mode === 'public'
                ? 'Type public reply to customer...'
                : 'Add a private note only agents can see...'
            }
            placeholderTextColor={COLORS.secondaryText}
            value={inputText}
            onChangeText={setInputText}
            style={styles.composerInput}
          />

          <View style={styles.composerActionRow}>
            <View style={styles.leftComposerIcons}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Alert.alert('Attachment', 'File attachment dialog opened.')}
                style={styles.composerIconButton}
              >
                <Ionicons name="attach-outline" size={20} color={COLORS.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleApplySmartDraft}
                style={styles.composerIconButton}
              >
                <Ionicons name="sparkles-outline" size={18} color={COLORS.accentTeal} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSendMessage}
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    mode === 'note' ? '#D97706' : COLORS.primaryNavy,
                },
              ]}
            >
              <Text style={styles.sendButtonText}>
                {mode === 'note' ? 'Add Note' : 'Send'}
              </Text>
              <Ionicons
                name={mode === 'note' ? 'checkmark' : 'arrow-forward'}
                size={14}
                color={COLORS.white}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>
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
  statusToggleBtn: {
    padding: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  customerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  customerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  customerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  customerName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.mainText,
  },
  customerMeta: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  slaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  slaText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  subjectBox: {
    paddingTop: SPACING.md,
  },
  subjectLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
    fontWeight: TYPOGRAPHY.semiBold,
    marginBottom: 2,
  },
  subjectText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
    lineHeight: TYPOGRAPHY.lineHeightNormal,
  },
  aiAssistBanner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#99F6E4',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs + 2,
  },
  aiBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
  },
  confidenceChip: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  confidenceText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: '#0F766E',
  },
  aiSummaryText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
    lineHeight: TYPOGRAPHY.lineHeightNormal,
    marginBottom: SPACING.md,
  },
  aiActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingVertical: 7,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
  },
  aiActionBtnText: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryNavy,
  },
  aiActionOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 7,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  aiActionOutlineBtnText: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.secondaryNavy,
  },
  citationsBox: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  citationsTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.secondaryNavy,
    marginBottom: 2,
  },
  citationsContent: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.mainText,
    lineHeight: 18,
  },
  citationsSub: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accentTeal,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 2,
  },
  threadSection: {
    marginTop: SPACING.sm,
  },
  threadDividerText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  customerBubbleWrapper: {
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  customerBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
    marginRight: SPACING.sm,
  },
  messageTime: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
  },
  customerBubble: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderTopLeftRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  customerMessageText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
    lineHeight: TYPOGRAPHY.lineHeightNormal,
  },
  agentBubbleWrapper: {
    marginBottom: SPACING.lg,
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  agentBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  agentBubble: {
    backgroundColor: COLORS.primaryNavy,
    borderRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.xs,
    padding: SPACING.md,
  },
  agentMessageText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.white,
    lineHeight: TYPOGRAPHY.lineHeightNormal,
  },
  noteBubbleWrapper: {
    marginBottom: SPACING.lg,
    width: '100%',
  },
  noteBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteTagText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: '#92400E',
  },
  noteBubble: {
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: SPACING.md,
  },
  noteSenderName: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: '#92400E',
    marginBottom: 2,
  },
  noteMessageText: {
    fontSize: TYPOGRAPHY.sm,
    color: '#92400E',
    lineHeight: TYPOGRAPHY.lineHeightNormal,
  },
  composerContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
  },
  modeTabs: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.lightBg,
  },
  modeTabActive: {
    backgroundColor: COLORS.primaryNavy,
  },
  modeTabNoteActive: {
    backgroundColor: '#FEF3C7',
  },
  modeTabText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  inputBox: {
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  composerInput: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
    minHeight: 52,
    maxHeight: 110,
    textAlignVertical: 'top',
    padding: SPACING.xs,
  },
  composerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  leftComposerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  composerIconButton: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
  },
});
