import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TipCard } from '@/components/TipCard';
import { TopMarquee } from '@/components/TopMarquee';
import { statuses } from '@/constants/tips';
import { colors, radius, shadow, spacing } from '@/theme';
import { formatDateLabel } from '@/lib/date';
import { getTips, updateTip } from '@/lib/tipsStorage';
import { Tip, TipStatus } from '@/types/tip';

const all = 'all';
const dayMs = 24 * 60 * 60 * 1000;

const daysSince = (isoDate: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / dayMs));

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

  const marqueeMessages = useMemo(() => {
    const activeTips = tips.filter((t) => t.status !== 'trash');
    const todoCount = activeTips.filter((t) => t.status === 'todo').length;
    const allDone = activeTips.length > 0 && activeTips.every((t) => t.status === 'done');
    const oldestDays = activeTips.length ? Math.max(...activeTips.map((t) => daysSince(t.createdAt))) : 0;
    if (allDone) return ['すべて実行済み。新しいTipsを追加しよう。'];
    const msgs: string[] = [];
    if (todoCount >= 3) msgs.push(`未実行が ${todoCount}件 溜まっています。上から消化しよう。`);
    if (oldestDays >= 7) msgs.push(`最古のTipsは ${oldestDays}日前。実行するか不要にするか決めよう。`);
    return msgs.length ? msgs : ['今日、どれをやる？'];
  }, [tips]);

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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TopMarquee messages={marqueeMessages} />
      <ScreenHeader title="Library" subtitle={`保存中: ${tips.length}件`} />

      {/* Search */}
      <View style={styles.searchCard}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="タイトル、メモ、カテゴリで検索"
          placeholderTextColor={colors.inkMuted}
          style={styles.searchInput}
        />
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Chip label="すべて" active={category === all} onPress={() => setCategory(all)} />
        {categories.map((item) => (
          <Chip key={item} label={item} active={category === item} onPress={() => setCategory(item)} />
        ))}
      </ScrollView>

      {/* Status filter */}
      <View style={styles.statusRow}>
        <Chip label="すべて" active={status === all} onPress={() => setStatus(all)} />
        {statuses.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            active={status === item.value}
            onPress={() => setStatus(item.value as TipStatus)}
          />
        ))}
      </View>

      {/* Count row */}
      <View style={styles.countRow}>
        <Text style={styles.count}>{filteredTips.length}件</Text>
        <Text style={styles.sortLabel}>優先度順</Text>
      </View>

      {/* Tips */}
      {filteredTips.length
        ? filteredTips.map((tip) => (
            <TipCard key={tip.id} tip={tip} showCheckbox onStatusToggle={toggleStatus} />
          ))
        : <EmptyState title="該当するTipsがありません" />
      }
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 110 },

  searchCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 14,
    ...shadow.cardSoft,
  },
  searchInput: {
    color: colors.ink,
    fontSize: 13,
    paddingVertical: 4,
  },

  filterRow: { gap: spacing.sm, paddingBottom: 2 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  chip: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    ...shadow.cardSoft,
  },
  chipActive: { backgroundColor: colors.ink },
  chipText: { color: colors.inkSub, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#ffffff' },

  countRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  count: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
  sortLabel: { color: colors.inkMuted, fontSize: 11 },
});
