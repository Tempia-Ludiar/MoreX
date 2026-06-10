import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { CheckBurst, CheckBurstHandle } from '@/components/CheckBurst';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { PressableScale } from '@/components/PressableScale';
import { todayKey } from '@/lib/date';
import { countMyTips, getCurrentBillingPlan, getUpgradeMessage, isAtLimit } from '@/lib/billing';
import { getTips, updateTip } from '@/lib/tipsStorage';
import { colors, gradients, motion, radius, shadow, spacing } from '@/theme';
import { Tip } from '@/types/tip';

const TODAY_TARGET = 3;

// ── 今日の1枚 ────────────────────────────────────────────────
function TodayCard({ tip, onDone }: { tip: Tip; onDone: () => void }) {
  const checkRef = useRef<CheckBurstHandle>(null);

  const handleCheck = () => {
    checkRef.current?.burst();
    Vibration.vibrate(8);
    onDone();
  };

  return (
    <View style={styles.todayCard}>
      <PressableScale
        containerStyle={styles.todayCardOpen}
        style={styles.todayCardOpenInner}
        onPress={() => router.push(`/tips/${tip.id}`)}
      >
        <Text style={styles.todayCardTitle} numberOfLines={2}>{tip.title || '無題のTips'}</Text>
      </PressableScale>
      <TouchableOpacity
        onPress={handleCheck}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.todayCardCheck}
        accessibilityRole="button"
        accessibilityLabel="完了にする"
      >
        <CheckBurst ref={checkRef} done={false} size={30} />
      </TouchableOpacity>
    </View>
  );
}

// ── あとで／実行済みの1行 ────────────────────────────────────
function LaterRow({ tip, onDone, onPinToday }: { tip: Tip; onDone: () => void; onPinToday: () => void }) {
  const checkRef = useRef<CheckBurstHandle>(null);

  const handleCheck = () => {
    checkRef.current?.burst();
    Vibration.vibrate(8);
    onDone();
  };

  return (
    <View style={styles.row}>
      <PressableScale
        containerStyle={styles.rowOpen}
        style={styles.rowOpenInner}
        onPress={() => router.push(`/tips/${tip.id}`)}
      >
        <Text style={styles.rowTitle} numberOfLines={1}>{tip.title || '無題のTips'}</Text>
      </PressableScale>
      <PressableScale onPress={onPinToday} style={styles.pinBtn}>
        <Text style={styles.pinBtnText}>今日</Text>
      </PressableScale>
      <TouchableOpacity
        onPress={handleCheck}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="完了にする"
      >
        <CheckBurst ref={checkRef} done={false} size={24} />
      </TouchableOpacity>
    </View>
  );
}

function DoneRow({ tip }: { tip: Tip }) {
  return (
    <View style={styles.row}>
      <PressableScale
        containerStyle={styles.rowOpen}
        style={styles.rowOpenInner}
        onPress={() => router.push(`/tips/${tip.id}`)}
      >
        <Text style={[styles.rowTitle, styles.rowTitleDone]} numberOfLines={1}>
          {tip.title || '無題のTips'}
        </Text>
      </PressableScale>
      {tip.isInMyTips ? <Text style={styles.doneStar}>★</Text> : null}
      <Text style={styles.doneCheck}>✓</Text>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────
export default function TodoScreen() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [showLater, setShowLater] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [completionTip, setCompletionTip] = useState<Tip | null>(null);

  const load = useCallback(async () => {
    try {
      setTips(await getTips());
    } catch (error) {
      Alert.alert('クラウド保存を確認してください', error instanceof Error ? error.message : 'Tipsを読み込めませんでした。');
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const ensureCanAddMyTips = useCallback(async () => {
    const plan = await getCurrentBillingPlan();
    if (!isAtLimit(plan, 'myTips', countMyTips(tips))) return true;
    const message = getUpgradeMessage('myTips');
    Alert.alert(message.title, message.body, [
      { text: 'あとで', style: 'cancel' },
      { text: 'Plusを見る', onPress: () => router.push('/plus') },
    ]);
    return false;
  }, [tips]);

  const handleDone = useCallback(async (tip: Tip) => {
    try {
      await updateTip(tip.id, { status: 'done' });
      await load();
      setCompletionTip(tip);
    } catch (error) {
      Alert.alert('更新できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    }
  }, [load]);

  const handlePinToday = useCallback(async (tip: Tip) => {
    try {
      await updateTip(tip.id, { scheduledDate: todayKey() });
      await load();
    } catch (error) {
      Alert.alert('更新できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    }
  }, [load]);

  const handleCompletionMyTips = useCallback(async () => {
    if (!completionTip) return;
    if (!(await ensureCanAddMyTips())) return;
    await updateTip(completionTip.id, { isInMyTips: true });
    setCompletionTip(null);
    await load();
  }, [completionTip, ensureCanAddMyTips, load]);

  const handleCompletionDismiss = useCallback(() => {
    setCompletionTip(null);
  }, []);

  const visibleTips = useMemo(() => tips.filter((t) => t.status !== 'trash'), [tips]);
  const todos = useMemo(
    () => visibleTips
      .filter((t) => t.status === 'todo')
      .sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt)),
    [visibleTips],
  );
  const doneTips = useMemo(
    () => visibleTips
      .filter((t) => t.status === 'done')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [visibleTips],
  );

  const tk = todayKey();
  const doneToday = useMemo(
    () => doneTips.filter((t) => t.updatedAt.slice(0, 10) === tk).length,
    [doneTips, tk],
  );

  // 期限切れ・今日締切を最優先、残り枠を優先度順で埋める
  const todayList = useMemo(() => {
    const due = todos.filter((t) => t.scheduledDate && t.scheduledDate <= tk);
    const remaining = Math.max(0, TODAY_TARGET - doneToday);
    const fillCount = Math.max(due.length, remaining);
    const rest = todos.filter((t) => !due.includes(t));
    return [...due, ...rest].slice(0, fillCount);
  }, [todos, doneToday, tk]);

  const laterList = useMemo(
    () => todos.filter((t) => !todayList.includes(t)),
    [todos, todayList],
  );

  const totalSlots = Math.min(doneToday + todayList.length, 7);
  const filledSlots = Math.min(doneToday, totalSlots);

  return (
    <>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient colors={gradients.screenTint} style={styles.bgTint} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>今日やる</Text>
        {totalSlots > 0 ? (
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{filledSlots}/{totalSlots}</Text>
            <View style={styles.dotsRow}>
              {Array.from({ length: totalSlots }, (_, i) => (
                <View key={i} style={[styles.dot, i < filledSlots && styles.dotFilled]} />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* 今日の一覧 */}
      {visibleTips.length === 0 ? (
        <FadeSlideIn style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyTitle}>まだTipsがありません</Text>
          <Text style={styles.emptyBody}>Xで見つけた有益Tipsを保存して、ここから実行に変えましょう。</Text>
          <PressableScale style={styles.emptyBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.emptyBtnText}>Tipsを保存する</Text>
          </PressableScale>
        </FadeSlideIn>
      ) : todayList.length === 0 ? (
        <FadeSlideIn style={styles.celebrateCard}>
          <Text style={styles.celebrateIcon}>🎉</Text>
          <Text style={styles.celebrateTitle}>今日の分は完了！</Text>
          {laterList.length > 0 ? (
            <Text style={styles.celebrateBody}>「あとで」から前倒ししてもOK</Text>
          ) : null}
        </FadeSlideIn>
      ) : (
        <View style={styles.todayList}>
          {todayList.map((tip, i) => (
            <FadeSlideIn key={tip.id} delay={Math.min(i, motion.staggerMax) * motion.staggerStep}>
              <TodayCard tip={tip} onDone={() => handleDone(tip)} />
            </FadeSlideIn>
          ))}
        </View>
      )}

      {/* あとで */}
      {laterList.length > 0 ? (
        <View style={styles.section}>
          <PressableScale style={styles.sectionHeader} onPress={() => setShowLater((v) => !v)}>
            <Text style={styles.sectionTitle}>あとで <Text style={styles.sectionCount}>{laterList.length}</Text></Text>
            <Text style={styles.sectionChevron}>{showLater ? '▾' : '▸'}</Text>
          </PressableScale>
          {showLater ? (
            <View style={styles.rowList}>
              {laterList.map((tip) => (
                <LaterRow
                  key={tip.id}
                  tip={tip}
                  onDone={() => handleDone(tip)}
                  onPinToday={() => handlePinToday(tip)}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* 実行済み */}
      {doneTips.length > 0 ? (
        <View style={styles.section}>
          <PressableScale style={styles.sectionHeader} onPress={() => setShowDone((v) => !v)}>
            <Text style={styles.sectionTitle}>実行済み <Text style={styles.sectionCount}>{doneTips.length}</Text></Text>
            <Text style={styles.sectionChevron}>{showDone ? '▾' : '▸'}</Text>
          </PressableScale>
          {showDone ? (
            <View style={styles.rowList}>
              {doneTips.map((tip) => (
                <DoneRow key={tip.id} tip={tip} />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>

    {/* 完了後ボトムシート */}
    {completionTip ? (
      <Modal
        transparent
        animationType="slide"
        visible
        onRequestClose={handleCompletionDismiss}
      >
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={handleCompletionDismiss}
        >
          <View style={styles.bsSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.bsHandle} />
            <View style={styles.bsTitleRow}>
              <CheckBurst done burstOnMount size={32} />
              <Text style={styles.bsTitle}>実行完了！</Text>
            </View>
            <Text style={styles.bsTipTitle} numberOfLines={1}>
              {completionTip.title || '無題のTips'}
            </Text>
            <Text style={styles.bsBody}>
              このTipsをMyTipsに残しますか？{'\n'}
              MyTipsは「実行してよかったTips」だけを集めた、あなた専用の知識棚です。
            </Text>
            <PressableScale style={styles.bsPrimary} onPress={handleCompletionMyTips}>
              <Text style={styles.bsPrimaryText}>★ MyTipsに残す</Text>
            </PressableScale>
            <PressableScale style={styles.bsSecondary} onPress={handleCompletionDismiss}>
              <Text style={styles.bsSecondaryText}>完了だけにする</Text>
            </PressableScale>
          </View>
        </TouchableOpacity>
      </Modal>
    ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.lg, paddingBottom: 110, paddingHorizontal: spacing.lg },
  bgTint: { height: 260, left: -spacing.lg, position: 'absolute', right: -spacing.lg, top: 0 },

  // Header
  header: { paddingTop: 64, gap: spacing.sm },
  headerTitle: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  progressRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  progressText: { color: colors.inkSub, fontSize: 14, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: {
    backgroundColor: 'rgba(20,20,40,0.12)',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  dotFilled: { backgroundColor: colors.green },

  // Today cards
  todayList: { gap: spacing.md },
  todayCard: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.card,
  },
  todayCardOpen: { flex: 1, minWidth: 0 },
  todayCardOpenInner: { flex: 1 },
  todayCardTitle: { color: colors.ink, fontSize: 16, fontWeight: '700', letterSpacing: -0.2, lineHeight: 23 },
  todayCardCheck: { padding: 2 },

  // Sections (あとで / 実行済み)
  section: { gap: spacing.sm },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  sectionCount: { color: colors.inkMuted, fontWeight: '600' },
  sectionChevron: { color: colors.inkMuted, fontSize: 14 },
  rowList: { gap: spacing.sm },

  row: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadow.cardSoft,
  },
  rowOpen: { flex: 1, minWidth: 0 },
  rowOpenInner: { flex: 1 },
  rowTitle: { color: colors.ink, fontSize: 14.5, fontWeight: '600' },
  rowTitleDone: { color: colors.inkMuted, textDecorationLine: 'line-through' },
  pinBtn: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  pinBtnText: { color: colors.accentDeep, fontSize: 12, fontWeight: '700' },
  doneStar: { color: '#ffcc00', fontSize: 15 },
  doneCheck: { color: colors.green, fontSize: 15, fontWeight: '800' },

  // Empty / celebrate
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    gap: spacing.sm,
    padding: spacing.xxl,
    ...shadow.card,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  emptyBody: { color: colors.inkSub, fontSize: 13.5, lineHeight: 21, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  emptyBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  celebrateCard: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    gap: 6,
    padding: spacing.xl,
    ...shadow.card,
  },
  celebrateIcon: { fontSize: 34 },
  celebrateTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  celebrateBody: { color: colors.inkMuted, fontSize: 13 },

  // Completion bottom sheet
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bsSheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: 44,
  },
  bsHandle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 4,
    marginBottom: spacing.xs,
    width: 40,
  },
  bsTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  bsTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  bsTipTitle: { color: colors.inkSub, fontSize: 13.5, marginTop: -spacing.xs },
  bsBody: { color: colors.inkSub, fontSize: 13.5, lineHeight: 21 },
  bsPrimary: {
    alignItems: 'center',
    backgroundColor: '#3a1a6e',
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  bsPrimaryText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  bsSecondary: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 12,
  },
  bsSecondaryText: { color: colors.inkSub, fontSize: 14, fontWeight: '600' },
});
