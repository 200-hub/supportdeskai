import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { AppButton } from './AppButton';

export const EmptyState = ({
  icon = 'file-tray-outline',
  title = 'Nothing here yet',
  message = 'New items will appear here.',
  actionLabel,
  onAction,
  style,
}) => (
  <View style={[styles.container, style]}>
    <Ionicons name={icon} size={40} color={COLORS.violet} style={styles.icon} />
    <Text style={[TYPE.titleSmall, styles.title]}>{title}</Text>
    <Text style={[TYPE.body, styles.message]}>{message}</Text>
    {actionLabel && onAction ? (
      <AppButton title={actionLabel} onPress={onAction} variant="tonal" size="sm" style={styles.action} />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: SPACING.xxxl, paddingHorizontal: SPACING.xxl },
  icon: { marginBottom: SPACING.md },
  title: { color: COLORS.ink, textAlign: 'center', marginBottom: SPACING.xs },
  message: { color: COLORS.inkMuted, textAlign: 'center', maxWidth: 300 },
  action: { marginTop: SPACING.lg },
});
