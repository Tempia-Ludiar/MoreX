import { useCallback, useMemo, useState } from 'react';
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
import { categories } from '@/constants/tips';
import { colors, radius, shadow, spacing } from '@/theme';
import { createTip, getTips } from '@/lib/tipsStorage';
import { Tip } from '@/types/tip';

const CONTENT_TYPES = ['X', 'YouTube', 'note', 'Web記事', 'AI回答'];
type ContentType = (typeof CONTENT_TYPES)[number];

const PREVIEW_META: Record<ContentType, { label: string; colors: [string, string, string] }> = {
  X: { label: 'X', colors: ['#080808', '#1b1b1b', '#303030'] },
  YouTube: { label: 'YouTube', colors: ['#4a0000', '#b00000', '#ff3b30'] },
  note: { label: 'note', colors: ['#075c4e', '#109b83', '#41c9b1'] },
  Web記事: { label: 'Web記事', colors: ['#110120', '#2d1660', '#183058'] },
  AI回答: { label: 'AI回答', colors: ['#15203b', '#3447a8', '#6366f1'] },
};

function detectContentType(sourceUrl: string): ContentType {
  const rawUrl = sourceUrl.trim();
  if (!rawUrl) return 'Web記事';
  try {
    const normalizedUrl = /^[a-z][a-z\d+\-.]*:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const hostname = new URL(normalizedUrl).hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'x.com' || hostname.endsWith('.x.com') || hostname === 'twitter.com' || hostname.endsWith('.twitter.com')) {
      return 'X';
    }
    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be') {
      return 'YouTube';
    }
    if (hostname === 'note.com' || hostname.endsWith('.note.com')) return 'note';
  } catch {
    return 'Web記事';
  }
  return 'Web記事';
}

const USE_CHIPS: { label: string; full: string }[] = [
  { label: 'あとで試す', full: 'あとで試す' },
  { label: '投稿ネタ',   full: '投稿ネタにする' },
  { label: 'UI参考',    full: 'UI参考にする' },
  { label: '実装する',  full: '実装する' },
  { label: '読み返す',  full: '読み返す' },
  { label: '学習メモ',  full: '学習メモ' },
];

export default function AddScreen() {
  const [tips, setTips] = useState<Tip[]>([]);
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
  const [contentType, setContentType] = useState('');

  const load = useCallback(async () => {
    try {
      setTips(await getTips());
    } catch (error) {
      Alert.alert('クラウド保存を確認してください', error instanceof Error ? error.message : 'Tipsを読み込めませんでした。');
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const usedCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...tips.map((t) => t.category).filter(Boolean),
          ...categories.filter((c) => c !== 'その他'),
        ]),
      ).slice(0, 18) as string[],
    [tips],
  );
  const previewType = contentType || detectContentType(sourceUrl);
  const previewMeta = PREVIEW_META[previewType];

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
    setContentType('');
  };

  const saveTip = async () => {
    if (saving) return;
    if (!imageUri && !title.trim() && !memo.trim() && !content.trim() && !sourceUrl.trim()) {
      Alert.alert('保存する内容を追加してください', 'スクリーンショット、タイトル、メモのいずれかを追加すると保存できます。');
      return;
    }
    setSaving(true);
    try {
      const tip = await createTip({
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
      resetForm();
      await load();
      router.push(`/tips/${tip.id}`);
    } catch (error) {
      Alert.alert('保存できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {CONTENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, contentType === type && styles.chipOn]}
                onPress={() => setContentType((prev) => (prev === type ? '' : type))}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, contentType === type && styles.chipTextOn]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.urlNote}>URLをMoreXに貼ると、コンテンツ情報を正確に取得できます</Text>
        </View>
      </View>

      {/* ── Section 2: プレビュー（URL入力時のみ表示） ── */}
      {sourceUrl.trim().length > 0 && (
        <View style={styles.sec}>
          <View style={styles.secLabel}>
            <View style={[styles.secNum, { backgroundColor: colors.accent }]}>
              <Text style={styles.secNumText}>2</Text>
            </View>
            <Text style={styles.secName}>プレビュー</Text>
          </View>
          <View style={[styles.card, styles.cardClip]}>
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
              <Text style={styles.prevFallbackNote}>リンク先プレビュー</Text>
            </LinearGradient>
            <View style={styles.prevBody}>
              <View style={styles.prevFoot}>
                <Text style={styles.prevUrlTiny} numberOfLines={1}>{sourceUrl}</Text>
                <TouchableOpacity
                  style={styles.openBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    Linking.openURL(sourceUrl).catch(() =>
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

      {/* ── Section 3: Important details ── */}
      <View style={styles.sec}>
        <View style={styles.secLabel}>
          <View style={[styles.secNum, { backgroundColor: '#d9610a' }]}>
            <Text style={styles.secNumText}>3</Text>
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
          </View>
        </View>
      </View>

      {/* ── Section 4: Priority ── */}
      <View style={styles.sec}>
        <View style={styles.secLabel}>
          <View style={[styles.secNum, { backgroundColor: '#c7c7cc' }]}>
            <Text style={styles.secNumText}>4</Text>
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

      {/* ── Section 5: Optional extras ── */}
      <View style={styles.sec}>
        <View style={styles.secLabel}>
          <View style={[styles.secNum, { backgroundColor: '#c7c7cc' }]}>
            <Text style={styles.secNumText}>5</Text>
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
          onPress={saveTip}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          activeOpacity={0.82}
        >
          <Text style={styles.saveBtnText}>{saving ? '保存中...' : '保存する'}</Text>
        </TouchableOpacity>
        <Text style={styles.saveNote}>あとで使うために保存</Text>
      </View>

      {/* ── ヒントカード ── */}
      <View style={styles.hintCard}>
        <View style={styles.hintIcon}>
          <Text style={styles.hintIconText}>M</Text>
        </View>
        <View style={styles.hintBody}>
          <Text style={styles.hintTitle}>URLをコピーして貼り付けるだけ</Text>
          <Text style={styles.hintDesc}>
            X・YouTube・note・Web記事などのURLをコピーし、上の入力欄へ貼り付けてください
          </Text>
        </View>
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
  chipsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  chip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  chipOn: { backgroundColor: colors.accent },
  chipText: { fontSize: 11.5, fontWeight: '600', color: colors.accent },
  chipTextOn: { color: '#fff' },
  urlNote: { fontSize: 10.5, color: colors.inkMuted, paddingHorizontal: 14, paddingBottom: 10 },

  // Section 2: Preview
  prevBanner: { alignItems: 'center', height: 100, justifyContent: 'center' },
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
  prevBody: { paddingVertical: 12, paddingHorizontal: 14 },
  prevFoot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prevUrlTiny: { fontSize: 10.5, color: colors.inkMuted, flex: 1 },
  openBtn: {
    backgroundColor: colors.accentSoft,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  openBtnText: { fontSize: 11.5, fontWeight: '600', color: colors.accent },

  // Section 3: Important details
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

  // Section 4: Priority
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

  // Section 5: Collapsible extras
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

  // Hint card
  hintCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
    ...shadow.cardSoft,
  },
  hintIcon: {
    width: 36,
    height: 36,
    backgroundColor: colors.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintIconText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  hintBody: { flex: 1 },
  hintTitle: { fontSize: 12, fontWeight: '700', color: colors.ink, marginBottom: 3 },
  hintDesc: { fontSize: 11, color: colors.inkMuted, lineHeight: 16 },
});
