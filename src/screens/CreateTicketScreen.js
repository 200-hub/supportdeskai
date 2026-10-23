import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, RADIUS } from '../theme/spacing';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { AppTextInput } from '../components/common/AppTextInput';
import { AppButton } from '../components/common/AppButton';

export const CreateTicketScreen = ({
  user,
  onCreateTicket,
  onNavigateBack,
}) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical & API');
  const [priority, setPriority] = useState('medium');
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const categories = [
    'Billing & Invoices',
    'Orders & Shipping',
    'Account & Access',
    'Technical & API',
    'General Support',
  ];

  const priorities = [
    { key: 'low', label: 'Low', color: '#64748B' },
    { key: 'medium', label: 'Medium', color: '#D97706' },
    { key: 'high', label: 'High', color: '#EA580C' },
    { key: 'urgent', label: 'Urgent', color: '#DC2626' },
  ];

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
      Alert.alert('Attachment', 'Sample file already added.');
    }
  };

  const handleRemoveAttachment = (fileToRemove) => {
    setAttachments(attachments.filter((f) => f !== fileToRemove));
  };

  const handleSubmit = () => {
    const newErrors = {};

    if (!subject.trim()) {
      newErrors.subject = 'Please enter a ticket subject.';
    } else if (subject.trim().length < 5) {
      newErrors.subject = 'Subject should be at least 5 characters.';
    }

    if (!description.trim()) {
      newErrors.description = 'Please describe your issue in detail.';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Please provide more details (minimum 10 characters).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      const newId = `SD-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTicket = {
        id: newId,
        subject: subject.trim(),
        description: description.trim(),
        category,
        channel: 'web',
        status: 'open',
        priority,
        createdDate: 'Just now',
        customer: {
          name: user?.name || 'Sarah Connor',
          email: user?.email || 'sarah.connor@cyberdyne.org',
          company: user?.company || 'Cyberdyne Systems Corp',
          avatarInitials: user?.avatarInitials || 'SC',
          tier: 'Enterprise',
          csatAvg: '4.8',
        },
        assignedTo: 'Auto-Routing Queue',
        slaRemaining: priority === 'urgent' ? '15m' : priority === 'high' ? '1h' : '4h',
        slaStatus: priority === 'urgent' ? 'at-risk' : 'safe',
        updatedAt: 'Just now',
        tags: [category.toLowerCase().split(' ')[0], priority],
        messages: [
          {
            id: `msg-${Date.now()}`,
            senderType: 'customer',
            senderName: user?.name || 'Sarah Connor',
            time: 'Just now',
            content: description.trim(),
          },
        ],
        timeline: [
          {
            id: `t-${Date.now()}`,
            title: `Ticket Created (#${newId})`,
            time: 'Just now',
            by: user?.name || 'Customer',
          },
        ],
      };

      if (onCreateTicket) {
        onCreateTicket(newTicket);
      }

      Alert.alert(
        'Ticket Submitted Successfully',
        `Ticket #${newId} has been added to your local session queue.\n\n(Demo Note: This demo adds the ticket to local application state. Connect a backend API for remote persistence.)`,
        [
          {
            text: 'View Ticket',
            onPress: () => onNavigateBack && onNavigateBack(),
          },
        ]
      );
    }, 700);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Create Support Ticket"
        subtitle="Submit inquiry for human or AI resolution"
        showBack
        onBack={onNavigateBack}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Demo Disclaimer Banner */}
          <View style={styles.demoBanner}>
            <Ionicons name="information-circle" size={15} color={COLORS.primaryNavy} style={{ marginRight: 6 }} />
            <Text style={styles.demoBannerText}>
              In local demo mode, submitted tickets are appended to your active application session.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <AppTextInput
              label="Subject *"
              value={subject}
              onChangeText={(text) => {
                setSubject(text);
                if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
              }}
              placeholder="e.g. Inability to verify webhook signatures"
              error={errors.subject}
            />

            {/* Category Selector */}
            <Text style={styles.fieldLabel}>Category *</Text>
            <View style={styles.chipWrap}>
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.7}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryChip,
                      isSelected ? styles.categoryChipSelected : styles.categoryChipUnselected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isSelected ? COLORS.white : COLORS.mainText },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Priority Selector */}
            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Priority Level *</Text>
            <View style={styles.priorityRow}>
              {priorities.map((p) => {
                const isSelected = priority === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    activeOpacity={0.7}
                    onPress={() => setPriority(p.key)}
                    style={[
                      styles.priorityBtn,
                      isSelected
                        ? { backgroundColor: p.color, borderColor: p.color }
                        : { backgroundColor: COLORS.white, borderColor: COLORS.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityBtnText,
                        { color: isSelected ? COLORS.white : COLORS.mainText },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Description Textarea */}
            <AppTextInput
              label="Detailed Description *"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
              }}
              placeholder="Explain the steps to reproduce, error codes, and business urgency..."
              multiline
              numberOfLines={4}
              error={errors.description}
              style={{ marginTop: SPACING.md }}
            />

            {/* Attachments Section */}
            <Text style={styles.fieldLabel}>Attachments</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleAddSampleAttachment}
              style={styles.attachmentButton}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={COLORS.primaryNavy} style={{ marginRight: 6 }} />
              <Text style={styles.attachmentBtnText}>Upload File / Log Dump</Text>
            </TouchableOpacity>

            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((file, i) => (
                  <View key={i} style={styles.fileChip}>
                    <Ionicons name="document-attach-outline" size={14} color={COLORS.primaryNavy} style={{ marginRight: 4 }} />
                    <Text style={styles.fileName} numberOfLines={1}>{file}</Text>
                    <TouchableOpacity onPress={() => handleRemoveAttachment(file)}>
                      <Ionicons name="close-circle" size={16} color={COLORS.secondaryText} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Submit Button */}
            <AppButton
              title="Submit Ticket"
              onPress={handleSubmit}
              variant="teal"
              size="lg"
              loading={loading}
              icon={<Ionicons name="paper-plane-outline" size={18} color={COLORS.white} />}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryNavy,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  demoBanner: {
    backgroundColor: '#CCFBF1',
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  demoBannerText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primaryNavy,
    flex: 1,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.mainText,
    marginBottom: SPACING.xs + 2,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.xs,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.xs + 2,
    marginBottom: SPACING.xs + 2,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primaryNavy,
    borderColor: COLORS.primaryNavy,
  },
  categoryChipUnselected: {
    backgroundColor: COLORS.lightBg,
    borderColor: COLORS.border,
  },
  categoryChipText: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.medium,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  priorityBtnText: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  attachmentButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: COLORS.lightBg,
    marginBottom: SPACING.sm,
  },
  attachmentBtnText: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.primaryNavy,
  },
  attachmentsList: {
    marginBottom: SPACING.md,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  fileName: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primaryNavy,
    flex: 1,
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
});
