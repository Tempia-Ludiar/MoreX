import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

type Category = {
  name: string;
  count: number;
  color: string;
};

type Props = {
  categories: Category[];
};

export function CategoryBarChart({ categories }: Props) {
  if (categories.length === 0) return null;

  const sorted = [...categories].sort((a, b) => b.count - a.count).slice(0, 7);
  const maxCount = sorted[0].count;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>カテゴリ別実行数</Text>
      <View style={styles.bars}>
        {sorted.map((cat) => {
          const pct = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
          return (
            <View key={cat.name} style={styles.barRow}>
              <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.max(pct, 4)}%` as any, backgroundColor: cat.color },
                  ]}
                />
              </View>
              <Text style={styles.countLabel}>{cat.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.card,
  },
  title: {
    color: colors.inkSub,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bars: { gap: spacing.sm },
  barRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  catName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
    width: 72,
  },
  track: {
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radius.pill,
    height: '100%',
  },
  countLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'right',
  },
});
