import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPE } from '../theme/typography';
import { SPACING, RADIUS, TOUCH } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { AppTextInput } from '../components/common/AppTextInput';
import { AppButton } from '../components/common/AppButton';
import { syncManager } from '../services/syncManager';
import { getApiAuthToken } from '../services/apiClient';

const CATEGORIES = [
  'Billing & Invoices',
  'Orders & Shipping',
  'Account & Access',
  'Technical & API',
  'General Support',
];

const PRIORITIES = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
];

// Filter-style choice chip: paper + rule; selected = violet wash + violet ink.
const Chip = ({ label, selected, onPress, pipColor }) => (
  <Pressable
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    accessibilityLabel={label}
    onPress={onPress}
    hitSlop={4}
    style={({ pressed }) => [
      styles.chip,
      selected && styles.chipSelected,
      pressed && !selected && styles.chipPressed,
    ]}
  >
    {selected ? (
      <Ionicons name="checkmark" size={16} color={COLORS.violetInk} />
    ) : pipColor ? (
      <View style={[styles.pip, { backgroundColor: pipColor }]} />
    ) : null}
    <Text style={[TYPE.label, { color: selected ? COLORS.violetInk : COLORS.ink }]}>{label}</Text>
  </Pressable>
);

export const CreateTicketScreen = ({
  user,
  onCreateTicket,
  onNavigateBack,
  onViewTicket,
}) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical & API');
  const [priority, setPriority] = useState('medium');
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // { ticket, online } once created. Shown inline so it also works on web,
  // where Alert.alert with buttons does nothing.
  const [result, setResult] = useState(null);

  const formatFileSize = (bytes) => {
    if (!bytes || typeof bytes !== 'number') return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Photos access is off',
            'To attach a photo, allow SupportDesk AI to access your photos in your phone’s settings.'
          );
          return;
        }
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const newAttachments = pickerResult.assets.map((asset) => ({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: asset.fileName || asset.uri.split('/').pop() || 'photo.jpg',
          size: asset.fileSize ? formatFileSize(asset.fileSize) : '',
          uri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          isImage: true,
        }));
        setAttachments((prev) => [...prev, ...newAttachments]);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      Alert.alert('Couldn’t open your photos', 'Try again, or attach the file later in a reply.');
    }
  };

  const handleAddSampleAttachment = () => {
    const sampleFiles = [
      'console_error_log.txt (14 KB)',
      'screenshot_checkout_drop.png (2.1 MB)',
      'webhook_payload_dump.json (45 KB)',
    ];
    const nextFile = sampleFiles[attachments.length % sampleFiles.length];
    if (!attachments.includes(nextFile)) {
      setAttachments([...attachments, nextFile]);
    } else {
      Alert.alert('Already attached', 'That sample file is already on this ticket.');
    }
  };

  const handleRemoveAttachment = (attachmentToRemove) => {
    setAttachments(
      attachments.filter((item) => {
        if (typeof item === 'object' && typeof attachmentToRemove === 'object') {
          return item.id ? item.id !== attachmentToRemove.id : item.uri !== attachmentToRemove.uri;
        }
        return item !== attachmentToRemove;
      })
    );
  };

  const handleSubmit = async () => {
    const newErrors = {};

    if (!subject.trim()) {
      newErrors.subject = 'Add a subject so the team knows what this is about.';
    } else if (subject.trim().length < 5) {
      newErrors.subject = 'Use at least 5 characters.';
    }

    if (!description.trim()) {
      newErrors.description = 'Describe what happened.';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Add a little more detail (at least 10 characters).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitError('');
    setLoading(true);

    try {
      const ticketPayload = {
        subject: subject.trim(),
        description: description.trim(),
        category,
        channel: 'web',
        priority,
        customer_name: user?.name,
        customer_email: user?.email,
        customer_company: user?.company,
      };

      const token = getApiAuthToken();
      const syncResult = await syncManager.createTicket(ticketPayload, token);

      setLoading(false);
      if (!syncResult.ticket) {
        setSubmitError(
          `Your ticket wasn’t created: ${syncResult.error || 'the server refused it'}. Check the details and try again.`
        );
        return;
      }
      const createdTicket = syncResult.ticket;

      const normalizedTicket = {
        ...createdTicket,
        id: createdTicket.id,
        subject: createdTicket.subject || subject.trim(),
        description: createdTicket.description || description.trim(),
        category: createdTicket.category || category,
        channel: createdTicket.channel || 'web',
        status: createdTicket.status || 'open',
        priority: createdTicket.priority || priority,
        createdDate: 'Just now',
        // Server values win; the fallbacks only cover an offline-queued ticket.
        customer: createdTicket.customer || {
          name: user?.name || 'Customer',
          email: user?.email || '',
          company: user?.company || '',
          avatarInitials: user?.avatarInitials || 'CU',
        },
        assignedTo: createdTicket.assignedTo || 'Auto-Routing Queue',
        slaRemaining: createdTicket.slaRemaining || (priority === 'urgent' ? '15m' : priority === 'high' ? '1h' : '4h'),
        slaStatus: createdTicket.slaStatus || (priority === 'urgent' ? 'at-risk' : 'safe'),
        updatedAt: 'Just now',
        tags: [category.toLowerCase().split(' ')[0], priority],
        attachments: attachments.map((att) =>
          typeof att === 'string'
            ? att
            : `${att.name}${att.size ? ` (${att.size})` : ''}`
        ),
        messages: createdTicket.messages || [
          {
            id: `msg-${Date.now()}`,
            senderType: 'customer',
            senderName: user?.name || 'Customer',
            time: 'Just now',
            content: description.trim(),
          },
        ],
        timeline: createdTicket.timeline || [
          {
            id: `t-${Date.now()}`,
            title: `Ticket created (#${createdTicket.id})`,
            time: 'Just now',
            by: user?.name || 'Customer',
          },
        ],
      };

      if (onCreateTicket) {
        onCreateTicket(normalizedTicket);
      }

      setResult({ ticket: normalizedTicket, online: !!syncResult.online });
    } catch (err) {
      setLoading(false);
      setSubmitError(
        `Your ticket wasn’t created${err?.message ? ` (${err.message})` : ''}. Check your connection and try again.`
      );
    }
  };

  const handleViewTicket = () => {
    if (onViewTicket) {
      onViewTicket(result.ticket);
    } else if (onNavigateBack) {
      onNavigateBack();
    }
  };

  if (result) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="New ticket" showBack onBack={onNavigateBack} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.resultSheet} accessibilityLiveRegion="polite">
            <Ionicons
              name={result.online ? 'checkmark-circle' : 'phone-portrait-outline'}
              size={32}
              color={result.online ? COLORS.success : COLORS.violet}
            />
            <Text accessibilityRole="header" style={[TYPE.title, styles.resultTitle]}>
              {result.online ? 'Ticket created' : 'Saved on this phone'}
            </Text>
            <Text style={[TYPE.numeric, styles.resultId]}>#{result.ticket.id}</Text>
            <Text style={[TYPE.body, styles.resultBody]}>
              {result.online
                ? 'The support team has it. You’ll get a notification when someone replies.'
                : 'Saved on this phone. It will send when you’re back online.'}
            </Text>
          </View>
          <AppButton title="View ticket" variant="primary" size="lg" onPress={handleViewTicket} style={styles.resultBtn} />
          <AppButton title="Done" variant="outline" onPress={onNavigateBack} style={styles.resultBtnSecondary} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="New ticket" showBack onBack={onNavigateBack} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[TYPE.body, styles.intro]}>
            Tell us what’s wrong. A person or the assistant will pick it up.
          </Text>

          <AppTextInput
            label="Subject"
            value={subject}
            autoCapitalize="sentences"
            onChangeText={(text) => {
              setSubject(text);
              if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
            }}
            placeholder="e.g. Webhook signatures fail to verify"
            error={errors.subject}
          />

          <AppTextInput
            label="Description"
            value={description}
            autoCapitalize="sentences"
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
            }}
            placeholder="What happened, what you expected, and any error message"
            multiline
            numberOfLines={4}
            error={errors.description}
          />

          <Text style={[TYPE.label, styles.fieldLabel]}>Category</Text>
          <View style={styles.chipWrap} accessibilityRole="radiogroup">
            {CATEGORIES.map((cat) => (
              <Chip key={cat} label={cat} selected={category === cat} onPress={() => setCategory(cat)} />
            ))}
          </View>

          <Text style={[TYPE.label, styles.fieldLabel]}>Priority</Text>
          <View style={styles.chipWrap} accessibilityRole="radiogroup">
            {PRIORITIES.map((p) => (
              <Chip
                key={p.key}
                label={p.label}
                selected={priority === p.key}
                pipColor={COLORS.priority[p.key].dot}
                onPress={() => setPriority(p.key)}
              />
            ))}
          </View>

          <Text style={[TYPE.label, styles.fieldLabel]}>Attachments</Text>
          {attachments.length > 0 ? (
            <View style={styles.sheet}>
              {attachments.map((att, i) => {
                const isObj = typeof att === 'object' && att !== null;
                const name = isObj ? att.name : att;
                const size = isObj ? att.size : '';
                const uri = isObj ? att.uri : null;

                return (
                  <View
                    key={isObj ? att.id || i : i}
                    style={[styles.attachmentRow, i > 0 && styles.rowDivider]}
                  >
                    {uri ? (
                      <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                    ) : (
                      <Ionicons name="document-attach-outline" size={22} color={COLORS.inkMuted} style={styles.fileIcon} />
                    )}
                    <View style={styles.attachmentText}>
                      <Text style={[TYPE.bodySmall, styles.fileName]} numberOfLines={1}>{name}</Text>
                      {size ? <Text style={[TYPE.numeric, styles.fileMeta]}>{size}</Text> : null}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${name}`}
                      onPress={() => handleRemoveAttachment(att)}
                      style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
                    >
                      <Ionicons name="close" size={20} color={COLORS.inkMuted} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : null}
          <View style={styles.attachActions}>
            <AppButton
              title="Add photos"
              variant="tonal"
              onPress={handlePickImage}
              icon={<Ionicons name="image-outline" size={18} color={COLORS.violetInk} />}
            />
            <AppButton
              title="Add sample log"
              variant="ghost"
              onPress={handleAddSampleAttachment}
              icon={<Ionicons name="document-text-outline" size={18} color={COLORS.violetInk} />}
            />
          </View>

          {submitError ? (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={[TYPE.bodySmall, styles.errorText]}>{submitError}</Text>
            </View>
          ) : null}

          <AppButton
            title="Create ticket"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            loading={loading}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  intro: { color: COLORS.inkMuted, marginBottom: SPACING.xxl },
  fieldLabel: { color: COLORS.ink, marginTop: SPACING.sm, marginBottom: SPACING.sm },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    minHeight: 40,
    paddingHorizontal: SPACING.md + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.paper,
  },
  chipSelected: { backgroundColor: COLORS.violetWash, borderColor: COLORS.violetWash },
  chipPressed: { backgroundColor: COLORS.groundDeep },
  pip: { width: 8, height: 8, borderRadius: 2, transform: [{ rotate: '45deg' }] },

  sheet: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    paddingLeft: SPACING.md,
    marginBottom: SPACING.md,
  },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingVertical: SPACING.sm },
  rowDivider: { borderTopWidth: 1, borderTopColor: COLORS.rule },
  thumb: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: COLORS.groundDeep },
  fileIcon: { width: 44, textAlign: 'center' },
  attachmentText: { flex: 1, marginLeft: SPACING.md },
  fileName: { color: COLORS.ink },
  fileMeta: { color: COLORS.inkFaint, marginTop: 2 },
  removeBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: TOUCH / 2 },
  removeBtnPressed: { backgroundColor: COLORS.groundDeep },
  attachActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },

  errorBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.errorWash,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.xxl,
  },
  errorText: { color: COLORS.error, flex: 1 },
  submitBtn: { marginTop: SPACING.xxl },

  resultSheet: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.rule,
    padding: SPACING.xl,
  },
  resultTitle: { color: COLORS.ink, marginTop: SPACING.md },
  resultId: { color: COLORS.inkMuted, marginTop: SPACING.xs },
  resultBody: { color: COLORS.ink, marginTop: SPACING.md },
  resultBtn: { marginTop: SPACING.xxl },
  resultBtnSecondary: { marginTop: SPACING.sm },
});
