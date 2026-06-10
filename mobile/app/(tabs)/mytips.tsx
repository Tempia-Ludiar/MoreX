import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { AchievementSummary } from '@/components/AchievementSummary';
import { CategoryBarChart } from '@/components/CategoryBarChart';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { KnowledgeMap, KnowledgeCategory, hashColor } from '@/components/KnowledgeMap';
import { PressableScale } from '@/components/PressableScale';
import { StarPop } from '@/components/StarPop';
import { useReducedMotion } from '@/lib/motion';
import { colors, gradients, motion, radius, shadow, spacing } from '@/theme';
import { getTips } from '@/lib/tipsStorage';
import { Tip } from '@/types/tip';

// ── Source chip colors (matching Open Design) ────────────────
const SOURCE_STYLES: Record<string, { bg: string; text: string }> = {
  Codex:   { bg: '#2c1654', text: '#ff9de2' },
  Claude:  { bg: '#1a1830', text: '#ff9f45' },
  ChatGPT: { bg: '#0d1f0d', text: '#4ade80' },
  X:       { bg: '#0f0f0f', text: '#e5e5e5' },
  YouTube: { bg: '#1f0505', text: '#ff6b6b' },
  note:    { bg: '#1a0a2e', text: '#bf5cf2' },
  Web:     { bg: '#021e24', text: '#5ac8fa' },
  Other:   { bg: '#1c1a04', text: '#ffdd55' },
};

const SOURCE_BAR: Record<string, [string, string]> = {
  Codex:   ['#ff6b9d', '#a855f7'],
  Claude:  ['#ff9500', '#ff6b9d'],
  ChatGPT: ['#34c759', '#00b4d8'],
  X:       ['#c0c0c0', '#808080'],
  YouTube: ['#ff3b30', '#ff9500'],
  note:    ['#bf5cf2', '#7c3aed'],
  Web:     ['#5ac8fa', '#0a84ff'],
  Other:   ['#ffcc00', '#ff9500'],
};

const KNOWN_SOURCES = ['ChatGPT', 'Claude', 'Codex', 'X', 'YouTube', 'note', 'Web'] as const;

function getSourceKey(category?: string): string {
  const cat = category?.trim();
  if (!cat) return 'Other';
  return (KNOWN_SOURCES as readonly string[]).includes(cat) ? cat : 'Other';
}

function formatSavedDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 保存`;
}

// ── Collections definition ───────────────────────────────────
const COLLECTIONS: Array<{
  id: string; icon: string; name: string; locked: boolean;
  categories: string[] | null;
}> = [
  { id: 'all',  icon: '🗂', name: 'すべて',   locked: false, categories: null },
  { id: 'ai',   icon: '🤖', name: 'AI活用',   locked: false, categories: ['ChatGPT', 'Claude', 'Codex'] },
  { id: 'ui',   icon: '🎨', name: 'UI改善',   locked: false, categories: ['UI', 'デザイン', 'UX'] },
  { id: 'post', icon: '✏️', name: '投稿ネタ', locked: true,  categories: null },
  { id: 'dev',  icon: '💻', name: '開発',     locked: true,  categories: null },
];

// ── Count-up number ──────────────────────────────────────────
function CountUpNumber({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const animRef = useRef(new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const anim = animRef.current;
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    const animation = Animated.timing(anim, { toValue: value, duration: 700, useNativeDriver: false });
    animation.start();
    return () => {
      animation.stop();
      anim.removeListener(id);
    };
  }, [value, reduced]);

  return <Text style={style}>{display}</Text>;
}

// ── Swaying sprout (empty state) ─────────────────────────────
function SproutSway() {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] });
  return <Animated.Text style={[styles.emptyIcon, { transform: [{ rotate }] }]}>🌱</Animated.Text>;
}

// ── MyTips Card ──────────────────────────────────────────────
function MyTipsCard({ tip }: { tip: Tip }) {
  const srcKey = getSourceKey(tip.category);
  const srcStyle = SOURCE_STYLES[srcKey] ?? SOURCE_STYLES.Other;
  const barColors = SOURCE_BAR[srcKey] ?? SOURCE_BAR.Other;
  const learning = tip.afterMemo || tip.memo || '';
  const reuse = tip.content || '';

  return (
    <PressableScale
      containerStyle={styles.tipCardWrap}
      style={styles.tipCard}
      onPress={() => router.push(`/tips/${tip.id}`)}
    >
      <LinearGradient
        colors={barColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.tipTopBar}
      />
      <View style={styles.tipBody}>
        <View style={styles.tipRow1}>
          <View style={[styles.srcChip, { backgroundColor: srcStyle.bg }]}>
            <Text style={[styles.srcChipText, { color: srcStyle.text }]}>{srcKey}</Text>
          </View>
          <TouchableOpacity
            style={styles.tipStar}
            onPress={() => router.push(`/tips/${tip.id}`)}
            activeOpacity={0.7}
          >
            <StarPop active={tip.isInMyTips === true} size={17} inactiveColor={colors.inkMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.tipTitle} numberOfLines={2}>{tip.title || '無題のTips'}</Text>

        {learning ? (
          <View style={styles.metaSection}>
            <Text style={styles.metaLabel}>実行して得た学び</Text>
            <Text style={styles.metaText} numberOfLines={3}>{learning}</Text>
          </View>
        ) : null}

        {reuse ? (
          <View style={styles.metaSection}>
            <Text style={styles.metaLabel}>何に再利用できるか</Text>
            <Text style={styles.metaText} numberOfLines={2}>{reuse}</Text>
          </View>
        ) : null}

        <Text style={styles.tipDate}>{formatSavedDate(tip.updatedAt)}</Text>

        <View style={styles.tipFoot}>
          <View />
          <TouchableOpacity onPress={() => router.push(`/tips/${tip.id}`)} activeOpacity={0.7}>
            <Text style={styles.detailBtn}>詳細 ›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PressableScale>
  );
}

// ── Plus Banner ──────────────────────────────────────────────
function PlusBanner() {
  return (
    <LinearGradient
      colors={['#0d0d2e', '#2d1660']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.plusBanner}
    >
      <View style={styles.plusIcon}>
        <Text style={{ fontSize: 18, color: '#ffd555' }}>✦</Text>
      </View>
      <View style={styles.plusTextBlock}>
        <Text style={styles.plusTitle}>Plusで制限なく蓄積</Text>
        <Text style={styles.plusDesc}>保存Tips・MyTips・カスタムカテゴリを無制限に。¥680/月</Text>
      </View>
      <TouchableOpacity
        style={styles.plusCta}
        activeOpacity={0.85}
        onPress={() => router.push('/plus')}
      >
        <Text style={styles.plusCtaText}>詳しく</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

// ── Main Screen ──────────────────────────────────────────────
export default function MyTipsScreen() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setTips(await getTips());
    } catch (error) {
      Alert.alert('クラウド保存を確認してください', error instanceof Error ? error.message : 'Tipsを読み込めませんでした。');
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const myTips = useMemo(
    () => tips
      .filter((t) => t.isInMyTips === true)
      .sort((a, b) => b.priority - a.priority || b.updatedAt.localeCompare(a.updatedAt)),
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

  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: myTips.length };
    COLLECTIONS.forEach((coll) => {
      if (coll.id === 'all' || coll.locked || !coll.categories) return;
      counts[coll.id] = myTips.filter((t) => {
        const src = getSourceKey(t.category);
        return (coll.categories as string[]).includes(src)
          || (coll.categories as string[]).includes(t.category?.trim() ?? '');
      }).length;
    });
    return counts;
  }, [myTips]);

  const filteredTips = useMemo(() => {
    let result = myTips;
    const coll = COLLECTIONS.find((c) => c.id === selectedCollection);
    if (coll?.categories && selectedCollection !== 'all') {
      result = result.filter((t) => {
        const src = getSourceKey(t.category);
        return (coll.categories as string[]).includes(src)
          || (coll.categories as string[]).includes(t.category?.trim() ?? '');
      });
    }
    if (selectedCategory) {
      result = result.filter((t) => (t.category?.trim() || 'その他') === selectedCategory);
    }
    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      result = result.filter((t) => {
        const hay = [t.title, t.memo, t.content, t.afterMemo, t.category].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(needle);
      });
    }
    return result;
  }, [myTips, selectedCollection, selectedCategory, query]);

  // ── Empty state ──────────────────────────────────────────
  if (myTips.length === 0) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <LinearGradient colors={gradients.growthTint} style={styles.bgTint} pointerEvents="none" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MyTips</Text>
          <Text style={styles.headerSub}>あなたの型 — 0件蓄積</Text>
          <Text style={styles.headerHint}>実行してよかったTipsだけを残す知識資産です。</Text>
        </View>
        <FadeSlideIn>
          <View style={styles.emptyCard}>
            <SproutSway />
            <Text style={styles.emptyTitle}>まだMyTipsがありません</Text>
            <Text style={styles.emptyBody}>
              Todoで実行したTipsの中から、役に立ったものをMyTipsに残しましょう。
            </Text>
            <PressableScale style={styles.emptyBtn} onPress={() => router.push('/(tabs)/board')}>
              <Text style={styles.emptyBtnText}>Todoを見る →</Text>
            </PressableScale>
          </View>
        </FadeSlideIn>
        <PlusBanner />
      </ScrollView>
    );
  }

  // ── Main view ────────────────────────────────────────────
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* 上部の淡い色帯（知識が育つイメージのグリーン系） */}
      <LinearGradient colors={gradients.growthTint} style={styles.bgTint} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>MyTips</Text>
            <Text style={styles.headerSub}>
              あなたの型 — <CountUpNumber value={myTips.length} style={styles.headerCount} />件蓄積
            </Text>
            <Text style={styles.headerHint}>実行してよかったTipsだけを残す知識資産です。</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => { setShowSearch((v) => !v); if (showSearch) setQuery(''); }}
              activeOpacity={0.7}
            >
              <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                <Circle cx={6.5} cy={6.5} r={4.5} stroke={colors.ink} strokeWidth={1.6} />
                <Path d="M10.5 10.5L14 14" stroke={colors.ink} strokeWidth={1.6} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.collBtn}
              onPress={() => Alert.alert('Collections', 'Plus版でCollectionsを無制限に作成できます。')}
              activeOpacity={0.8}
            >
              <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                <Path d="M6 1v10M1 6h10" stroke={colors.accent} strokeWidth={1.8} strokeLinecap="round" />
              </Svg>
              <Text style={styles.collBtnText}>Collection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FadeSlideIn>
        <View style={styles.roleCard}>
          <View style={styles.roleIcon}>
            <Text style={styles.roleIconText}>★</Text>
          </View>
          <View style={styles.roleBody}>
            <Text style={styles.roleTitle}>MyTipsは「残す価値があった学び」の棚</Text>
            <Text style={styles.roleText}>実行済みの中から、また使いたいTipsだけを残して育てます。</Text>
          </View>
        </View>
      </FadeSlideIn>

      {/* Search */}
      {showSearch ? (
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="タイトル、メモ、学びで検索"
            placeholderTextColor={colors.inkMuted}
            style={styles.searchInput}
            autoFocus
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Stats */}
      <FadeSlideIn delay={80}>
        <AchievementSummary total={myTips.length} week={weekCount} streak={streakDays} />
      </FadeSlideIn>

      {/* Knowledge Map */}
      <FadeSlideIn delay={160}>
        <KnowledgeMap
          categories={knowledgeCategories}
          totalCount={myTips.length}
          weekCount={weekCount}
          showPlusButton
          onCategoryPress={(name) =>
            setSelectedCategory((prev) => (prev === name ? null : name))
          }
        />
      </FadeSlideIn>

      {/* Collections */}
      <View style={styles.sec}>
        <View style={styles.secHeader}>
          <View>
            <Text style={styles.secTitle}>Collections</Text>
            <Text style={styles.secSub}>残しておきたいTipsをテーマごとに整理</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.secLink}>すべて見る</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collRow}>
          {COLLECTIONS.map((coll) => {
            const count = collectionCounts[coll.id] ?? 0;
            const isActive = !coll.locked && selectedCollection === coll.id;
            return (
              <TouchableOpacity
                key={coll.id}
                style={[styles.collChip, isActive && styles.collChipActive, coll.locked && styles.collChipLocked]}
                onPress={() => {
                  if (coll.locked) {
                    Alert.alert('MoreX Plus', 'Plus版でCollectionsを無制限に作成できます。');
                    return;
                  }
                  setSelectedCollection(coll.id);
                  setSelectedCategory(null);
                }}
                activeOpacity={coll.locked ? 0.6 : 0.8}
              >
                <Text style={styles.collIcon}>{coll.icon}</Text>
                <Text style={[styles.collName, isActive && styles.collNameActive]}>{coll.name}</Text>
                {coll.locked ? (
                  <View style={styles.plusBadge}>
                    <Text style={styles.plusBadgeText}>Plus</Text>
                  </View>
                ) : (
                  <Text style={[styles.collCount, isActive && styles.collCountActive]}>{count}件</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Growth */}
      <FadeSlideIn delay={240}>
        <CategoryBarChart categories={knowledgeCategories} title="カテゴリ別蓄積" subtitle="MyTipsに残した知識" />
      </FadeSlideIn>

      {/* Category filter chip */}
      {selectedCategory ? (
        <View style={styles.catFilterRow}>
          <Text style={styles.catFilterLabel}>{selectedCategory}</Text>
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text style={styles.catFilterClear}>すべて表示</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* MyTips List */}
      <View style={styles.sec}>
        <View style={styles.listHeader}>
          <View style={styles.listHeaderLeft}>
            <Text style={styles.listTitle}>MyTips一覧</Text>
            <Text style={styles.listCount}>{filteredTips.length}件</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.listSort}>新しい順 ▾</Text>
          </TouchableOpacity>
        </View>
        {filteredTips.length === 0 ? (
          <View style={styles.emptySmall}>
            <Text style={styles.emptySmallText}>該当するTipsがありません</Text>
          </View>
        ) : (
          filteredTips.map((tip, i) => (
            <FadeSlideIn key={tip.id} delay={Math.min(i, motion.staggerMax) * motion.staggerStep}>
              <MyTipsCard tip={tip} />
            </FadeSlideIn>
          ))
        )}
      </View>

      {/* Plus Banner */}
      <PlusBanner />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.md, paddingBottom: 110 },
  bgTint: { height: 280, left: 0, position: 'absolute', right: 0, top: 0 },

  // Header
  header: { paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.xs },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  headerTitle: { color: colors.ink, fontSize: 30, fontWeight: '700', letterSpacing: -0.6, marginBottom: 3 },
  headerSub: { color: colors.inkMuted, fontSize: 12 },
  headerCount: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  headerHint: { color: colors.inkMuted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  roleCard: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    ...shadow.cardSoft,
  },
  roleIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  roleIconText: { color: colors.accentDeep, fontSize: 16, fontWeight: '900' },
  roleBody: { flex: 1, gap: 2 },
  roleTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  roleText: { color: colors.inkSub, fontSize: 11.5, lineHeight: 17 },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingTop: 4 },
  iconBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  collBtn: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  collBtnText: { color: colors.accent, fontSize: 12, fontWeight: '600' },

  // Search
  searchRow: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    padding: spacing.sm + 2,
    paddingLeft: spacing.md,
    ...shadow.cardSoft,
  },
  searchInput: { color: colors.ink, flex: 1, fontSize: 13, paddingVertical: 2 },
  clearBtn: { padding: 4 },
  clearText: { color: colors.inkMuted, fontSize: 13, fontWeight: '600' },

  // Section
  sec: { gap: spacing.sm },
  secHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  secTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  secSub: { color: colors.inkMuted, fontSize: 11, marginTop: 2 },
  secLink: { color: colors.accent, fontSize: 12, fontWeight: '600', paddingTop: 2 },

  // Collections
  collRow: { gap: 9, paddingHorizontal: spacing.md, paddingBottom: 2 },
  collChip: {
    alignItems: 'flex-start',
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    minWidth: 82,
    padding: 11,
    paddingBottom: 10,
    ...shadow.cardSoft,
  },
  collChipActive: { backgroundColor: colors.accent },
  collChipLocked: { opacity: 0.65 },
  collIcon: { fontSize: 17, lineHeight: 22, marginBottom: 6 },
  collName: { color: colors.ink, fontSize: 11.5, fontWeight: '700', lineHeight: 16, marginBottom: 2 },
  collNameActive: { color: '#ffffff' },
  collCount: { color: colors.inkMuted, fontSize: 10 },
  collCountActive: { color: 'rgba(255,255,255,0.7)' },
  plusBadge: {
    backgroundColor: '#ff9500',
    borderRadius: 6,
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  plusBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '800' },

  // Category filter
  catFilterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  catFilterLabel: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  catFilterClear: { color: colors.accent, fontSize: 13, fontWeight: '600' },

  // List header
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  listHeaderLeft: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  listTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  listCount: { color: colors.inkMuted, fontSize: 12, fontWeight: '500' },
  listSort: { color: colors.accent, fontSize: 11.5, fontWeight: '600' },

  // MyTips cards
  tipCardWrap: { marginHorizontal: spacing.md },
  tipCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  tipTopBar: { height: 3 },
  tipBody: { padding: 12, paddingTop: 12, gap: spacing.sm },
  tipRow1: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  srcChip: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  srcChipText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.1 },
  tipStar: { padding: 2 },
  tipTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', letterSpacing: -0.2, lineHeight: 20 },
  metaSection: { gap: 3 },
  metaLabel: { color: colors.accent, fontSize: 10.5, fontWeight: '700' },
  metaText: { color: colors.inkSub, fontSize: 12, lineHeight: 19 },
  tipDate: { color: colors.inkMuted, fontSize: 10.5, marginTop: 2 },
  tipFoot: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  detailBtn: { color: colors.inkMuted, fontSize: 11 },

  // Plus Banner
  plusBanner: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: spacing.md,
    padding: 15,
    paddingRight: 16,
  },
  plusIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  plusTextBlock: { flex: 1 },
  plusTitle: { color: '#ffffff', fontSize: 12.5, fontWeight: '700', marginBottom: 2 },
  plusDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 16 },
  plusCta: {
    backgroundColor: '#ff9500',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  plusCtaText: { color: '#ffffff', fontSize: 11.5, fontWeight: '700' },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.xxl,
    ...shadow.card,
  },
  emptyIcon: { fontSize: 40, marginBottom: spacing.xs },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyBody: { color: colors.inkSub, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  emptyBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },

  // Inline empty
  emptySmall: { alignItems: 'center', paddingVertical: spacing.xl },
  emptySmallText: { color: colors.inkMuted, fontSize: 13 },
});
