import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { CategoryChip } from '@/components/CategoryChip';
import { StatusChip } from '@/components/StatusChip';
import { TimingChip } from '@/components/TimingChip';
import { tokens } from '@/constants/tokens';
import { Tip } from '@/types/tip';

type Props = {
  tip: Tip;
  compact?: boolean;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

export function TipCard({ tip, compact }: Props) {
  const preview = tip.memo || tip.content || 'スクリーンショットだけで保存されています';
  return (
    <TouchableOpacity activeOpacity={0.84} style={[styles.card, compact && styles.compact]} onPress={() => router.push(`/tips/${tip.id}`)}>
      {tip.imageUri ? <Image source={{ uri: tip.imageUri }} style={styles.image} /> : null}
      <View style={styles.metaRow}>
        <CategoryChip category={tip.category} />
        <StatusChip status={tip.status} />
        <TimingChip scheduledDate={tip.scheduledDate} />
        <Text style={styles.priority}>P{tip.priority}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{tip.title || '無題のTips'}</Text>
      <Text style={styles.preview} numberOfLines={compact ? 2 : 4}>{preview}</Text>
      <Text style={styles.date}>{formatDate(tip.createdAt)} に保存</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    ...tokens.shadow.card,
  },
  compact: {
    shadowOpacity: 0,
    elevation: 0,
  },
  image: {
    backgroundColor: tokens.color.surfaceSoft,
    borderRadius: tokens.radius.md,
    height: 150,
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  title: {
    color: tokens.color.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  preview: {
    color: tokens.color.text,
    fontSize: 14,
    lineHeight: 21,
  },
  memo: {
    color: tokens.color.mutedText,
    fontSize: 13,
    lineHeight: 19,
  },
  date: {
    color: tokens.color.mutedText,
    fontSize: 12,
    fontWeight: '700',
  },
  priority: {
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    color: tokens.color.text,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 5,
  },
});
