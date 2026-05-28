import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { PriorityBucketToggle } from '@/components/PriorityBucketToggle';
import { PrioritySlider } from '@/components/PrioritySlider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { categories } from '@/constants/tips';
import { colors, radius, shadow, spacing } from '@/theme';
import { createTip, getTips } from '@/lib/tipsStorage';
import { Tip } from '@/types/tip';

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Add" subtitle="タイトルだけでもOK。スクショは任意です。" />

      {/* Title — primary, always visible first */}
      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>タイトル</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="例: 朝一にXで挨拶投稿する"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          autoFocus={false}
        />
      </View>

      {/* Screenshot — secondary visual */}
      <TouchableOpacity activeOpacity={0.82} style={styles.imageCard} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imageCardEmpty}>
            <View style={styles.imageIcon}>
              <Text style={styles.imageIconText}>↑</Text>
            </View>
            <Text style={styles.imageCardTitle}>スクリーンショットを追加（任意）</Text>
            <Text style={styles.imageCardSub}>タップして選択</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Save button — visible without scrolling */}
      <TouchableOpacity
        onPress={saveTip}
        disabled={saving}
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        activeOpacity={0.82}
      >
        <Text style={styles.saveButtonText}>{saving ? '保存中...' : '保存する'}</Text>
      </TouchableOpacity>

      {/* Optional fields toggle */}
      <TouchableOpacity
        onPress={() => setShowOptional((v) => !v)}
        style={styles.optionalToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.optionalToggleText}>
          {showOptional ? '▲  詳細を閉じる' : '＋  メモ・カテゴリ・優先度を追加'}
        </Text>
      </TouchableOpacity>

      {showOptional ? (
        <>
          {/* Category */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>カテゴリ</Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="例: SNS運用 / 育児 / 開発"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
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

          {/* Content */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>本文メモ</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Tipsの内容・手順"
              placeholderTextColor={colors.inkMuted}
              multiline
              style={[styles.input, styles.multiline]}
            />
          </View>

          {/* Memo */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>自分用メモ</Text>
            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="あとで思い出すためのメモ"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
            />
          </View>

          {/* Priority: 3-bucket selector (primary) + slider for fine-tuning */}
          <View style={styles.card}>
            <PriorityBucketToggle value={priority} onChange={setPriority} />
            <View style={styles.sliderSep} />
            <PrioritySlider value={priority} onChange={setPriority} />
          </View>

          {/* URL */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>URL</Text>
            <TextInput
              value={sourceUrl}
              onChangeText={setSourceUrl}
              placeholder="https://"
              placeholderTextColor={colors.inkMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
            />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 110 },

  imageCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    height: 120,
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.cardSoft,
  },
  imageCardEmpty: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  imageIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  imageIconText: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  imageCardTitle: { color: colors.inkSub, fontSize: 13, fontWeight: '600' },
  imageCardSub: { color: colors.inkMuted, fontSize: 11 },
  image: { height: '100%', width: '100%' },

  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },

  fieldCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 14,
    ...shadow.cardSoft,
  },
  fieldLabel: {
    color: colors.inkSub,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: { color: colors.ink, fontSize: 14, paddingVertical: 6 },
  multiline: { minHeight: 60, textAlignVertical: 'top' },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  catTag: {
    backgroundColor: '#f0f0f5',
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  catTagActive: { backgroundColor: colors.ink },
  catTagText: { color: colors.inkSub, fontSize: 11, fontWeight: '600' },
  catTagTextActive: { color: '#ffffff' },

  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: 16,
    ...shadow.button,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  optionalToggle: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  optionalToggleText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  sliderSep: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
});
