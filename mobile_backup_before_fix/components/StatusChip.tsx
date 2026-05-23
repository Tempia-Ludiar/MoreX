import { Text, StyleSheet } from 'react-native';
import { getStatusMeta } from '@/constants/tips';
import { tokens } from '@/constants/tokens';
import { TipStatus } from '@/types/tip';

export function StatusChip({ status }: { status: TipStatus }) {
  const meta = getStatusMeta(status);
  return <Text style={[styles.chip, { color: meta.tone, backgroundColor: meta.background }]}>{meta.label}</Text>;
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 5,
  },
});
