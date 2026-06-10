import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AchievementSummary } from '@/components/AchievementSummary';
import { CategoryBarChart } from '@/components/CategoryBarChart';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { KnowledgeMap, KnowledgeCategory, hashColor } from '@/components/KnowledgeMap';
import { PressableScale } from '@/components/PressableScale';
import { colors, spacing } from '@/theme';
import { getTips } from '@/lib/tipsStorage';
import { Tip } from '@/types/tip';

export default function MyTipsStatsScreen() {
  const [tips, setTips] = useState<Tip[]>([]);

  const load = useCallback(async () => {
    try {
      setTips(await getTips());
    } catch (error) {
      Alert.alert('クラウド保存を確認してください', error instanceof Error ? error.message : 'Tipsを読み込めませんでした。');
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const myTips = useMemo(
    () => tips.filter((t) => t.isInMyTips === true),
    [tips],
  );

  const knowledgeCategories = useMemo<KnowledgeCategory[]>(() => {
    const map = new Map<string, number>();
    for (const t of myTips) {
      const cat = t.category?.trim() || 'その他';
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({
      name, count, color: hashColor(name),
    }));
  }, [myTips]);

  const weekCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return myTips.filter((t) => new Date(t.updatedAt).getTime() >= weekAgo).length;
  }, [myTips]);

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PressableScale onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← MyTipsへ戻る</Text>
      </PressableScale>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>蓄積の記録</Text>
        <Text style={styles.headerSub}>MyTipsに残した知識 {myTips.length}件</Text>
      </View>

      <FadeSlideIn>
        <AchievementSummary total={myTips.length} week={weekCount} streak={streakDays} />
      </FadeSlideIn>

      <FadeSlideIn delay={80}>
        <KnowledgeMap
          categories={knowledgeCategories}
          totalCount={myTips.length}
          weekCount={weekCount}
          showPlusButton
          onCategoryPress={() => {}}
        />
      </FadeSlideIn>

      <FadeSlideIn delay={160}>
        <CategoryBarChart categories={knowledgeCategories} title="カテゴリ別蓄積" subtitle="MyTipsに残した知識" />
      </FadeSlideIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 60,
    paddingTop: Platform.OS === 'ios' ? 64 : spacing.xl,
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  header: { gap: 4 },
  headerTitle: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { color: colors.inkMuted, fontSize: 13 },
});
