import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { KnowledgeMap, KnowledgeCategory, hashColor } from '@/components/KnowledgeMap';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TipCard } from '@/components/TipCard';
import { TopMarquee } from '@/components/TopMarquee';
import { colors, radius, shadow, spacing } from '@/theme';
import { getTips, updateTip } from '@/lib/tipsStorage';
import { Tip } from '@/types/tip';

export default function MyTipsScreen() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const load = useCallback(async () => setTips(await getTips()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const myTips = useMemo(
    () => tips.filter((t) => t.status === 'done').sort((a, b) => b.priority - a.priority || b.updatedAt.localeCompare(a.updatedAt)),
    [tips],
  );

  const knowledgeCategories = useMemo<KnowledgeCategory[]>(() => {
    const map = new Map<string, number>();
    for (const t of myTips) {
      const cat = t.category?.trim() || 'その他';
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
      color: hashColor(name),
    }));
  }, [myTips]);

  const weekCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return myTips.filter((t) => new Date(t.updatedAt).getTime() >= weekAgo).length;
  }, [myTips]);

  const toggleStatus = useCallback(async (tip: Tip) => {
    await updateTip(tip.id, { status: tip.status });
    await load();
  }, [load]);

  const filteredTips = useMemo(
    () => selectedCategory
      ? myTips.filter((t) => (t.category?.trim() || 'その他') === selectedCategory)
      : myTips,
    [myTips, selectedCategory],
  );

  const marqueeMessages = myTips.length === 0
    ? ['実行済みにしたTipsがここに蓄積されます。']
    : [`${myTips.length}件のTipsを実行済み。`, ...(weekCount >= 1 ? [`今週${weekCount}件実行。`] : [])];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TopMarquee messages={marqueeMessages} />
      <ScreenHeader title="MyTips" subtitle={`あなたの型 — ${myTips.length}件`} />

      {myTips.length > 0 ? (
        <>
          <KnowledgeMap
            categories={knowledgeCategories}
            totalCount={myTips.length}
            weekCount={weekCount}
            onCategoryPress={(name) =>
              setSelectedCategory((prev) => (prev === name ? null : name))
            }
          />

          {selectedCategory ? (
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{selectedCategory}</Text>
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Text style={styles.clearFilter}>すべて表示</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.countRow}>
            <Text style={styles.countText}>{filteredTips.length}件</Text>
            <Text style={styles.sortLabel}>優先度順</Text>
          </View>

          {filteredTips.map((tip) => (
            <TipCard key={tip.id} tip={tip} showCheckbox onStatusToggle={toggleStatus} />
          ))}
        </>
      ) : (
        <View style={styles.emptyWrap}>
          <EmptyState
            title="MyTipsはまだ空です"
            body={'LibraryやTips詳細で「実行済み」にすると\nここに自分の型として蓄積されます。'}
          />
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.libraryButton}
            onPress={() => router.push('/(tabs)/board')}
          >
            <Text style={styles.libraryButtonText}>Libraryを開く →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 110 },

  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  clearFilter: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  countRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  countText: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
  sortLabel: { color: colors.inkMuted, fontSize: 11 },

  emptyWrap: { gap: spacing.md },
  libraryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: 16,
    ...shadow.button,
  },
  libraryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
