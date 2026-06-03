import { useCallback, useMemo, useRef, useState } from 'react';
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
import { EmptyState } from '@/components/EmptyState';
import { colors, radius, shadow, spacing } from '@/theme';
import { deleteSampleTips, getTips, updateTip } from '@/lib/tipsStorage';
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

// ── Hero Card ────────────────────────────────────────────────
function HeroCard({ tip }: { tip: Tip }) {
  const srcKey = getSourceKey(tip.category);
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => router.push(`/tips/${tip.id}`)}>
      <LinearGradient
        colors={['#0e0e28', '#261558', '#162040']}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroDeco}><Text style={{ fontSize: 20 }}>🎯</Text></View>
        <View style={styles.heroLabelRow}>
          <Text style={{ fontSize: 12 }}>⭐</Text>
          <Text style={styles.heroLabelText}>今日のTODO・最優先</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>{tip.title || '無題のTips'}</Text>
        {(tip.memo || tip.content) ? (
          <Text style={styles.heroMemo} numberOfLines={2}>{tip.memo || tip.content}</Text>
        ) : null}
        <View style={styles.heroFoot}>
          <View style={styles.heroChip}>
            <Text style={styles.heroChipText}>{srcKey}</Text>
          </View>
          <View style={styles.heroBtn}>
            <Text style={styles.heroBtnText}>実行する →</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Todo Card ────────────────────────────────────────────────
type CardAction = 'done' | 'todo' | 'trash' | 'mytips' | 'removeMyTips' | 'candidate';

function TodoCard({
  tip,
  onAction,
  isCandidate = false,
}: {
  tip: Tip;
  onAction: (action: CardAction) => void;
  isCandidate?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const srcKey = getSourceKey(tip.category);
  const sm = STATUS_DISPLAY[tip.status] ?? STATUS_DISPLAY.todo;
  const dateHint = formatDateHint(tip.scheduledDate);
  const isDone = tip.status === 'done';

  const handleCheck = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 70, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
    ]).start();
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
      <TouchableOpacity
        activeOpacity={0.86}
        style={styles.tcTop}
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

        <TouchableOpacity
          onPress={handleCheck}
          activeOpacity={0.7}
          style={styles.cbTouch}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Animated.View
            style={[styles.cbCircle, isDone && styles.cbDone, { transform: [{ scale: scaleAnim }] }]}
          >
            {isDone && <Text style={styles.cbCheck}>✓</Text>}
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.tcActs}>
        {isDone ? (
          tip.isInMyTips ? (
            <>
              <View style={[styles.act, styles.actSaved]}>
                <Text style={styles.actSavedText}>★ MyTips保存済み</Text>
              </View>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={[styles.act, styles.actRemove]} onPress={() => onAction('removeMyTips')} activeOpacity={0.8}>
                <Text style={styles.actRemoveText}>外す</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.act, styles.actMytips]} onPress={() => onAction('mytips')} activeOpacity={0.8}>
              <Text style={styles.actMytipsText}>★ MyTipsに残す</Text>
            </TouchableOpacity>
          )
        ) : (
          <>
            <TouchableOpacity style={[styles.act, styles.actDone]} onPress={() => onAction('done')} activeOpacity={0.8}>
              <Text style={styles.actDoneText}>✓ 完了</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.act, styles.actDel]} onPress={() => onAction('trash')} activeOpacity={0.8}>
              <Text style={styles.actDelText}>✕ 不要</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={[styles.act, styles.actCandidate]} onPress={() => onAction('candidate')} activeOpacity={0.8}>
              <Text style={styles.actCandidateText}>{isCandidate ? '★ 候補' : '☆ 候補'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
  const [candidateIds, setCandidateIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setTips(await getTips());
    } catch (error) {
      Alert.alert('クラウド保存を確認してください', error instanceof Error ? error.message : 'Tipsを読み込めませんでした。');
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAction = useCallback(async (action: CardAction, tip: Tip) => {
    if (action === 'candidate') {
      setCandidateIds((prev) => {
        const next = new Set(prev);
        if (next.has(tip.id)) next.delete(tip.id); else next.add(tip.id);
        return next;
      });
      return;
    }
    if (action === 'done') {
      await updateTip(tip.id, { status: 'done' });
      await load();
      setCompletionTip(tip);
    } else if (action === 'todo') {
      await updateTip(tip.id, { status: 'todo' });
      await load();
    } else if (action === 'mytips') {
      await updateTip(tip.id, { isInMyTips: true });
      await load();
    } else if (action === 'removeMyTips') {
      await updateTip(tip.id, { isInMyTips: false });
      await load();
    } else if (action === 'trash') {
      Alert.alert('非表示にしますか?', 'このTipsを一覧から非表示にします。', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '非表示にする',
          style: 'destructive',
          onPress: async () => {
            await updateTip(tip.id, { status: 'trash' });
            await load();
          },
        },
      ]);
    }
  }, [load]);

  const handleCompletionMyTips = useCallback(async () => {
    if (!completionTip) return;
    await updateTip(completionTip.id, { isInMyTips: true });
    setCompletionTip(null);
    await load();
  }, [completionTip, load]);

  const handleCompletionDismiss = useCallback(() => {
    setCompletionTip(null);
  }, []);

  const visibleTips = useMemo(() => tips.filter((t) => t.status !== 'trash'), [tips]);
  const sampleTipCount = useMemo(() => tips.filter((t) => t.isSample).length, [tips]);

  const confirmDeleteSamples = useCallback(() => {
    Alert.alert(
      'サンプルTipsを削除しますか?',
      '最初から入っているサンプルTipsだけを削除します。あなたが追加したTipsは残ります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSampleTips();
              await load();
            } catch (error) {
              Alert.alert('削除できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
            }
          },
        },
      ],
    );
  }, [load]);

  const statusCounts = useMemo(() => ({
    all:   visibleTips.length,
    todo:  visibleTips.filter((t) => t.status === 'todo').length,
    done:  visibleTips.filter((t) => t.status === 'done').length,
  }), [visibleTips]);

  const heroTip = useMemo(
    () => visibleTips.filter((t) => t.status !== 'done').sort((a, b) => b.priority - a.priority)[0] ?? null,
    [visibleTips],
  );

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

  const statusOptions: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: all,     label: 'すべて', count: statusCounts.all },
    { key: 'todo',  label: '未実行', count: statusCounts.todo },
    { key: 'done',  label: '完了',   count: statusCounts.done },
  ];

  const sourceOptions: string[] = [all, ...KNOWN_SOURCES, 'Other'];

  return (
    <>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
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

      {sampleTipCount > 0 ? (
        <View style={styles.sampleCard}>
          <View style={styles.sampleCopy}>
            <Text style={styles.sampleTitle}>サンプルTipsが{sampleTipCount}件あります</Text>
            <Text style={styles.sampleBody}>使い方を確認したら、まとめて削除できます。</Text>
          </View>
          <TouchableOpacity style={styles.sampleDeleteButton} onPress={confirmDeleteSamples} activeOpacity={0.78}>
            <Text style={styles.sampleDeleteText}>サンプルTipsを削除</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Hero */}
      {heroTip ? (
        <View style={styles.heroWrap}>
          <HeroCard tip={heroTip} />
        </View>
      ) : null}

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

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {statusOptions.map((opt) => (
          <TouchableOpacity
            key={String(opt.key)}
            style={[styles.seg, statusFilter === opt.key && styles.segActive]}
            onPress={() => setStatusFilter(opt.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.segText, statusFilter === opt.key && styles.segTextActive]}>
              {opt.label}
            </Text>
            {opt.count > 0 ? (
              <View style={[styles.segBadge, statusFilter === opt.key && styles.segBadgeActive]}>
                <Text style={[styles.segBadgeText, statusFilter === opt.key && styles.segBadgeTextActive]}>
                  {opt.count}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              {highTips.map((tip) => (
                <TodoCard key={tip.id} tip={tip} onAction={(a) => handleAction(a, tip)} isCandidate={candidateIds.has(tip.id)} />
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
              {mediumTips.map((tip) => (
                <TodoCard key={tip.id} tip={tip} onAction={(a) => handleAction(a, tip)} isCandidate={candidateIds.has(tip.id)} />
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
              {lowTips.map((tip) => (
                <TodoCard key={tip.id} tip={tip} onAction={(a) => handleAction(a, tip)} isCandidate={candidateIds.has(tip.id)} />
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
              {doneTips.map((tip) => (
                <TodoCard key={tip.id} tip={tip} onAction={(a) => handleAction(a, tip)} isCandidate={false} />
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
        animationType="fade"
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
            <Text style={styles.bsTitle}>実行完了！</Text>
            <Text style={styles.bsTipTitle} numberOfLines={1}>
              {completionTip.title || '無題のTips'}
            </Text>
            <Text style={styles.bsBody}>
              このTipsをMyTipsに残しますか？{'\n'}
              本当に役立ったTipsだけをMyTipsに残すと、あとで再利用しやすくなります。
            </Text>
            <TouchableOpacity style={styles.bsPrimary} onPress={handleCompletionMyTips} activeOpacity={0.85}>
              <Text style={styles.bsPrimaryText}>★ MyTipsに残す</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bsSecondary} onPress={handleCompletionDismiss} activeOpacity={0.75}>
              <Text style={styles.bsSecondaryText}>完了だけにする</Text>
            </TouchableOpacity>
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

  // Header
  header: { paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.xs },
  headerTitle: { color: colors.ink, fontSize: 30, fontWeight: '700', letterSpacing: -0.6, marginBottom: 3 },
  headerSub: { color: colors.inkMuted, fontSize: 12 },

  // Sample tips
  sampleCard: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    ...shadow.cardSoft,
  },
  sampleCopy: { flex: 1, gap: 3 },
  sampleTitle: { color: colors.ink, fontSize: 12.5, fontWeight: '700' },
  sampleBody: { color: colors.inkMuted, fontSize: 10.5, lineHeight: 15 },
  sampleDeleteButton: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  sampleDeleteText: { color: colors.danger, fontSize: 11, fontWeight: '700' },

  // Hero
  heroWrap: { marginHorizontal: spacing.md },
  hero: {
    borderRadius: radius.xxl,
    elevation: 8,
    gap: spacing.sm,
    overflow: 'hidden',
    padding: spacing.lg,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  heroDeco: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 42,
  },
  heroLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  heroLabelText: { color: '#ffb347', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  heroTitle: { color: '#ffffff', fontSize: 17, fontWeight: '800', letterSpacing: -0.25, lineHeight: 24, paddingRight: 52 },
  heroMemo: { color: 'rgba(255,255,255,0.68)', fontSize: 12, lineHeight: 20, paddingRight: 52 },
  heroFoot: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  heroChip: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.sm, paddingHorizontal: 11, paddingVertical: 5 },
  heroChipText: { color: 'rgba(255,255,255,0.9)', fontSize: 11.5, fontWeight: '700' },
  heroBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    elevation: 4,
    paddingHorizontal: 18,
    paddingVertical: 9,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  heroBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

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
  seg: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    ...shadow.cardSoft,
  },
  segActive: { backgroundColor: colors.ink },
  segText: { color: colors.inkSub, fontSize: 12.5, fontWeight: '600' },
  segTextActive: { color: '#ffffff' },
  segBadge: { backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  segBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  segBadgeText: { color: colors.inkSub, fontSize: 10.5, fontWeight: '700' },
  segBadgeTextActive: { color: '#ffffff' },

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
  tcTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, padding: 12 },
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

  cbTouch: { marginTop: 2, padding: 4 },
  cbCircle: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(20,20,40,0.2)',
    borderRadius: 13,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  cbDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
    elevation: 3,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  cbCheck: { color: '#ffffff', fontSize: 11, fontWeight: '700' },

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
  actDone: { backgroundColor: colors.greenSoft },
  actDoneText: { color: '#1a8a3c', fontSize: 11, fontWeight: '600' },
  actDel: { backgroundColor: '#fff1f0' },
  actDelText: { color: colors.danger, fontSize: 11, fontWeight: '600' },
  actMytips: { backgroundColor: colors.accentSoft },
  actMytipsText: { color: colors.accentDeep, fontSize: 11, fontWeight: '600' },

  // Done card actions
  actSaved: { backgroundColor: '#f3e8ff' },
  actSavedText: { color: '#7c3aed', fontSize: 11, fontWeight: '700' },
  actRemove: { backgroundColor: '#f5f5f7' },
  actRemoveText: { color: colors.inkMuted, fontSize: 11, fontWeight: '600' },

  // Unexecuted candidate star
  actCandidate: { backgroundColor: '#f5f0ff' },
  actCandidateText: { color: '#7c3aed', fontSize: 11, fontWeight: '600' },

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
