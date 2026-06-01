import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

type Category = {
  name: string;
  count: number;
  color: string;
};

type Props = {
  categories: Category[];
  title?: string;
  subtitle?: string;
};

export function CategoryBarChart({ categories, title, subtitle }: Props) {
  if (categories.length === 0) return null;

  const sorted = [...categories].sort((a, b) => b.count - a.count).slice(0, 7);
  const maxCount = sorted[0].count;

  return (
    <View style={styles.card}>
      <View style={styles.chartHeader}>
        <Text style={styles.title}>{title ?? 'カテゴリ別実行数'}</Text>
        {subtitle ? <Text style={styles.chartSubtitle}>{subtitle}</Text> : null}
      </View>
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    color: colors.ink,
    fontSize: 12.5,
    fontWeight: '700',
  },
  chartSubtitle: {
    color: colors.inkMuted,
    fontSize: 10,
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
