import { Text, StyleSheet } from 'react-native';
import { tokens } from '@/constants/tokens';
import { formatDateLabel } from '@/lib/date';

export function TimingChip({ scheduledDate }: { scheduledDate?: string }) {
  return <Text style={styles.chip}>{formatDateLabel(scheduledDate)}</Text>;
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    color: tokens.color.accentDark,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 5,
  },
});
