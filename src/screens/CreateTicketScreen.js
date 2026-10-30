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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  onViewTicket,
}) => {
  const insets = useSafeAreaInsets();
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
    { key: 'urgent', label: 'Urgent', color: '#DC3545' },
  ];

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
            'Permission Denied',
            'Permission to access your photos is required to attach images.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAttachments = result.assets.map((asset) => ({
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
      Alert.alert('Attachment Error', 'Could not open device media library.');
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
      Alert.alert('Attachment', 'Sample file already added.');
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
        attachments: attachments.map((att) =>
          typeof att === 'string'
            ? att
            : `${att.name}${att.size ? ` (${att.size})` : ''}`
        ),
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
            onPress: () => {
              if (onViewTicket) {
                onViewTicket(newTicket);
              } else if (onNavigateBack) {
                onNavigateBack();
              }
            },
          },
        ]
      );
    }, 600);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Create Support Ticket"
        subtitle="Submit inquiry for human or AI resolution"
        showBack
        onBack={onNavigateBack}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Demo Disclaimer Banner */}
          <View style={styles.demoBanner}>
            <Ionicons name="information-circle-outline" size={15} color={COLORS.primaryNavy} style={{ marginRight: 6 }} />
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
                      numberOfLines={1}
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
<<<<<<< HEAD
            <View style={styles.attachmentButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePickImage}
                style={styles.attachmentButton}
              >
                <Ionicons name="image-outline" size={18} color={COLORS.primaryNavy} style={{ marginRight: 6 }} />
                <Text style={styles.attachmentBtnText}>Choose from Photos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleAddSampleAttachment}
                style={styles.sampleAttachmentBtn}
              >
                <Ionicons name="document-text-outline" size={15} color={COLORS.secondaryText} style={{ marginRight: 4 }} />
                <Text style={styles.sampleAttachmentBtnText}>+ Sample Log</Text>
              </TouchableOpacity>
            </View>
=======
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleAddSampleAttachment}
              style={styles.attachmentButton}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={COLORS.primaryNavy} style={{ marginRight: 6 }} />
              <Text style={styles.attachmentBtnText}>Upload File / Log Dump</Text>
            </TouchableOpacity>
>>>>>>> 27a643b791f9a6e484ca08e0a9a840cd59066285

            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((att, i) => {
                  const isObj = typeof att === 'object' && att !== null;
                  const name = isObj ? att.name : att;
                  const size = isObj ? att.size : '';
                  const uri = isObj ? att.uri : null;

                  return (
                    <View key={isObj ? att.id || i : i} style={styles.attachmentCard}>
                      {uri ? (
                        <Image
                          source={{ uri }}
                          style={styles.attachmentThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.attachmentIconBox}>
                          <Ionicons name="document-attach" size={20} color={COLORS.primaryNavy} />
                        </View>
                      )}
                      <View style={styles.attachmentDetails}>
                        <Text style={styles.fileName} numberOfLines={1}>{name}</Text>
                        {size ? <Text style={styles.fileMeta}>{size}</Text> : null}
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRemoveAttachment(att)}
                        style={styles.removeAttachmentBtn}
                      >
                        <Ionicons name="close-circle" size={18} color={COLORS.secondaryText} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    flexGrow: 1,
  },
  demoBanner: {
    backgroundColor: '#F0FDFA',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
    padding: SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  demoBannerText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primaryNavy,
    flex: 1,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
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
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  priorityBtnText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  attachmentButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  attachmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: COLORS.lightBg,
    marginRight: SPACING.xs + 2,
  },
  attachmentBtnText: {
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.primaryNavy,
  },
  sampleAttachmentBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: COLORS.white,
  },
  sampleAttachmentBtnText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.secondaryText,
  },
  attachmentsList: {
    marginBottom: SPACING.md,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xs + 2,
    marginBottom: SPACING.xs + 2,
  },
  attachmentThumb: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.lightBg,
  },
  attachmentIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
    justifyContent: 'center',
  },
  fileMeta: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  removeAttachmentBtn: {
    padding: SPACING.xs,
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
