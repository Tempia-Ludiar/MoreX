import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getPriorityMeta } from '@/constants/priority';
import { colors, radius, spacing } from '@/theme';

const BUCKETS = [
  { key: 'low'  as const, label: '低', sub: 'あとで',   snap: 20 },
  { key: 'mid'  as const, label: '中', sub: '試したい', snap: 55 },
  { key: 'high' as const, label: '高', sub: 'すぐやる', snap: 85 },
];

export const getBucketFromPriority = (p: number): 'low' | 'mid' | 'high' =>
  p >= 75 ? 'high' : p >= 50 ? 'mid' : 'low';

type Props = {
  value: number;
  onChange: (priority: number) => void;
};

export function PriorityBucketToggle({ value, onChange }: Props) {
  const bucket = getBucketFromPriority(value);
  const meta = getPriorityMeta(value);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>優先度</Text>
        <View style={[styles.badge, { backgroundColor: meta.background }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>
            {meta.label} · {value}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        {BUCKETS.map((b) => {
          const isActive = bucket === b.key;
          const bMeta = getPriorityMeta(b.snap);
          return (
            <TouchableOpacity
              key={b.key}
              style={[
                styles.btn,
                isActive && { borderColor: bMeta.color, backgroundColor: bMeta.background },
              ]}
              onPress={() => onChange(b.snap)}
              activeOpacity={0.72}
            >
              <Text style={[styles.btnLabel, isActive && { color: bMeta.color }]}>
                {b.label}
              </Text>
              <Text style={[styles.btnSub, isActive && { color: bMeta.color }]}>
                {b.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flex: 1,
    gap: 2,
    paddingVertical: 12,
  },
  btnLabel: {
    color: colors.inkSub,
    fontSize: 16,
    fontWeight: '800',
  },
  btnSub: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '600',
  },
});
