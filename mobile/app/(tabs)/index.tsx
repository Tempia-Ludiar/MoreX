import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { PriorityBucketToggle } from '@/components/PriorityBucketToggle';
import { PrioritySlider } from '@/components/PrioritySlider';
import { BillingPlan } from '@/constants/billing';
import { getCategorySuggestions } from '@/constants/categorySuggestions';
import { colors, radius, shadow, spacing } from '@/theme';
import {
  countCustomCategories,
  getCurrentBillingPlan,
  getUpgradeMessage,
  isDefaultCategory,
  isAtLimit,
} from '@/lib/billing';
import { getPendingTipDraft, savePendingTipDraft } from '@/lib/pendingTipDraft';
import {
  detectLinkPreviewType,
  fetchLinkPreview,
  normalizeUrl,
  type LinkPreview,
  type LinkPreviewType,
} from '@/lib/linkPreview';
import { addUserCategory, getUserCategories } from '@/lib/userCategories';

type ContentType = LinkPreviewType;

const PREVIEW_META: Record<ContentType, { label: string; colors: [string, string, string] }> = {
  X: { label: 'X', colors: ['#080808', '#1b1b1b', '#303030'] },
  YouTube: { label: 'YouTube', colors: ['#4a0000', '#b00000', '#ff3b30'] },
  note: { label: 'note', colors: ['#075c4e', '#109b83', '#41c9b1'] },
  Web記事: { label: 'Web記事', colors: ['#110120', '#2d1660', '#183058'] },
  AI回答: { label: 'AI回答', colors: ['#15203b', '#3447a8', '#6366f1'] },
};

const USE_CHIPS: { label: string; full: string }[] = [
  { label: 'あとで試す', full: 'あとで試す' },
  { label: '投稿ネタ',   full: '投稿ネタにする' },
  { label: 'UI参考',    full: 'UI参考にする' },
  { label: '実装する',  full: '実装する' },
  { label: '読み返す',  full: '読み返す' },
  { label: '学習メモ',  full: '学習メモ' },
];

export default function AddScreen() {
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState(50);
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [priorityChanged, setPriorityChanged] = useState(false);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [linkPreviewLoading, setLinkPreviewLoading] = useState(false);
  const [managedCategories, setManagedCategories] = useState<string[]>([]);
  const [plan, setPlan] = useState<BillingPlan>('free');

  const load = useCallback(async () => {
    try {
      const [nextPlan, nextCategories] = await Promise.all([getCurrentBillingPlan(), getUserCategories()]);
      setPlan(nextPlan);
      setManagedCategories(nextCategories);
    } catch (error) {
      Alert.alert('カテゴリを読み込めませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useFocusEffect(useCallback(() => {
    getPendingTipDraft().then((draft) => {
      if (draft) return;
      resetForm();
    });
  }, []));

  const previewType = linkPreview?.type || detectLinkPreviewType(sourceUrl);
  const usedCategories = useMemo(() => {
    const recommended = sourceUrl.trim() ? getCategorySuggestions(previewType) : [];
    const seen = new Set<string>();
    return [...recommended, ...managedCategories]
      .filter((cat) => {
        const key = cat.trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 18);
  }, [managedCategories, previewType, sourceUrl]);
  useEffect(() => {
    const url = sourceUrl.trim();
    let cancelled = false;

    if (!url) {
      setLinkPreview(null);
      setLinkPreviewLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLinkPreviewLoading(true);
    const timer = setTimeout(async () => {
      const preview = await fetchLinkPreview(url);
      if (!cancelled) {
        setLinkPreview(preview);
        setLinkPreviewLoading(false);
      }
    }, 550);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sourceUrl]);

  const previewMeta = PREVIEW_META[previewType];
  const previewImage = linkPreview?.image;
  const previewTitle = linkPreview?.title || linkPreview?.siteName || previewMeta.label;
  const previewDescription = linkPreview?.description;
  const previewUrl = linkPreview?.url || normalizeUrl(sourceUrl) || sourceUrl;
  const trimmedCategory = category.trim();
  const categoryAlreadyManaged = managedCategories.some(
    (item) => item.trim().toLowerCase() === trimmedCategory.toLowerCase(),
  );
  const showAddCategoryCandidate = trimmedCategory.length > 0 && !categoryAlreadyManaged;

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('写真へのアクセスが必要です', '写真へのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82 });
    if (!result.canceled) setImageUri(result.assets[0]?.uri);
  };

  const resetForm = () => {
    setTitle('');
    setMemo('');
    setContent('');
    setSourceUrl('');
    setCategory('');
    setPriority(50);
    setImageUri(undefined);
    setShowOptional(false);
    setShowPriority(false);
    setPriorityChanged(false);
    setLinkPreview(null);
    setLinkPreviewLoading(false);
  };

  const proceedToConfirm = async () => {
    if (saving) return;
    if (!imageUri && !title.trim() && !memo.trim() && !content.trim() && !sourceUrl.trim()) {
      Alert.alert('保存する内容を追加してください', 'スクリーンショット、タイトル、メモのいずれかを追加すると保存できます。');
      return;
    }
    setSaving(true);
    try {
      await savePendingTipDraft({
        title: title.trim() || undefined,
        memo: memo.trim() || undefined,
        content: content.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        category: category.trim() || undefined,
        imageUri,
        status: 'todo',
        priority,
        afterMemo: '',
      });
      router.push('/tips/confirm');
    } catch (error) {
      Alert.alert('確認画面を開けませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const pickUse = (fullLabel: string) => {
    setMemo((prev) =>
      prev.trim() ? prev.trimEnd().replace(/\s*\/$/, '') + ' / ' + fullLabel : fullLabel,
    );
  };

  const updatePriority = (nextPriority: number) => {
    setPriority(nextPriority);
    setPriorityChanged(true);
  };

  const addCategoryCandidate = async () => {
    if (!trimmedCategory) return;
    if (!isDefaultCategory(trimmedCategory) && isAtLimit(plan, 'customCategories', countCustomCategories(managedCategories))) {
      const message = getUpgradeMessage('customCategories');
      Alert.alert(message.title, message.body, [
        { text: 'あとで', style: 'cancel' },
        { text: 'Plusを見る', onPress: () => router.push('/plus') },
      ]);
      return;
    }
    try {
      setManagedCategories(await addUserCategory(trimmedCategory));
    } catch (error) {
      Alert.alert('カテゴリを追加できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ── */}
      <View style={styles.pageHdRow}>
        <Text style={styles.pageTitle}>Add</Text>
      </View>
      <Text style={styles.pageSub}>X・YouTube・note・記事・AI回答などをあとで使える形で保存</Text>
      <LinearGradient
        colors={['#1a1a3c', '#2d1660']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickGuide}
      >
        <Text style={styles.quickGuideKicker}>Quick capture</Text>
        <Text style={styles.quickGuideTitle}>まずはURLかメモだけでOK</Text>
        <Text style={styles.quickGuideSub}>あとからタイトル・用途・カテゴリを整えられます。</Text>
        <View style={styles.quickGuidePills}>
          <Text style={styles.quickGuidePill}>URL</Text>
          <Text style={styles.quickGuidePill}>メモ</Text>
          <Text style={styles.quickGuidePill}>あとで整理</Text>
        </View>
      </LinearGradient>

      {/* ── Section 1: 保存したいコンテンツ（必須） ── */}
      <View style={styles.sec}>
        <View style={styles.secLabel}>
          <View style={[styles.secNum, { backgroundColor: colors.accent }]}>
            <Text style={styles.secNumText}>1</Text>
          </View>
          <Text style={styles.secName}>保存したいコンテンツ</Text>
          <View style={styles.tagPrimary}>
            <Text style={styles.tagPrimaryText}>必須</Text>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.urlRow}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ opacity: 0.33 }}>
              <Path
                d="M9.5 6.5l-3 3M7.2 4.8L8.6 3.4a3 3 0 014.2 4.2L11.4 9M8.6 11.2L7.2 12.6a3 3 0 01-4.2-4.2L4.4 7"
                stroke={colors.ink}
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </Svg>
            <TextInput
              value={sourceUrl}
              onChangeText={setSourceUrl}
              placeholder="保存したいページのURLを貼り付け"
              placeholderTextColor={colors.inkMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.urlInput}
            />
            {sourceUrl.length > 0 && (
              <TouchableOpacity
                onPress={() => setSourceUrl('')}
                style={styles.urlClear}
                activeOpacity={0.7}
              >
                <Text style={styles.urlClearText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.urlNote}>
            URLを貼ると種類を自動判定し、取得できる場合はプレビューを表示します
          </Text>
          {sourceUrl.trim().length > 0 && (
            <View style={styles.inlinePreview}>
              <View style={styles.inlinePreviewHeader}>
                <Text style={styles.inlinePreviewLabel}>リンクプレビュー</Text>
                <Text style={styles.inlinePreviewType}>{previewType}</Text>
              </View>
              <View style={[styles.inlinePreviewCard, styles.cardClip]}>
                {previewImage ? (
                  <View style={styles.prevImageWrap}>
                    <Image source={{ uri: previewImage }} style={styles.prevImage} resizeMode="cover" />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.58)', 'rgba(0,0,0,0.06)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.prevImageShade}
                    />
                    <View style={styles.prevSvc}>
                      <Text style={styles.prevSvcText}>{previewType}</Text>
                    </View>
                  </View>
                ) : (
                  <LinearGradient
                    colors={previewMeta.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.prevBanner}
                  >
                    <View style={styles.prevSvc}>
                      <Text style={styles.prevSvcText}>{previewType}</Text>
                    </View>
                    <Text style={styles.prevFallbackText}>{previewMeta.label}</Text>
                    <Text style={styles.prevFallbackNote}>
                      {linkPreviewLoading ? 'プレビュー取得中...' : 'リンク先プレビュー'}
                    </Text>
                  </LinearGradient>
                )}
                <View style={styles.prevBody}>
                  <Text style={styles.prevTitle} numberOfLines={2}>{previewTitle}</Text>
                  {previewDescription && (
                    <Text style={styles.prevDesc} numberOfLines={2}>{previewDescription}</Text>
                  )}
                  {!previewImage && !linkPreviewLoading && (
                    <Text style={styles.prevFallbackHelp}>
                      このリンクは画像なしでも保存できます
                    </Text>
                  )}
                  <View style={styles.prevFoot}>
                    <Text style={styles.prevUrlTiny} numberOfLines={1}>{previewUrl}</Text>
                    <TouchableOpacity
                      style={styles.openBtn}
                      activeOpacity={0.8}
                      onPress={() =>
                        Linking.openURL(previewUrl).catch(() =>
                          Alert.alert('URLを開けませんでした'),
                        )
                      }
                    >
                      <Text style={styles.openBtnText}>URLを開く</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── Section 2: Important details ── */}
      <View style={styles.sec}>
        <View style={styles.secLabel}>
          <View style={[styles.secNum, { backgroundColor: '#d9610a' }]}>
            <Text style={styles.secNumText}>2</Text>
          </View>
          <Text style={styles.secName}>あとで使える形にする</Text>
          <View style={styles.tagOrange}>
            <Text style={styles.tagOrangeText}>重要</Text>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.importantField}>
            <Text style={styles.importantLabel}>タイトル</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="例：Codexで仕様書から実装する方法"
              placeholderTextColor={colors.inkMuted}
              style={styles.importantInput}
            />
          </View>
          <View style={styles.importantField}>
            <Text style={styles.importantLabel}>この情報をどう使う？</Text>
          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="例：明日試す / 投稿ネタにする / UI改善に使う / あとで読む"
            placeholderTextColor={colors.inkMuted}
            multiline
            style={styles.useTextarea}
          />
          <View style={styles.qChipsRow}>
            {USE_CHIPS.map(({ label, full }) => (
              <TouchableOpacity
                key={label}
                style={styles.qChip}
                onPress={() => pickUse(full)}
                activeOpacity={0.75}
              >
                <Text style={styles.qChipText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          </View>
          <View style={[styles.importantField, styles.importantFieldLast]}>
            <Text style={styles.importantLabel}>カテゴリ</Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="例：UIデザイン、習慣化"
              placeholderTextColor={colors.inkMuted}
              style={styles.importantInput}
            />
            {sourceUrl.trim().length > 0 && (
              <Text style={styles.categorySuggestNote}>
                {previewType}に合いそうな候補を先に表示しています
              </Text>
            )}
            <View style={styles.tagRow}>
              {usedCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catTag, cat === category && styles.catTagActive]}
                  onPress={() => setCategory(cat === category ? '' : cat)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.catTagText, cat === category && styles.catTagTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {showAddCategoryCandidate && (
              <TouchableOpacity
                style={styles.addCategoryCandidate}
                onPress={addCategoryCandidate}
                activeOpacity={0.75}
              >
                <Text style={styles.addCategoryCandidateText}>＋「{trimmedCategory}」を候補に追加</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Section 3: Priority ── */}
      <View style={styles.sec}>
        <View style={styles.secLabel}>
          <View style={[styles.secNum, { backgroundColor: '#c7c7cc' }]}>
            <Text style={styles.secNumText}>3</Text>
          </View>
          <Text style={styles.secName}>優先度</Text>
        </View>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.prioritySummary}
            onPress={() => setShowPriority((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.prioritySummaryCopy}>
              <Text style={styles.prioritySummaryTitle}>
                {priorityChanged ? `設定済み · ${priority}` : `自動設定 · ${priority}`}
              </Text>
              <Text style={styles.prioritySummarySub}>
                {priorityChanged ? '必要に応じて再調整できます' : '標準値です。必要な場合だけ変更してください'}
              </Text>
            </View>
            <Text style={styles.priorityChange}>{showPriority ? '閉じる' : '変更'}</Text>
          </TouchableOpacity>
          {showPriority && (
            <View style={styles.priorityControls}>
              <View style={styles.sliderSep} />
              <PriorityBucketToggle value={priority} onChange={updatePriority} />
              <View style={styles.sliderSep} />
              <PrioritySlider value={priority} onChange={updatePriority} />
            </View>
          )}
        </View>
      </View>

      {/* ── Section 4: Optional extras ── */}
      <View style={styles.sec}>
        <View style={styles.secLabel}>
          <View style={[styles.secNum, { backgroundColor: '#c7c7cc' }]}>
            <Text style={styles.secNumText}>4</Text>
          </View>
          <Text style={styles.secName}>その他の情報（任意）</Text>
        </View>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collHd}
            onPress={() => setShowOptional((v) => !v)}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.collHdText}>本文メモや画像を追加</Text>
              <Text style={styles.collHdSub}>必要なときだけ開いて入力できます</Text>
            </View>
            <Text style={styles.collArr}>{showOptional ? '▴' : '▾'}</Text>
          </TouchableOpacity>
          {showOptional && (
            <View style={styles.collInner}>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="本文メモ（Tipsの内容・手順）"
                placeholderTextColor={colors.inkMuted}
                multiline
                style={[styles.optInput, styles.optInputMulti]}
              />
              <View style={styles.ssArea}>
                <Text style={styles.extraLabel}>スクショ・画像</Text>
                <View style={styles.ssScroll}>
                  <TouchableOpacity style={styles.ssAdd} onPress={pickImage} activeOpacity={0.8}>
                    <Text style={styles.ssPlus}>＋</Text>
                    <Text style={styles.ssLbl}>追加</Text>
                  </TouchableOpacity>
                  {imageUri && <Image source={{ uri: imageUri }} style={styles.ssThumb} />}
                </View>
                <Text style={styles.ssNote}>見た目や該当箇所を残したい場合だけ追加</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── 保存ボタン ── */}
      <View style={styles.saveArea}>
        <TouchableOpacity
          onPress={proceedToConfirm}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          activeOpacity={0.82}
        >
          <Text style={styles.saveBtnText}>{saving ? '準備中...' : '確認画面へ進む'}</Text>
        </TouchableOpacity>
        <Text style={styles.saveNote}>次の画面で内容を確認してから保存します</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f2f2f7', flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 110 },

  // Header
  pageHdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.ink,
  },
  pageSub: { fontSize: 12, color: colors.inkMuted, lineHeight: 18, marginBottom: 14 },
  quickGuide: {
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    padding: 16,
    ...shadow.cardSoft,
  },
  quickGuideKicker: { color: '#ffcf7a', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  quickGuideTitle: { color: '#ffffff', fontSize: 17, fontWeight: '800', letterSpacing: -0.2, marginTop: 4 },
  quickGuideSub: { color: 'rgba(255,255,255,0.72)', fontSize: 11.5, lineHeight: 17, marginTop: 4 },
  quickGuidePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  quickGuidePill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  // Section wrapper
  sec: { marginBottom: 14 },
  secLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  secNum: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secNumText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  secName: { fontSize: 12.5, fontWeight: '700', color: colors.ink, flex: 1 },
  tagPrimary: { backgroundColor: colors.accentSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tagPrimaryText: { fontSize: 10, fontWeight: '700', color: colors.accent },
  tagOrange: { backgroundColor: '#fff0e0', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tagOrangeText: { fontSize: 10, fontWeight: '700', color: '#d9610a' },

  // Card
  card: { backgroundColor: '#ffffff', borderRadius: 16, ...shadow.cardSoft },
  cardClip: { overflow: 'hidden' },

  // Section 1: URL input
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.09)',
  },
  urlInput: { flex: 1, fontSize: 13.5, color: colors.ink, paddingVertical: 0 },
  urlClear: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: '#c7c7cc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlClearText: { color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 13 },
  urlNote: { fontSize: 10.5, color: colors.inkMuted, lineHeight: 15, paddingHorizontal: 14, paddingVertical: 10 },
  inlinePreview: {
    borderTopColor: 'rgba(0,0,0,0.09)',
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
    padding: 12,
    paddingTop: 10,
  },
  inlinePreviewHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  inlinePreviewLabel: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  inlinePreviewType: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    color: colors.accentDeep,
    fontSize: 10.5,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  inlinePreviewCard: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Inline preview
  prevBanner: { alignItems: 'center', height: 100, justifyContent: 'center' },
  prevImageWrap: { height: 132, overflow: 'hidden', backgroundColor: colors.ink },
  prevImage: { height: '100%', width: '100%' },
  prevImageShade: {
    ...StyleSheet.absoluteFillObject,
  },
  prevSvc: {
    position: 'absolute',
    top: 9,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  prevSvcText: { fontSize: 10.5, fontWeight: '700', color: '#fff' },
  prevFallbackText: { color: '#ffffff', fontSize: 23, fontWeight: '800', letterSpacing: -0.4 },
  prevFallbackNote: { color: 'rgba(255,255,255,0.66)', fontSize: 10.5, fontWeight: '600', marginTop: 4 },
  prevBody: { paddingVertical: 12, paddingHorizontal: 14, gap: 5 },
  prevTitle: { color: colors.ink, fontSize: 13.5, fontWeight: '800', letterSpacing: -0.1 },
  prevDesc: { color: colors.inkSub, fontSize: 11.5, lineHeight: 17 },
  prevFallbackHelp: { color: colors.inkMuted, fontSize: 10.5, lineHeight: 15 },
  prevFoot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prevUrlTiny: { fontSize: 10.5, color: colors.inkMuted, flex: 1 },
  openBtn: {
    backgroundColor: colors.accentSoft,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  openBtnText: { fontSize: 11.5, fontWeight: '600', color: colors.accent },

  // Section 2: Important details
  useTextarea: {
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    color: colors.ink,
    fontSize: 13,
    minHeight: 70,
    paddingHorizontal: 12,
    paddingVertical: 9,
    textAlignVertical: 'top',
  },
  qChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  qChip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  qChipText: { fontSize: 12, fontWeight: '600', color: colors.accent },

  importantField: {
    borderBottomColor: 'rgba(0,0,0,0.09)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  importantFieldLast: { borderBottomWidth: 0 },
  importantLabel: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  importantInput: {
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    color: colors.ink,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  categorySuggestNote: { color: colors.inkMuted, fontSize: 10.5, lineHeight: 15 },

  // Section 3: Priority
  prioritySummary: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  prioritySummaryCopy: { flex: 1, gap: 3 },
  prioritySummaryTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  prioritySummarySub: { color: colors.inkMuted, fontSize: 11, lineHeight: 16 },
  priorityChange: { color: colors.accent, fontSize: 12, fontWeight: '700', marginLeft: 12 },
  priorityControls: { paddingHorizontal: 14, paddingBottom: 14 },

  // Section 4: Collapsible extras
  collHd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  collHdText: { fontSize: 12.5, fontWeight: '600', color: colors.inkSub },
  collHdSub: { color: colors.inkMuted, fontSize: 10.5, marginTop: 3 },
  collArr: { fontSize: 12, color: colors.inkMuted },
  collInner: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  optInput: {
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.ink,
  },
  optInputMulti: { minHeight: 60, textAlignVertical: 'top' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catTag: { backgroundColor: '#f0f0f5', borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 5 },
  catTagActive: { backgroundColor: colors.ink },
  catTagText: { color: colors.inkSub, fontSize: 11, fontWeight: '600' },
  catTagTextActive: { color: '#ffffff' },
  addCategoryCandidate: {
    alignSelf: 'flex-start',
    backgroundColor: colors.greenSoft,
    borderRadius: radius.pill,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addCategoryCandidateText: { color: colors.green, fontSize: 11.5, fontWeight: '800' },
  sliderSep: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },

  // Screenshots
  extraLabel: { color: colors.inkSub, fontSize: 11, fontWeight: '700', marginBottom: 8 },
  ssArea: { paddingTop: 4 },
  ssScroll: { flexDirection: 'row', gap: 8 },
  ssAdd: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  ssPlus: { fontSize: 20, color: colors.accent, lineHeight: 24 },
  ssLbl: { fontSize: 9.5, color: colors.accent, fontWeight: '600' },
  ssThumb: { width: 68, height: 68, borderRadius: 12 },
  ssNote: { fontSize: 10.5, color: colors.inkMuted, marginTop: 8, lineHeight: 15 },

  // Save button
  saveArea: { marginBottom: 14 },
  saveBtn: {
    backgroundColor: '#1a1a3c',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    ...shadow.button,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.1 },
  saveNote: { textAlign: 'center', fontSize: 11, color: colors.inkMuted, marginTop: 6 },

});
