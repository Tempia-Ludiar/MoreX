import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TipCard } from '@/components/TipCard';
import { TodaysTipHero } from '@/components/TodaysTipHero';
import { statuses } from '@/constants/tips';
import { colors, radius, shadow, spacing } from '@/theme';
import { formatDateLabel } from '@/lib/date';
import { getTips, updateTip } from '@/lib/tipsStorage';
import { Tip, TipStatus } from '@/types/tip';

const all = 'all';
const dayMs = 24 * 60 * 60 * 1000;
const daysSince = (isoDate: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / dayMs));

// Priority bucket thresholds
const BUCKET_HIGH = 75;
const BUCKET_MID = 50;

const BUCKETS = [
  { key: 'high', label: 'High Value', dotColor: '#EA580C', min: BUCKET_HIGH, max: 100 },
  { key: 'mid', label: 'Worth Reviewing', dotColor: '#A16207', min: BUCKET_MID, max: BUCKET_HIGH - 1 },
  { key: 'low', label: 'Low Priority', dotColor: '#94A3B8', min: 1, max: BUCKET_MID - 1 },
] as const;

export default function LibraryScreen() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | typeof all>(all);
  const [status, setStatus] = useState<TipStatus | typeof all>(all);

  const load = useCallback(async () => setTips(await getTips()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleStatus = useCallback(async (tip: Tip) => {
    await updateTip(tip.id, { status: tip.status });
    await load();
  }, [load]);

  const categories = useMemo(
    () => Array.from(new Set(tips.map((t) => t.category?.trim() || 'その他'))).sort((a, b) => a.localeCompare(b, 'ja')),
    [tips],
  );

  // Highest priority non-done/trash tip for hero card
  const todaysTip = useMemo(
    () => tips
      .filter((t) => t.status !== 'done' && t.status !== 'trash')
      .sort((a, b) => b.priority - a.priority)[0] ?? null,
    [tips],
  );

  // Status counts for segment badges
  const statusCounts = useMemo(() => ({
    all: tips.length,
    todo: tips.filter((t) => t.status === 'todo').length,
    done: tips.filter((t) => t.status === 'done').length,
    trash: tips.filter((t) => t.status === 'trash').length,
  }), [tips]);

  const filteredTips = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tips
      .filter((t) => {
        const hay = [t.title, t.memo, t.content, t.category, formatDateLabel(t.scheduledDate)]
          .filter(Boolean).join(' ').toLowerCase();
        return (!needle || hay.includes(needle))
          && (category === all || (t.category?.trim() || 'その他') === category)
          && (status === all || t.status === status);
      })
      .sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt));
  }, [tips, query, category, status]);

  // Group into priority buckets
  const bucketedTips = useMemo(() => BUCKETS.map((b) => ({
    ...b,
    tips: filteredTips.filter((t) => t.priority >= b.min && t.priority <= b.max),
  })).filter((b) => b.tips.length > 0), [filteredTips]);

  const segmentOptions = [
    { key: all, label: 'すべて', count: statusCounts.all },
    { key: 'todo', label: '未実行', count: statusCounts.todo },
    { key: 'done', label: '実行済み', count: statusCounts.done },
    { key: 'trash', label: '不要', count: statusCounts.trash },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title="Library"
        subtitle={`保存中 ${tips.length}件 · 未実行 ${statusCounts.todo}件`}
      />

      {/* Today's Tip hero — only if there's an active tip */}
      {todaysTip ? <TodaysTipHero tip={todaysTip} /> : null}

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="タイトル、メモ、カテゴリで検索"
          placeholderTextColor={colors.inkMuted}
          style={styles.searchInput}
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status segmented control */}
      <View style={styles.segmented}>
        {segmentOptions.map((seg) => (
          <TouchableOpacity
            key={seg.key}
            style={[styles.segment, status === seg.key && styles.segmentActive]}
            onPress={() => setStatus(seg.key as TipStatus | typeof all)}
            activeOpacity={0.75}
          >
            <Text style={[styles.segLabel, status === seg.key && styles.segLabelActive]}>
              {seg.label}
            </Text>
            {seg.count > 0 ? (
              <View style={[styles.segBadge, status === seg.key && styles.segBadgeActive]}>
                <Text style={[styles.segBadgeText, status === seg.key && styles.segBadgeTextActive]}>
                  {seg.count}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        <CategoryChip label="すべて" active={category === all} onPress={() => setCategory(all)} />
        {categories.map((cat) => (
          <CategoryChip key={cat} label={cat} active={category === cat} onPress={() => setCategory(cat)} />
        ))}
      </ScrollView>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{filteredTips.length}件</Text>
        <Text style={styles.sortLabel}>優先度順</Text>
      </View>

      {/* Tips by priority bucket */}
      {filteredTips.length === 0 ? (
        <EmptyState title="該当するTipsがありません" />
      ) : (
        bucketedTips.map((bucket) => (
          <View key={bucket.key} style={styles.bucket}>
            <View style={styles.bucketHeader}>
              <View style={[styles.bucketDot, { backgroundColor: bucket.dotColor }]} />
              <Text style={[styles.bucketLabel, { color: bucket.dotColor }]}>{bucket.label}</Text>
              <Text style={styles.bucketCount}>{bucket.tips.length}件</Text>
            </View>
            {bucket.tips.map((tip) => (
              <TipCard key={tip.id} tip={tip} showCheckbox onStatusToggle={toggleStatus} />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function CategoryChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.catChip, active && styles.catChipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 110 },

  searchRow: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: 12,
    paddingLeft: 14,
    ...shadow.cardSoft,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
  },

  // Status segmented control
  segmented: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadow.cardSoft,
  },
  segment: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  segmentActive: {
    backgroundColor: colors.ink,
  },
  segLabel: {
    color: colors.inkSub,
    fontSize: 11,
    fontWeight: '700',
  },
  segLabelActive: {
    color: '#ffffff',
  },
  segBadge: {
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    minWidth: 16,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: 'center',
  },
  segBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  segBadgeText: {
    color: colors.inkMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  segBadgeTextActive: {
    color: '#ffffff',
  },

  // Category chips
  categoryRow: { gap: spacing.sm, paddingBottom: 2 },
  catChip: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    ...shadow.cardSoft,
  },
  catChipActive: { backgroundColor: colors.ink },
  catChipText: { color: colors.inkSub, fontSize: 12, fontWeight: '600' },
  catChipTextActive: { color: '#ffffff' },

  countRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  countText: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
  sortLabel: { color: colors.inkMuted, fontSize: 11 },

  // Priority buckets
  bucket: { gap: spacing.sm },
  bucketHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 2,
  },
  bucketDot: {
    borderRadius: 3,
    height: 8,
    width: 8,
  },
  bucketLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bucketCount: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
