import { Text, StyleSheet } from 'react-native';
import { tokens } from '@/constants/tokens';

export function CategoryChip({ category }: { category?: string }) {
  return <Text style={styles.chip}>{category || 'その他'}</Text>;
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: tokens.color.surfaceSoft,
    borderRadius: 999,
    color: tokens.color.text,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 5,
  },
});
