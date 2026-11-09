import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { AppButton } from '../components/common/AppButton';
import { ChatBubble } from '../components/common/ChatBubble';
import { useTopInset } from '../hooks/useTopInset';
import { api } from '../services/apiClient';

// Offline fallback only; labelled "Demo reply" in the thread.
const demoReply = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('invoice') || lower.includes('billing')) {
    return 'To download monthly invoices, go to Billing > Invoices and choose "Download PDF" beside any statement.';
  }
  if (lower.includes('webhook')) {
    return 'Failed webhooks can be replayed from Settings > Webhooks > Dead letter queue. Signing secrets use HMAC SHA-256.';
  }
  return "I couldn't reach the help centre just now. You can try again, or turn this chat into a ticket for the team.";
};

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
        senderName: 'Assistant',
        time: 'Just now',
        content: 'Hello! I am your SupportDesk AI assistant. Ask me anything about your orders, invoices, or technical integrations.',

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
          senderName: 'Assistant',
          time: 'Just now',
          content: 'Hello! I am your SupportDesk AI assistant. Ask me anything about your orders, invoices, or technical integrations.',

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

  const handleSend = async (textToSend) => {
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

    // Ask the backend's knowledge-grounded assistant; fall back to a canned demo answer offline.
    const res = await api.post('/api/v1/ai/chat', { query: text.trim() });
    const replyContent = res.success && res.data?.response ? res.data.response : demoReply(text);
    const isDemo = !res.success || !res.data?.response;

    const aiReply = {
      id: `ai-${Date.now()}`,
      senderType: 'assistant',
      senderName: 'Assistant',
      time: 'Just now',
      content: replyContent,
      isDemo,
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
  };

  const canSend = !!inputText.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      // KAV measures itself relative to its parent, not the screen; App's
      // StatusBarSpacer pushes it down by the top inset, which varies per device.
      keyboardVerticalOffset={topInset}
    >
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          {onNavigateBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={onNavigateBack}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
            </Pressable>
          ) : null}

          <View style={styles.headerTitles}>
            <View style={styles.titleRow}>
              <Ionicons name="sparkles" size={16} color={COLORS.violet} />
              <Text accessibilityRole="header" style={[TYPE.title, styles.ink]} numberOfLines={1}>
                Assistant
              </Text>
            </View>
            <Text style={[TYPE.bodySmall, styles.muted]} numberOfLines={1}>
              AI, answers from the help centre
            </Text>
          </View>

          {onNavigateToHistory ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Conversation history"
              onPress={onNavigateToHistory}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            >
              <Ionicons name="time-outline" size={24} color={COLORS.ink} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.provenance}>
          <Text style={[TYPE.bodySmall, styles.provenanceText]}>
            You're talking to an AI assistant, not a person. Answers come from the help centre.
          </Text>
          {onEscalateToTicket ? (
            <AppButton
              title="Talk to a person"
              onPress={onEscalateToTicket}
              variant="tonal"
              size="sm"
              icon={<Ionicons name="person-outline" size={16} color={COLORS.violetInk} />}
            />
          ) : null}
        </View>

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

          {isTyping ? (
            <View style={styles.typing} accessibilityLiveRegion="polite">
              <View style={styles.typingDots}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
              <Text style={[TYPE.bodySmall, styles.muted]}>Searching the help centre…</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.composerBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : SPACING.sm }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.suggestions}
          >
            {suggestedQuestions.map((q, idx) => (
              <Pressable
                key={idx}
                accessibilityRole="button"
                accessibilityLabel={`Ask: ${q}`}
                onPress={() => handleSend(q)}
                hitSlop={4}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
              >
                <Text style={[TYPE.label, styles.ink]}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              placeholder="Ask a question"
              placeholderTextColor={COLORS.inkFaint}
              selectionColor={COLORS.violet}
              cursorColor={COLORS.violetInk}
              accessibilityLabel="Message to the assistant"
              value={inputText}
              onChangeText={setInputText}
              style={styles.composerInput}
              multiline
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !canSend }}
              onPress={() => handleSend()}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendButton,
                { backgroundColor: canSend ? COLORS.lemon : COLORS.groundDeep },
                pressed && styles.sendPressed,
              ]}
            >
              <Ionicons name="arrow-up" size={22} color={canSend ? COLORS.ink : COLORS.inkFaint} />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  innerContainer: { flex: 1 },
  ink: { color: COLORS.ink },
  muted: { color: COLORS.inkMuted },

  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.ground,
  },
  iconBtn: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: COLORS.groundDeep },
  headerTitles: { flex: 1, paddingHorizontal: SPACING.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },

  provenance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.paper,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.rule,
  },
  provenanceText: { color: COLORS.ai.text, flex: 1 },

  messageScroll: { flex: 1 },
  messageContent: { padding: SPACING.lg, paddingBottom: SPACING.md, flexGrow: 1 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  typingDots: { flexDirection: 'row', gap: SPACING.xs },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.violet },

  composerBar: {
    backgroundColor: COLORS.paper,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
    paddingTop: SPACING.sm,
  },
  suggestions: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingVertical: SPACING.xs },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.paper,
  },
  chipPressed: { backgroundColor: COLORS.violetWash },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  composerInput: {
    ...TYPE.body,
    flex: 1,
    minHeight: TOUCH,
    maxHeight: 120,
    color: COLORS.ink,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPressed: { opacity: 0.85 },
});
