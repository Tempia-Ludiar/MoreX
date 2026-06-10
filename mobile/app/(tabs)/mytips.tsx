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
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { PressableScale } from '@/components/PressableScale';
import { useReducedMotion } from '@/lib/motion';
import { colors, gradients, motion, radius, shadow, spacing } from '@/theme';
import { getTips } from '@/lib/tipsStorage';
import { Tip } from '@/types/tip';

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

// ── Grid card ────────────────────────────────────────────────
function GridCard({ tip }: { tip: Tip }) {
  const barColors = SOURCE_BAR[getSourceKey(tip.category)] ?? SOURCE_BAR.Other;
  return (
    <PressableScale
      containerStyle={styles.gridCardWrap}
      style={styles.gridCard}
      onPress={() => router.push(`/tips/${tip.id}`)}
    >
      <LinearGradient
        colors={barColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gridCardBar}
      />
      <View style={styles.gridCardBody}>
        <Text style={styles.gridCardStar}>★</Text>
        <Text style={styles.gridCardTitle} numberOfLines={3}>{tip.title || '無題のTips'}</Text>
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

  const filteredTips = useMemo(() => {
    if (!query.trim()) return myTips;
    const needle = query.trim().toLowerCase();
    return myTips.filter((t) => {
      const hay = [t.title, t.memo, t.content, t.afterMemo, t.category].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [myTips, query]);

  // ── Empty state ──────────────────────────────────────────
  if (myTips.length === 0) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <LinearGradient colors={gradients.growthTint} style={styles.bgTint} pointerEvents="none" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MyTips</Text>
        </View>
        <FadeSlideIn>
          <View style={styles.emptyCard}>
            <SproutSway />
            <Text style={styles.emptyTitle}>まだMyTipsがありません</Text>
            <Text style={styles.emptyBody}>
              実行してよかったTipsだけを残す、あなた専用の知識棚です。{'\n'}
              Todoで実行したTipsから残していきましょう。
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
      <LinearGradient colors={gradients.growthTint} style={styles.bgTint} pointerEvents="none" />

      {/* Header: タイトル + 蓄積数（タップで統計へ） + 検索 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>MyTips</Text>
          <PressableScale style={styles.countChip} onPress={() => router.push('/mytips/stats')}>
            <CountUpNumber value={myTips.length} style={styles.countChipNumber} />
            <Text style={styles.countChipLabel}>件 ›</Text>
          </PressableScale>
        </View>
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
      </View>

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

      {/* Grid */}
      {filteredTips.length === 0 ? (
        <View style={styles.emptySmall}>
          <Text style={styles.emptySmallText}>該当するTipsがありません</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredTips.map((tip, i) => (
            <FadeSlideIn
              key={tip.id}
              delay={Math.min(i, motion.staggerMax) * motion.staggerStep}
              style={styles.gridItem}
            >
              <GridCard tip={tip} />
            </FadeSlideIn>
          ))}
        </View>
      )}

      <PlusBanner />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.lg, paddingBottom: 110, paddingHorizontal: spacing.lg },
  bgTint: { height: 280, left: -spacing.lg, position: 'absolute', right: -spacing.lg, top: 0 },

  // Header
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 64,
  },
  headerLeft: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  headerTitle: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  countChip: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 13,
    paddingVertical: 7,
    ...shadow.cardSoft,
  },
  countChipNumber: { color: colors.accentDeep, fontSize: 16, fontWeight: '800' },
  countChipLabel: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
  iconBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },

  // Search
  searchRow: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: spacing.sm + 2,
    paddingLeft: spacing.md,
    ...shadow.cardSoft,
  },
  searchInput: { color: colors.ink, flex: 1, fontSize: 14, paddingVertical: 2 },
  clearBtn: { padding: 4 },
  clearText: { color: colors.inkMuted, fontSize: 13, fontWeight: '600' },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  gridItem: { width: '48%' },
  gridCardWrap: { flex: 1 },
  gridCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    minHeight: 110,
    overflow: 'hidden',
    ...shadow.card,
  },
  gridCardBar: { height: 3 },
  gridCardBody: { gap: 6, padding: spacing.md },
  gridCardStar: { color: '#ffcc00', fontSize: 15 },
  gridCardTitle: { color: colors.ink, fontSize: 15, fontWeight: '700', letterSpacing: -0.2, lineHeight: 21 },

  // Plus Banner
  plusBanner: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: 12,
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
  plusTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  plusDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 11.5, lineHeight: 16 },
  plusCta: {
    backgroundColor: '#ff9500',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  plusCtaText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    gap: spacing.sm,
    padding: spacing.xxl,
    ...shadow.card,
  },
  emptyIcon: { fontSize: 40, marginBottom: spacing.xs },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyBody: { color: colors.inkSub, fontSize: 13.5, lineHeight: 21, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  emptyBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  // Inline empty
  emptySmall: { alignItems: 'center', paddingVertical: spacing.xl },
  emptySmallText: { color: colors.inkMuted, fontSize: 13.5 },
});
