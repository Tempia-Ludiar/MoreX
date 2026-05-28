import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

type Props = {
  total: number;
  week: number;
  streak: number;
};

export function AchievementSummary({ total, week, streak }: Props) {
  const stats = [
    { value: String(total), label: '累計実行', color: colors.ink },
    { value: `+${week}`, label: '今週実行', color: colors.green },
    { value: `${streak}日`, label: '連続記録', color: colors.orange },
  ];

  return (
    <View style={styles.card}>
      {stats.map((stat, i) => (
        <View key={stat.label} style={[styles.cell, i < 2 && styles.cellBorder]}>
          <Text style={[styles.value, { color: stat.color }]}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadow.card,
  },
  cell: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    paddingVertical: spacing.lg,
  },
  cellBorder: {
    borderRightColor: colors.border,
    borderRightWidth: 1,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  label: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
