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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState(
    initialConversation?.messages || [
      {
        id: 'msg-1',
        senderType: 'assistant',
        senderName: 'SupportDesk AI Bot',
        time: 'Just now',
        content: 'Hello! I am your SupportDesk AI assistant. Ask me anything about orders, invoices, or technical integrations.',
        isDemo: true,
      },
    ]
  );
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
<<<<<<< HEAD
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
=======
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(() =>
    Keyboard.isVisible ? Keyboard.isVisible() : false
  );
  const scrollViewRef = useRef(null);

  // Keyboard listeners for clean responsive padding adjustment on Android & iOS
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
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
  }, []);

  const suggestedQuestions = [
    'How do I re-verify webhooks?',
    'Download my monthly VAT invoice',
    'How to track shipment #ORD-8821?',
    'Okta SAML SSO configuration help',
  ];

  const handleSend = (textToSend) => {
    const text = textToSend || inputText;
    if (!text || !text.trim()) return;

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

<<<<<<< HEAD
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
=======
    // Scroll to bottom immediately on send
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
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
<<<<<<< HEAD
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
=======
      setMessages((prev) => [...prev, aiReply]);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }, 850);
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
  };

  const hasFewMessages = messages.length <= 2;

  return (
    <KeyboardAvoidingView
      style={styles.container}
<<<<<<< HEAD
      behavior="padding"
      // KAV measures itself relative to its parent, not the screen; App's
      // StatusBarSpacer pushes it down by the top inset, which varies per device.
      keyboardVerticalOffset={topInset}
=======
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
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
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
          )}

          <View style={styles.assistantAvatar}>
            <Ionicons name="sparkles" size={17} color={COLORS.accentTeal} />
          </View>

          <View style={styles.assistantInfo}>
            <Text style={styles.assistantName} numberOfLines={1}>
              SupportDesk AI Assistant
            </Text>
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
<<<<<<< HEAD
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ticket-outline" size={15} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.escalateBtnText}>Create Ticket</Text>
=======
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="add" size={14} color={COLORS.white} style={{ marginRight: 2 }} />
              <Text style={styles.escalateBtnText}>Ticket</Text>
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
            </TouchableOpacity>
          )}

          {onNavigateToHistory && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateToHistory}
              style={styles.historyBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="time-outline" size={19} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Demo Notice Banner */}
      <View style={styles.demoNoticeBanner}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.primaryNavy} style={{ marginRight: 6 }} />
        <Text style={styles.demoNoticeText} numberOfLines={1}>
          Demo: Responses locally simulated with verified grounding.
        </Text>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageScroll}
        contentContainerStyle={styles.messageContent}
        keyboardShouldPersistTaps="handled"
<<<<<<< HEAD
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
=======
        keyboardDismissMode="on-drag"
        onLayout={() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }}
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
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
            <Text style={styles.typingText}>Searching knowledge base...</Text>
          </View>
        )}
      </ScrollView>

      {/* Suggested Quick Questions Row (Kept stable without jarring mounts/unmounts) */}
      {hasFewMessages && !isKeyboardVisible && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
            keyboardShouldPersistTaps="handled"
          >
            {suggestedQuestions.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => handleSend(q)}
                style={styles.suggestionChip}
              >
                <Ionicons name="bulb-outline" size={13} color={COLORS.primaryNavy} style={{ marginRight: 5 }} />
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

<<<<<<< HEAD
      {/* Message Composer */}
      <View style={[styles.composerBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : SPACING.sm }]}>
=======
      {/* Message Composer Bar */}
      <View
        style={[
          styles.composerBar,
          {
            paddingBottom: isKeyboardVisible
              ? SPACING.sm
              : insets.bottom > 0
                ? insets.bottom + SPACING.sm
                : SPACING.md,
          },
        ]}
      >
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Type your question or request..."
            placeholderTextColor={COLORS.secondaryText}
            value={inputText}
            onChangeText={setInputText}
            style={styles.composerInput}
            multiline
            maxHeight={100}
            underlineColorAndroid="transparent"
            onPressIn={() => {
              setIsKeyboardVisible(true);
            }}
            onFocus={() => {
              setIsKeyboardVisible(true);
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? COLORS.accentTeal : '#E2E8F0',
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={inputText.trim() ? COLORS.white : '#94A3B8'}
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
    minHeight: 0,
    backgroundColor: COLORS.lightBg,
    overflow: 'hidden',
  },
  innerContainer: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: COLORS.primaryNavy,
    paddingTop: SPACING.sm + 2,
    paddingBottom: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryNavy,
    minHeight: 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.xs,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: 6,
  },
  assistantAvatar: {
    width: 34,
    height: 34,
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
    color: '#94A3B8',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  escalateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentTeal,
<<<<<<< HEAD
    borderRadius: RADIUS.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: SPACING.xs + 2,
  },
  escalateBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.xs,
=======
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xs,
    marginRight: 6,
  },
  escalateBtnText: {
    fontSize: 11,
    color: COLORS.white,
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
    fontWeight: TYPOGRAPHY.bold,
  },
  historyBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.secondaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoNoticeBanner: {
    backgroundColor: '#F0FDFA',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CCFBF1',
  },
  demoNoticeText: {
    fontSize: 11,
    color: COLORS.primaryNavy,
    fontWeight: TYPOGRAPHY.medium,
    flex: 1,
  },
  messageScroll: {
    flex: 1,
    minHeight: 0,
  },
  messageContent: {
<<<<<<< HEAD
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    flexGrow: 1,
=======
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285
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
    paddingVertical: 6,
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
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexShrink: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    minHeight: 44,
  },
  composerInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.mainText,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
    marginBottom: 2,
  },
});
