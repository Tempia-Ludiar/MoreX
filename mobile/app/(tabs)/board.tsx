import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { CheckBurst, CheckBurstHandle } from '@/components/CheckBurst';
import { EmptyState } from '@/components/EmptyState';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { PressableScale } from '@/components/PressableScale';
import { StarPop } from '@/components/StarPop';
import { useReducedMotion } from '@/lib/motion';
import { colors, gradients, motion, radius, shadow, spacing } from '@/theme';
import { countMyTips, getCurrentBillingPlan, getUpgradeMessage, isAtLimit } from '@/lib/billing';
import { deleteTip, getTips, updateTip } from '@/lib/tipsStorage';
import { Tip } from '@/types/tip';

const all = 'all' as const;
type StatusFilter = 'todo' | 'done' | typeof all;

const KNOWN_SOURCES = ['ChatGPT', 'Claude', 'Codex', 'X', 'YouTube', 'note', 'Web'] as const;

const STATUS_DISPLAY: Record<string, { label: string; bg: string; text: string }> = {
  todo:  { label: '未実行', bg: colors.accentSoft,  text: colors.accentDeep },
  done:  { label: '完了', bg: colors.greenSoft,   text: '#1a8a3c' },
  trash: { label: '不要', bg: '#f5f5f7',          text: colors.inkMuted },
};

function getSourceKey(category?: string): string {
  const cat = category?.trim();
  if (!cat) return 'Other';
  return (KNOWN_SOURCES as readonly string[]).includes(cat) ? cat : 'Other';
}

function formatDateHint(scheduledDate?: string): string {
  if (!scheduledDate) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(scheduledDate);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return '期限切れ';
  if (diff === 0) return '今日中';
  if (diff === 1) return '明日';
  if (diff <= 7) return `${diff}日後`;
  if (diff <= 14) return '来週';
  return `${Math.ceil(diff / 7)}週後`;
}

// ── Progress Board ────────────────────────────────────────────
function ProgressBoard({
  statusFilter,
  onFilter,
  counts,
}: {
  statusFilter: StatusFilter;
  onFilter: (f: StatusFilter) => void;
  counts: { all: number; todo: number; done: number };
}) {
  const doneRatio = counts.all > 0 ? counts.done / counts.all : 0;
  const allDone = counts.todo === 0 && counts.all > 0;
  const fillAnim = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      fillAnim.setValue(doneRatio);
      return;
    }
    const animation = Animated.timing(fillAnim, {
      toValue: doneRatio,
      duration: 600,
      useNativeDriver: false, // widthアニメのため
    });
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneRatio, reduced]);

  const fillWidth = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const filterCards: Array<{
    key: StatusFilter;
    label: string;
    count: number;
    inactiveBg: string;
    activeBg: string;
    inactiveCount: string;
    inactiveLabel: string;
  }> = [
    {
      key: all,
      label: 'すべて',
      count: counts.all,
      inactiveBg: 'rgba(255,255,255,0.08)',
      activeBg: 'rgba(255,255,255,0.20)',
      inactiveCount: 'rgba(255,255,255,0.60)',
      inactiveLabel: 'rgba(255,255,255,0.42)',
    },
    {
      key: 'todo',
      label: '未実行',
      count: counts.todo,
      inactiveBg: 'rgba(99,102,241,0.15)',
      activeBg: 'rgba(99,102,241,0.52)',
      inactiveCount: '#a5b4fc',
      inactiveLabel: 'rgba(165,180,252,0.70)',
    },
    {
      key: 'done',
      label: '実行済み',
      count: counts.done,
      inactiveBg: 'rgba(16,185,129,0.15)',
      activeBg: 'rgba(16,185,129,0.48)',
      inactiveCount: '#6ee7b7',
      inactiveLabel: 'rgba(110,231,183,0.70)',
    },
  ];

  return (
    <LinearGradient
      colors={['#0e0e28', '#1e1458', '#0e1a32']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.pb}
    >
      <View style={styles.pbTop}>
        <View style={styles.pbEyebrowRow}>
          <View style={styles.pbDot} />
          <Text style={styles.pbEyebrow}>今日の進捗</Text>
        </View>
        <Text style={styles.pbTitle}>
          {allDone ? '🎉 今日もよくやりました！' : '未実行をひとつ減らそう'}
        </Text>
        <Text style={styles.pbSub}>
          {counts.done > 0
            ? `${counts.done}件完了・${counts.todo}件残り`
            : counts.all === 0
            ? 'Tipsを追加して進めよう'
            : `${counts.todo}件の未実行Tipsがあります`}
        </Text>
        <View style={styles.pbTrack}>
          <Animated.View style={[styles.pbFill, { width: fillWidth }]} />
        </View>
      </View>

      <View style={styles.pbCardRow}>
        {filterCards.map((card) => {
          const isActive = statusFilter === card.key;
          return (
            <TouchableOpacity
              key={String(card.key)}
              onPress={() => onFilter(card.key)}
              activeOpacity={0.78}
              style={[
                styles.pbCard,
                { backgroundColor: isActive ? card.activeBg : card.inactiveBg },
                isActive && styles.pbCardSelected,
              ]}
            >
              <Text style={[styles.pbCardCount, { color: isActive ? '#ffffff' : card.inactiveCount }]}>
                {card.count}
              </Text>
              <Text style={[styles.pbCardLabel, { color: isActive ? 'rgba(255,255,255,0.88)' : card.inactiveLabel }]}>
                {card.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </LinearGradient>
  );
}

// ── Todo Card ────────────────────────────────────────────────
type CardAction = 'done' | 'todo' | 'trash' | 'mytips' | 'removeMyTips';

function TodoCard({
  tip,
  onAction,
}: {
  tip: Tip;
  onAction: (action: CardAction) => void;
}) {
  const checkRef = useRef<CheckBurstHandle>(null);
  const srcKey = getSourceKey(tip.category);
  const sm = STATUS_DISPLAY[tip.status] ?? STATUS_DISPLAY.todo;
  const dateHint = formatDateHint(tip.scheduledDate);
  const isDone = tip.status === 'done';

  // MyTipsに残した瞬間（false→true）だけ★をポップさせる
  const wasInMyTips = useRef(tip.isInMyTips);
  const justSavedToMyTips = Boolean(tip.isInMyTips && !wasInMyTips.current);
  useEffect(() => {
    wasInMyTips.current = tip.isInMyTips;
  });

  const handleCheck = () => {
    if (!isDone) checkRef.current?.burst();
    Vibration.vibrate(8);
    onAction(isDone ? 'todo' : 'done');
  };

  // 紫 = MyTips保存済み / 緑 = 実行済み / 優先度色 = 未実行
  const borderColor = tip.isInMyTips
    ? '#7c3aed'
    : isDone
    ? colors.green
    : tip.priority >= 75
    ? colors.orange
    : '#3a84d0';

  return (
    <View style={[styles.tc, { borderLeftColor: borderColor }, isDone && !tip.isInMyTips && styles.tcDoneCard]}>
      <View style={styles.tcTop}>
        <PressableScale
          containerStyle={styles.tcOpenArea}
          style={styles.tcOpenInner}
          onPress={() => router.push(`/tips/${tip.id}`)}
        >
          <View style={styles.tcMain}>
            <View style={styles.tcChipRow}>
              <View style={styles.tcChipLeft}>
                <View style={styles.srcChip}>
                  <Text style={styles.srcChipText}>{srcKey}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: sm.bg }]}>
                  <Text style={[styles.statusChipText, { color: sm.text }]}>{sm.label}</Text>
                </View>
                {tip.isInMyTips ? (
                  <View style={styles.myTipsBadge}>
                    <Text style={styles.myTipsBadgeText}>★ MyTips</Text>
                  </View>
                ) : null}
              </View>
              {dateHint ? <Text style={styles.dateHint}>{dateHint}</Text> : null}
            </View>
            <Text style={[styles.tcTitle, isDone && !tip.isInMyTips && styles.tcTitleDone]} numberOfLines={2}>
              {tip.title || '無題のTips'}
            </Text>
            {(tip.memo || tip.content) ? (
              <Text style={[styles.tcMemo, isDone && !tip.isInMyTips && styles.tcMemoDone]} numberOfLines={2}>
                {tip.memo || tip.content}
              </Text>
            ) : null}
          </View>
        </PressableScale>

        <View style={styles.actionRail}>
          <TouchableOpacity
            onPress={handleCheck}
            activeOpacity={0.7}
            style={styles.completeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <CheckBurst ref={checkRef} done={isDone} size={26} />
            <Text style={[styles.completeLabel, isDone && styles.completeLabelDone]}>
              {isDone ? '完了' : '完了にする'}
            </Text>
          </TouchableOpacity>

          {!isDone ? (
            <TouchableOpacity
              style={styles.trashMiniButton}
              onPress={() => onAction('trash')}
              activeOpacity={0.78}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.trashMiniIcon}>×</Text>
              <Text style={styles.trashMiniLabel}>不要</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {isDone ? (
        <View style={styles.tcActs}>
          {tip.isInMyTips ? (
            <>
              <View style={[styles.act, styles.actSaved]}>
                <StarPop active popOnMount={justSavedToMyTips} size={12} activeColor="#7c3aed" />
                <Text style={styles.actSavedText}> MyTips保存済み</Text>
              </View>
              <View style={{ flex: 1 }} />
              <PressableScale style={[styles.act, styles.actRemove]} onPress={() => onAction('removeMyTips')}>
                <Text style={styles.actRemoveText}>外す</Text>
              </PressableScale>
            </>
          ) : (
            <PressableScale style={[styles.act, styles.actMytips]} onPress={() => onAction('mytips')}>
              <Text style={styles.actMytipsText}>★ MyTipsに残す</Text>
            </PressableScale>
          )}
        </View>
      ) : null}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────
export default function TodoScreen() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(all);
  const [sourceFilter, setSourceFilter] = useState<string>(all);
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

  const handleAction = useCallback(async (action: CardAction, tip: Tip) => {
    if (action === 'done') {
      await updateTip(tip.id, { status: 'done' });
      await load();
      setCompletionTip(tip);
    } else if (action === 'todo') {
      await updateTip(tip.id, { status: 'todo' });
      await load();
    } else if (action === 'mytips') {
      if (!(await ensureCanAddMyTips())) return;
      await updateTip(tip.id, { isInMyTips: true });
      await load();
    } else if (action === 'removeMyTips') {
      await updateTip(tip.id, { isInMyTips: false });
      await load();
    } else if (action === 'trash') {
      Alert.alert('このTipsを削除しますか?', '削除したTipsは復元できません。', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            setTips((prev) => prev.filter((item) => item.id !== tip.id));
            try {
              await deleteTip(tip.id);
              await load();
            } catch (error) {
              await load();
              Alert.alert('削除できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
            }
          },
        },
      ]);
    }
  }, [ensureCanAddMyTips, load]);

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

  const statusCounts = useMemo(() => ({
    all:   visibleTips.length,
    todo:  visibleTips.filter((t) => t.status === 'todo').length,
    done:  visibleTips.filter((t) => t.status === 'done').length,
  }), [visibleTips]);

  const filteredTips = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return visibleTips
      .filter((t) => {
        if (needle) {
          const hay = [t.title, t.memo, t.content, t.category].filter(Boolean).join(' ').toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        if (statusFilter !== all && t.status !== statusFilter) return false;
        if (sourceFilter !== all && getSourceKey(t.category) !== sourceFilter) return false;
        return true;
      })
      .sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt));
  }, [visibleTips, query, statusFilter, sourceFilter]);

  const highTips = useMemo(() => filteredTips.filter((t) => t.status !== 'done' && t.priority >= 75), [filteredTips]);
  const mediumTips = useMemo(() => filteredTips.filter((t) => t.status !== 'done' && t.priority >= 50 && t.priority < 75), [filteredTips]);
  const lowTips = useMemo(() => filteredTips.filter((t) => t.status !== 'done' && t.priority < 50), [filteredTips]);
  const doneTips = useMemo(() => filteredTips.filter((t) => t.status === 'done'), [filteredTips]);

  const sourceOptions: string[] = [all, ...KNOWN_SOURCES, 'Other'];

  return (
    <>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 上部の淡い色帯（スクロールと一緒に流れる装飾） */}
      <LinearGradient colors={gradients.screenTint} style={styles.bgTint} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Todo</Text>
        <Text style={styles.headerSub}>
          保存中 {visibleTips.length}件・未実行 {statusCounts.todo}件
        </Text>
        <Text style={styles.headerHint}>
          実行したTipsはDoneに移動します。特に役立ったものだけMyTipsに残せます。
        </Text>
      </View>

      {/* Progress Board */}
      <ProgressBoard
        statusFilter={statusFilter}
        onFilter={setStatusFilter}
        counts={statusCounts}
      />

      {/* Search */}
      <View style={styles.searchRow}>
        <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
          <Circle cx={6.5} cy={6.5} r={4.5} stroke={colors.inkMuted} strokeWidth={1.4} />
          <Path d="M10.5 10.5l3 3" stroke={colors.inkMuted} strokeWidth={1.4} strokeLinecap="round" />
        </Svg>
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

      {/* Source filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {sourceOptions.map((src) => (
          <TouchableOpacity
            key={src}
            style={[styles.srcBtn, sourceFilter === src && styles.srcBtnActive]}
            onPress={() => setSourceFilter(src)}
            activeOpacity={0.75}
          >
            <Text style={[styles.srcBtnText, sourceFilter === src && styles.srcBtnTextActive]}>
              {src === all ? 'すべて' : src}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tip lists */}
      {filteredTips.length === 0 ? (
        <EmptyState title="該当するTipsがありません" />
      ) : (
        <>
          {highTips.length > 0 && (
            <View style={styles.bucket}>
              <View style={styles.bucketHeader}>
                <View style={[styles.bucketDot, { backgroundColor: colors.orange }]} />
                <Text style={[styles.bucketLabel, { color: colors.orange }]}>優先度：高</Text>
                <Text style={styles.bucketCount}>{highTips.length}件</Text>
              </View>
              {highTips.map((tip, i) => (
                <FadeSlideIn key={tip.id} delay={Math.min(i, motion.staggerMax) * motion.staggerStep}>
                  <TodoCard tip={tip} onAction={(a) => handleAction(a, tip)} />
                </FadeSlideIn>
              ))}
            </View>
          )}

          {mediumTips.length > 0 && (
            <View style={styles.bucket}>
              <View style={styles.bucketHeader}>
                <View style={[styles.bucketDot, { backgroundColor: colors.yellow }]} />
                <Text style={[styles.bucketLabel, { color: colors.yellow }]}>優先度：中</Text>
                <Text style={styles.bucketCount}>{mediumTips.length}件</Text>
              </View>
              {mediumTips.map((tip, i) => (
                <FadeSlideIn key={tip.id} delay={Math.min(i, motion.staggerMax) * motion.staggerStep}>
                  <TodoCard tip={tip} onAction={(a) => handleAction(a, tip)} />
                </FadeSlideIn>
              ))}
            </View>
          )}

          {lowTips.length > 0 && (
            <View style={styles.bucket}>
              <View style={styles.bucketHeader}>
                <View style={[styles.bucketDot, { backgroundColor: '#3a84d0' }]} />
                <Text style={[styles.bucketLabel, { color: '#3a84d0' }]}>優先度：低</Text>
                <Text style={styles.bucketCount}>{lowTips.length}件</Text>
              </View>
              {lowTips.map((tip, i) => (
                <FadeSlideIn key={tip.id} delay={Math.min(i, motion.staggerMax) * motion.staggerStep}>
                  <TodoCard tip={tip} onAction={(a) => handleAction(a, tip)} />
                </FadeSlideIn>
              ))}
            </View>
          )}

          {doneTips.length > 0 && (
            <View style={styles.bucket}>
              <View style={styles.bucketHeader}>
                <View style={[styles.bucketDot, { backgroundColor: colors.green }]} />
                <Text style={[styles.bucketLabel, { color: colors.green }]}>実行済み</Text>
                <Text style={styles.bucketCount}>{doneTips.length}件</Text>
              </View>
              {doneTips.map((tip, i) => (
                <FadeSlideIn key={tip.id} delay={Math.min(i, motion.staggerMax) * motion.staggerStep}>
                  <TodoCard tip={tip} onAction={(a) => handleAction(a, tip)} />
                </FadeSlideIn>
              ))}
            </View>
          )}
        </>
      )}
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
  content: { gap: spacing.md, paddingBottom: 110 },
  bgTint: { height: 260, left: 0, position: 'absolute', right: 0, top: 0 },

  // Header
  header: { paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.xs },
  headerTitle: { color: colors.ink, fontSize: 30, fontWeight: '700', letterSpacing: -0.6, marginBottom: 3 },
  headerSub: { color: colors.inkMuted, fontSize: 12 },

  // Progress Board
  pb: {
    borderRadius: radius.xxl,
    elevation: 10,
    gap: spacing.md,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
    shadowColor: '#0e0e28',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.50,
    shadowRadius: 24,
  },
  pbTop: { gap: 5 },
  pbEyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 2 },
  pbDot: { backgroundColor: '#a5b4fc', borderRadius: 3, height: 6, width: 6 },
  pbEyebrow: { color: '#a5b4fc', fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  pbTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3, lineHeight: 24 },
  pbSub: { color: 'rgba(255,255,255,0.52)', fontSize: 12, lineHeight: 18 },
  pbTrack: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    height: 4,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  pbFill: {
    backgroundColor: '#6ee7b7',
    borderRadius: 3,
    height: 4,
  },
  pbCardRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  pbCard: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    flex: 1,
    gap: 2,
    paddingVertical: 12,
  },
  pbCardSelected: {
    borderColor: 'rgba(255,255,255,0.28)',
  },
  pbCardCount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pbCardLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // Search
  searchRow: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.sm + 2,
    paddingLeft: spacing.md,
    ...shadow.cardSoft,
  },
  searchInput: { color: colors.ink, flex: 1, fontSize: 13, paddingVertical: 2 },
  clearBtn: { padding: 4 },
  clearText: { color: colors.inkMuted, fontSize: 13, fontWeight: '600' },

  // Filter rows
  filterRow: { gap: 7, paddingHorizontal: spacing.md, paddingBottom: 2 },

  srcBtn: { backgroundColor: colors.bgElevated, borderRadius: radius.xl, paddingHorizontal: 12, paddingVertical: 6, ...shadow.cardSoft },
  srcBtnActive: { backgroundColor: colors.ink },
  srcBtnText: { color: colors.inkSub, fontSize: 11.5, fontWeight: '600' },
  srcBtnTextActive: { color: '#ffffff' },

  // Buckets
  bucket: { gap: spacing.sm },
  bucketHeader: { alignItems: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: spacing.md + 2 },
  bucketDot: { borderRadius: 4, height: 7, width: 7 },
  bucketLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.7 },
  bucketCount: { color: colors.inkMuted, fontSize: 11.5, fontWeight: '600' },

  // Todo cards
  tc: {
    backgroundColor: colors.bgElevated,
    borderLeftWidth: 3.5,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  tcDoneCard: { opacity: 0.68 },
  tcTop: { alignItems: 'stretch', flexDirection: 'row', gap: 10, padding: 12 },
  tcOpenArea: { flex: 1, minWidth: 0, zIndex: 1 },
  tcOpenInner: { flex: 1 },
  tcMain: { flex: 1, minWidth: 0 },
  tcChipRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  tcChipLeft: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  srcChip: { backgroundColor: colors.ink, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2.5 },
  srcChipText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  statusChip: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2.5 },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  dateHint: { color: colors.inkMuted, fontSize: 10 },
  tcTitle: { color: colors.ink, fontSize: 13.5, fontWeight: '700', letterSpacing: -0.15, lineHeight: 20, marginBottom: 4 },
  tcTitleDone: { color: colors.inkMuted, textDecorationLine: 'line-through' },
  tcMemo: { color: colors.inkSub, fontSize: 11, lineHeight: 17 },
  tcMemoDone: { color: colors.inkMuted },

  actionRail: {
    alignItems: 'center',
    elevation: 2,
    flexShrink: 0,
    gap: 10,
    minWidth: 64,
    width: 64,
    zIndex: 3,
  },
  completeButton: {
    alignItems: 'center',
    gap: 4,
    minWidth: 58,
  },
  completeLabel: {
    color: colors.inkMuted,
    fontSize: 9.5,
    fontWeight: '700',
    lineHeight: 12,
    textAlign: 'center',
  },
  completeLabelDone: { color: colors.green },
  trashMiniButton: {
    alignItems: 'center',
    backgroundColor: '#fff1f0',
    borderRadius: 11,
    gap: 1,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 58,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  trashMiniIcon: { color: colors.danger, fontSize: 12, fontWeight: '800', lineHeight: 13 },
  trashMiniLabel: { color: colors.danger, fontSize: 9.5, fontWeight: '700', lineHeight: 12 },

  tcActs: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    padding: spacing.sm,
    paddingBottom: 11,
    paddingHorizontal: 12,
  },
  act: { alignItems: 'center', borderRadius: radius.sm, flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5 },
  actMytips: { backgroundColor: colors.accentSoft },
  actMytipsText: { color: colors.accentDeep, fontSize: 11, fontWeight: '600' },

  // Done card actions
  actSaved: { backgroundColor: '#f3e8ff' },
  actSavedText: { color: '#7c3aed', fontSize: 11, fontWeight: '700' },
  actRemove: { backgroundColor: '#f5f5f7' },
  actRemoveText: { color: colors.inkMuted, fontSize: 11, fontWeight: '600' },

  // MyTips inline badge on card
  myTipsBadge: { backgroundColor: '#f3e8ff', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2.5 },
  myTipsBadgeText: { color: '#7c3aed', fontSize: 10, fontWeight: '700' },

  // Header hint
  headerHint: { color: colors.inkMuted, fontSize: 11, lineHeight: 17, marginTop: 4 },

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
  bsTipTitle: { color: colors.inkSub, fontSize: 13, marginTop: -spacing.xs },
  bsBody: { color: colors.inkSub, fontSize: 13, lineHeight: 20 },
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
