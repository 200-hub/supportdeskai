import React, { useState, useRef, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ChatBubble } from '../components/common/ChatBubble';
import { useTopInset } from '../hooks/useTopInset';

export const AIChatScreen = ({
  initialConversation,
  onNavigateBack,
  onNavigateToHistory,
  onEscalateToTicket,
  onUpdateConversation,
}) => {
  const [messages, setMessages] = useState(
    initialConversation?.messages || [
      {
        id: 'msg-1',
        senderType: 'assistant',
        senderName: 'SupportDesk AI Bot',
        time: 'Just now',
        content: 'Hello! I am your SupportDesk AI assistant. Ask me anything about your orders, invoices, or technical integrations.',
        isDemo: true,
      },
    ]
  );
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();
  const insets = useSafeAreaInsets();
  const topInset = useTopInset();
  const currentConvIdRef = useRef(initialConversation?.id || `conv-${Date.now()}`)

  useEffect(() => {
    if (initialConversation?.messages) {
      setMessages(initialConversation.messages);
      currentConvIdRef.current = initialConversation.id || currentConvIdRef.current;
    } else {
      currentConvIdRef.current = `conv-${Date.now()}`;
      setMessages([
        {
          id: 'msg-1',
          senderType: 'assistant',
          senderName: 'SupportDesk AI Bot',
          time: 'Just now',
          content: 'Hello! I am your SupportDesk AI assistant. Ask me anything about your orders, invoices, or technical integrations.',
          isDemo: true,
        },
      ]);
    }
  }, [initialConversation?.id]);

  useEffect(() => {
    const keyboardEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(keyboardEvent, () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
    return () => sub.remove();
  }, []);

  const suggestedQuestions = [
    'How do I re-verify webhooks?',
    'Download my monthly VAT invoice',
    'How to track shipment #ORD-8821?',
    'Okta SAML SSO configuration help',
  ];

  const handleSend = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      senderType: 'customer',
      senderName: 'You',
      time: 'Just now',
      content: text.trim(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    const activeConvId = initialConversation?.id || currentConvIdRef.current;
    const conversationTitle =
      initialConversation?.title ||
      (text.trim().length > 32 ? `${text.trim().slice(0, 32)}...` : text.trim()) ||
      'SupportDesk AI Live Assistant';

    const userUpdatedConv = {
      id: activeConvId,
      title: conversationTitle,
      lastMessage: text.trim(),
      time: 'Just now',
      status: 'active',
      unreadCount: 0,
      messages: updatedMessages,
    };

    if (onUpdateConversation) {
      onUpdateConversation(userUpdatedConv);
    }

    // Simulated local demo response with grounded knowledge context
    setTimeout(() => {
      let replyContent =
        'Thank you for reaching out! In this local demo mode, SupportDesk AI has matched your inquiry with verified tenant documentation. For live operational requests, you can escalate this thread directly into an omnichannel support ticket.';

      const lower = text.toLowerCase();
      if (lower.includes('invoice') || lower.includes('billing')) {
        replyContent =
          'To download monthly invoices, go to Billing > Invoices in your web console. You can click "Download PDF" beside any invoice statement. Need help updating your tax VAT ID?';
      } else if (lower.includes('shipment') || lower.includes('order') || lower.includes('track')) {
        replyContent =
          'Order #ORD-8821 is currently in transit with the local regional hub and scheduled for arrival today before 2 PM. You can view the live courier track pin in your order dashboard.';
      } else if (lower.includes('webhook')) {
        replyContent =
          'For failed webhooks, you can trigger batch replays using POST /v1/webhooks/replay or click "Replay Batch" in Settings > Webhooks > Dead Letter Queue. Signing secrets are HMAC SHA-256.';
      } else if (lower.includes('sso') || lower.includes('saml') || lower.includes('okta')) {
        replyContent =
          'For Okta SAML 2.0 configuration, set the SP Entity ID to urn:supportdeskai:auth:<slug> and ACS URL to https://api.supportdesk.io/v1/auth/saml/callback with EmailAddress format.';
      }

      const aiReply = {
        id: `ai-${Date.now()}`,
        senderType: 'assistant',
        senderName: 'SupportDesk AI Bot',
        time: 'Just now',
        content: replyContent,
        isDemo: true,
      };

      setIsTyping(false);
      const finalMessages = [...updatedMessages, aiReply];
      setMessages(finalMessages);

      if (onUpdateConversation) {
        onUpdateConversation({
          ...userUpdatedConv,
          lastMessage: replyContent,
          time: 'Just now',
          messages: finalMessages,
        });
      }
    }, 900);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      // KAV measures itself relative to its parent, not the screen; App's
      // StatusBarSpacer pushes it down by the top inset, which varies per device.
      keyboardVerticalOffset={topInset}
    >
      <View style={styles.innerContainer}>
        {/* Top Header */}
        <View style={styles.chatHeader}>
        <View style={styles.headerLeft}>
          {onNavigateBack && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateBack}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
          )}

          <View style={styles.assistantAvatar}>
            <Ionicons name="sparkles" size={18} color={COLORS.accentTeal} />
          </View>

          <View style={styles.assistantInfo}>
            <Text style={styles.assistantName}>SupportDesk AI Assistant</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online • 24/7 Grounded AI</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {onEscalateToTicket && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onEscalateToTicket}
              style={styles.escalateBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ticket-outline" size={15} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.escalateBtnText}>Create Ticket</Text>
            </TouchableOpacity>
          )}

          {onNavigateToHistory && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateToHistory}
              style={styles.historyBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="time-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Demo Notice Banner */}
      <View style={styles.demoNoticeBanner}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.primaryNavy} style={{ marginRight: 5 }} />
        <Text style={styles.demoNoticeText}>
          Demo Mode: Responses are locally simulated to showcase AI deflection behavior.
        </Text>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageScroll}
        contentContainerStyle={styles.messageContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((item) => (
          <ChatBubble
            key={item.id}
            senderType={item.senderType}
            senderName={item.senderName}
            message={item.content}
            timestamp={item.time}
            isDemo={item.isDemo}
            isOutgoing={item.senderType === 'customer'}
          />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, { marginHorizontal: 4 }]} />
            <View style={styles.typingDot} />
            <Text style={styles.typingText}>SupportDesk AI is searching knowledge base...</Text>
          </View>
        )}
      </ScrollView>

      {/* Suggested Quick Questions */}
      <View style={styles.suggestionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
          {suggestedQuestions.map((q, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => handleSend(q)}
              style={styles.suggestionChip}
            >
              <Ionicons name="bulb-outline" size={12} color={COLORS.primaryNavy} style={{ marginRight: 4 }} />
              <Text style={styles.suggestionText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Message Composer */}
      <View style={[styles.composerBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : SPACING.sm }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Type your question or request..."
            placeholderTextColor={COLORS.secondaryText}
            value={inputText}
            onChangeText={setInputText}
            style={styles.composerInput}
            multiline
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? COLORS.accentTeal : COLORS.border },
            ]}
          >
            <Ionicons name="arrow-up" size={18} color={COLORS.white} />
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
  innerContainer: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: COLORS.primaryNavy,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryNavy,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  assistantAvatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.secondaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  assistantInfo: {
    flex: 1,
  },
  assistantName: {
    fontSize: TYPOGRAPHY.sm + 1,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.border,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  escalateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentTeal,
    borderRadius: RADIUS.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: SPACING.xs + 2,
  },
  escalateBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
  },
  historyBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.secondaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoNoticeBanner: {
    backgroundColor: '#CCFBF1',
    paddingVertical: 5,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoNoticeText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primaryNavy,
    flex: 1,
  },
  messageScroll: {
    flex: 1,
  },
  messageContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    flexGrow: 1,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentTeal,
  },
  typingText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondaryText,
    marginLeft: SPACING.sm,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.xs + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  suggestionsScroll: {
    paddingHorizontal: SPACING.md,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 5,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
  },
  suggestionText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.mainText,
    fontWeight: TYPOGRAPHY.medium,
  },
  composerBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
  },
  composerInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.mainText,
    paddingVertical: 8,
    maxHeight: 90,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
});
