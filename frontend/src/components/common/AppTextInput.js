import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';

export const AppTextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  isPassword = false,
  error,
  helperText,
  leftIcon,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          isFocused && styles.fieldFocused,
          error ? styles.fieldError : null,
          multiline && styles.fieldMultiline,
          !editable && styles.fieldDisabled,
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.inkFaint}
          selectionColor={COLORS.violet}
          cursorColor={COLORS.violetInk}
          secureTextEntry={isPassword && !showPassword}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          accessibilityLabel={label || placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
        />

        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eye}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.inkMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={COLORS.error} style={{ marginRight: 4 }} />
          <Text style={[TYPE.bodySmall, { color: COLORS.error }]}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={[TYPE.bodySmall, styles.helper]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.lg, width: '100%' },
  label: { ...TYPE.label, color: COLORS.ink, marginBottom: SPACING.sm },
  field: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.ruleStrong,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  fieldFocused: { borderColor: COLORS.violetInk, borderWidth: 2, paddingHorizontal: SPACING.md - 1 },
  fieldError: { borderColor: COLORS.error },
  fieldMultiline: { minHeight: 112, alignItems: 'flex-start' },
  fieldDisabled: { backgroundColor: COLORS.groundDeep },
  leftIcon: { marginRight: SPACING.sm },
  input: { ...TYPE.body, flex: 1, color: COLORS.ink, paddingVertical: SPACING.md, outlineStyle: 'none' },
  inputMultiline: { textAlignVertical: 'top' },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -SPACING.sm },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs + 2 },
  helper: { color: COLORS.inkMuted, marginTop: SPACING.xs + 2 },
});
