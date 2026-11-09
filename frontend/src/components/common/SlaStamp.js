import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPE } from '../../theme/typography';
import { RADIUS } from '../../theme/spacing';

// The SLA clock rendered as a rubber date-stamp: double ruled frame, slight tilt.
// safe → violet ink; at-risk → red ink over a lemon highlighter; done → faded ink.
export const SlaStamp = ({ remaining, status = 'safe', size = 'md' }) => {
  if (!remaining) return null;
  const done = /resolved|closed/i.test(remaining);
  const atRisk = !done && status === 'at-risk';
  const breached = !done && status === 'breached';
  const ink = breached || atRisk ? COLORS.error : done ? COLORS.inkFaint : COLORS.violetInk;
  const label = done ? remaining : breached ? `Breached ${remaining}` : `Due ${remaining}`;
  const sm = size === 'sm';

  return (
    <View
      accessibilityLabel={`SLA: ${label}`}
      style={[
        styles.outer,
        { borderColor: ink, transform: [{ rotate: '-2.5deg' }] },
        atRisk && { backgroundColor: COLORS.lemon },
        breached && { backgroundColor: COLORS.errorWash },
      ]}
    >
      <View style={[styles.inner, { borderColor: ink }, sm && styles.innerSm]}>
        <Text style={[TYPE.numeric, sm && styles.textSm, { color: ink }]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: RADIUS.xs,
    padding: 1.5,
  },
  inner: {
    borderWidth: 0.75,
    borderRadius: 1.5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  innerSm: { paddingHorizontal: 5, paddingVertical: 1 },
  textSm: { fontSize: 11, lineHeight: 14 },
});
