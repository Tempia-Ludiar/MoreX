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
  const [contentType, setContentType] = useState('');

  const load = useCallback(async () => setTips(await getTips()), []);
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
    } finally {
      setSaving(false);
    }
  };

  const pickUse = (fullLabel: string) => {
    setMemo((prev) =>
      prev.trim() ? prev.trimEnd().replace(/\s*\/$/, '') + ' / ' + fullLabel : fullLabel,
    );
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
        <TouchableOpacity
          style={styles.shareBtn}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert(
              '共有から追加',
              'iOSの共有ボタン →「MoreX」を選ぶと、どのアプリからでもすぐに保存できます。',
            )
          }
        >
          <Svg width={13} height={13} viewBox="0 0 14 14" fill="none">
            <Path
              d="M9.5 1.5L13 5m0 0L9.5 8.5M13 5H5.5C3.6 5 2 6.3 2 8.2V12"
              stroke={colors.accent}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.shareBtnText}>共有から追加</Text>
        </TouchableOpacity>
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
              placeholder="URLを貼る、または共有から追加"
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
              colors={['#110120', '#2d1660', '#183058']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.prevBanner}
            >
              <View style={styles.prevSvc}>
                <Text style={styles.prevSvcText}>{contentType || '🌐 Web'}</Text>
              </View>
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

      {/* ── Section 3: この情報をどう使う？（重要） ── */}
      <View style={styles.sec}>
        <View style={styles.secLabel}>
          <View style={[styles.secNum, { backgroundColor: '#d9610a' }]}>
            <Text style={styles.secNumText}>3</Text>
          </View>
          <Text style={styles.secName}>この情報をどう使う？</Text>
          <View style={styles.tagOrange}>
            <Text style={styles.tagOrangeText}>重要</Text>
          </View>
        </View>
        <View style={styles.card}>
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
      </View>

      {/* ── Section 4: タイトル・メモ・カテゴリ・優先度（折りたたみ） ── */}
      <View style={styles.sec}>
        <View style={styles.secLabel}>
          <View style={[styles.secNum, { backgroundColor: '#c7c7cc' }]}>
            <Text style={styles.secNumText}>4</Text>
          </View>
          <Text style={styles.secName}>タイトル・メモ・カテゴリ・優先度（任意）</Text>
        </View>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collHd}
            onPress={() => setShowOptional((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.collHdText}>詳細を追加する</Text>
            <Text style={styles.collArr}>{showOptional ? '▴' : '▾'}</Text>
          </TouchableOpacity>
          {showOptional && (
            <View style={styles.collInner}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="タイトル（例：朝一にXで挨拶投稿する）"
                placeholderTextColor={colors.inkMuted}
                style={styles.optInput}
              />
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="本文メモ（Tipsの内容・手順）"
                placeholderTextColor={colors.inkMuted}
                multiline
                style={[styles.optInput, styles.optInputMulti]}
              />
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="カテゴリ（例：UIデザイン、習慣化）"
                placeholderTextColor={colors.inkMuted}
                style={styles.optInput}
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
              <View style={styles.sliderSep} />
              <PriorityBucketToggle value={priority} onChange={setPriority} />
              <View style={styles.sliderSep} />
              <PrioritySlider value={priority} onChange={setPriority} />
            </View>
          )}
        </View>
      </View>

      {/* ── Section 5: スクショ・画像（任意） ── */}
      <View style={styles.sec}>
        <View style={styles.secLabel}>
          <View style={[styles.secNum, { backgroundColor: '#c7c7cc' }]}>
            <Text style={styles.secNumText}>5</Text>
          </View>
          <Text style={styles.secName}>スクショ・画像を追加（任意）</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.ssArea}>
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
          <Text style={styles.hintTitle}>共有メニューからも追加できます</Text>
          <Text style={styles.hintDesc}>
            iOSの共有ボタン →「MoreX」を選ぶと、どのアプリからでもすぐに保存できます
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
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingLeft: 10,
    paddingRight: 13,
  },
  shareBtnText: { color: colors.accent, fontSize: 12.5, fontWeight: '600' },
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
  prevBanner: { height: 100 },
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

  // Section 3: どう使う
  useTextarea: {
    fontSize: 13.5,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.09)',
  },
  qChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 13,
  },
  qChip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  qChipText: { fontSize: 12, fontWeight: '600', color: colors.accent },

  // Section 4: Collapsible
  collHd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  collHdText: { fontSize: 12.5, fontWeight: '600', color: colors.inkSub },
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

  // Section 5: Screenshots
  ssArea: { paddingHorizontal: 14, paddingTop: 11, paddingBottom: 14 },
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
