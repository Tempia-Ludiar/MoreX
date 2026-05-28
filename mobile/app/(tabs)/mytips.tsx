import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { AchievementSummary } from '@/components/AchievementSummary';
import { CategoryBarChart } from '@/components/CategoryBarChart';
import { KnowledgeMap, KnowledgeCategory, hashColor } from '@/components/KnowledgeMap';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TipCard } from '@/components/TipCard';
import { colors, radius, shadow, spacing } from '@/theme';
import { getTips, updateTip } from '@/lib/tipsStorage';
import { Tip } from '@/types/tip';

const FLOW_STEPS = [
  { icon: '💾', label: '保存する', color: colors.accent, bg: colors.accentSoft },
  { icon: '✓', label: '実行する', color: colors.green, bg: '#e6f9f0' },
  { icon: '★', label: '蓄積される', color: colors.orange, bg: '#fff3eb' },
];

const KPI_ITEMS = [
  { label: '累計実行' },
  { label: '今週実行' },
  { label: '連続記録' },
];

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

  // Consecutive-day streak: count days going back from today with ≥1 done tip
  const streakDays = useMemo(() => {
    const doneDates = new Set(myTips.map((t) => t.updatedAt.slice(0, 10)));
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (doneDates.has(d.toISOString().slice(0, 10))) {
        count++;
      } else {
        break;
      }
    }
    return count;
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="MyTips"
        subtitle={`あなたの型 — ${myTips.length}件蓄積`}
      />

      {myTips.length > 0 ? (
        <>
          {/* 3-KPI achievement summary */}
          <AchievementSummary
            total={myTips.length}
            week={weekCount}
            streak={streakDays}
          />

          <KnowledgeMap
            categories={knowledgeCategories}
            totalCount={myTips.length}
            weekCount={weekCount}
            onCategoryPress={(name) =>
              setSelectedCategory((prev) => (prev === name ? null : name))
            }
          />

          <CategoryBarChart categories={knowledgeCategories} />

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
          {/* Motivational hero card */}
          <LinearGradient
            colors={['#1a1a2e', '#241b40']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroGlowBlob} />
            <Text style={styles.heroEyebrow}>★  あなたの知識の型</Text>
            <Text style={styles.heroTitle}>実行が、{'\n'}自分の型になる。</Text>
            <Text style={styles.heroBody}>
              TipsをLibraryで「実行済み」にするたびに{'\n'}ここに蓄積されていきます。
            </Text>
          </LinearGradient>

          {/* 3-step flow */}
          <View style={styles.flowCard}>
            {FLOW_STEPS.map((step, i) => (
              <View key={step.label} style={styles.flowItem}>
                <View style={[styles.flowIcon, { backgroundColor: step.bg }]}>
                  <Text style={[styles.flowIconText, { color: step.color }]}>{step.icon}</Text>
                </View>
                <Text style={styles.flowLabel}>{step.label}</Text>
                {i < FLOW_STEPS.length - 1 && (
                  <Text style={styles.flowArrow}>→</Text>
                )}
              </View>
            ))}
          </View>

          {/* Zero-state KPI preview */}
          <View style={styles.kpiRow}>
            {KPI_ITEMS.map((kpi) => (
              <View key={kpi.label} style={styles.kpiItem}>
                <Text style={styles.kpiValue}>—</Text>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.libraryButton}
            onPress={() => router.push('/(tabs)/board')}
          >
            <Text style={styles.libraryButtonText}>LibraryでTipsを実行する →</Text>
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
  categoryTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  clearFilter: { color: colors.accent, fontSize: 13, fontWeight: '600' },

  countRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  countText: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
  sortLabel: { color: colors.inkMuted, fontSize: 11 },

  emptyWrap: { gap: spacing.md },

  // Motivational hero card
  heroCard: {
    borderRadius: radius.xl,
    gap: spacing.sm,
    overflow: 'hidden',
    padding: spacing.xl,
    paddingBottom: 28,
    ...shadow.button,
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },
  heroGlowBlob: {
    backgroundColor: 'rgba(99,102,241,0.22)',
    borderRadius: 60,
    height: 120,
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },

  // 3-step flow
  flowCard: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  flowItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flowIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  flowIconText: { fontSize: 18 },
  flowLabel: { color: colors.inkSub, fontSize: 11, fontWeight: '600' },
  flowArrow: { color: colors.border, fontSize: 16, fontWeight: '700', marginHorizontal: 2 },

  // Zero-state KPI preview
  kpiRow: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    flexDirection: 'row',
    ...shadow.cardSoft,
    overflow: 'hidden',
  },
  kpiItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    paddingVertical: spacing.md,
  },
  kpiValue: {
    color: colors.inkMuted,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  kpiLabel: { color: colors.inkMuted, fontSize: 10, fontWeight: '600' },

  libraryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: 16,
    ...shadow.button,
  },
  libraryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
