import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { PriorityBucketToggle } from '@/components/PriorityBucketToggle';
import { PrioritySlider } from '@/components/PrioritySlider';
import { clampPriority, getPriorityMeta } from '@/constants/priority';
import { categories } from '@/constants/tips';
import { colors, radius, shadow, spacing } from '@/theme';
import { deleteTip, getTipById, getTips, updateTip } from '@/lib/tipsStorage';
import { Tip } from '@/types/tip';

// ─── View mode ───────────────────────────────────────────────────────────────

function ViewMode({ tip, onEdit, onToggleStatus, onAfterMemoSave }: {
  tip: Tip;
  onEdit: () => void;
  onToggleStatus: () => void;
  onAfterMemoSave: (memo: string) => void;
}) {
  const priority = clampPriority(tip.priority);
  const meta = getPriorityMeta(priority);
  const isDone = tip.status === 'done';
  const isTrash = tip.status === 'trash';
  const [afterMemo, setAfterMemo] = useState(tip.afterMemo ?? '');
  const [afterMemoSaving, setAfterMemoSaving] = useState(false);

  useEffect(() => { setAfterMemo(tip.afterMemo ?? ''); }, [tip.afterMemo]);

  const saveAfterMemo = async () => {
    if (afterMemo === (tip.afterMemo ?? '')) return;
    setAfterMemoSaving(true);
    await onAfterMemoSave(afterMemo);
    setAfterMemoSaving(false);
  };

  const createdDate = new Date(tip.createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.viewHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.82}>
          <Text style={styles.editBtnText}>編集する</Text>
        </TouchableOpacity>
      </View>

      {/* Screenshot */}
      {tip.imageUri ? (
        <Image source={{ uri: tip.imageUri }} style={styles.heroImage} resizeMode="cover" />
      ) : null}

      {/* Badges */}
      <View style={styles.badgeRow}>
        {tip.category ? (
          <View style={styles.catBadge}>
            <Text style={styles.catText}>{tip.category}</Text>
          </View>
        ) : null}
        <View style={[styles.priorityBadge, { backgroundColor: meta.background }]}>
          <Text style={[styles.priorityText, { color: meta.color }]}>
            {meta.label} · {priority}
          </Text>
        </View>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>{createdDate}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.viewTitle}>{tip.title || '無題のTips'}</Text>

      {/* Status toggle — prominent */}
      {!isTrash ? (
        <TouchableOpacity
          style={[styles.statusBar, isDone ? styles.statusBarDone : styles.statusBarTodo]}
          onPress={onToggleStatus}
          activeOpacity={0.82}
        >
          <Text style={[styles.statusBarText, isDone && styles.statusBarTextDone]}>
            {isDone ? '✓  実行済み  — タップで未実行に戻す' : '○  未実行  — タップして実行済みにする'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.trashBadge}>
          <Text style={styles.trashText}>🗑  不要としてマーク済み</Text>
        </View>
      )}

      {/* Content */}
      {tip.content ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>本文メモ</Text>
          <Text style={styles.sectionText}>{tip.content}</Text>
        </View>
      ) : null}

      {/* Memo */}
      {tip.memo ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>自分用メモ</Text>
          <Text style={styles.sectionText}>{tip.memo}</Text>
        </View>
      ) : null}

      {/* Source URL */}
      {tip.sourceUrl ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>参照URL</Text>
          <TouchableOpacity onPress={() => tip.sourceUrl && Linking.openURL(tip.sourceUrl)} activeOpacity={0.7}>
            <Text style={styles.urlText} numberOfLines={2}>{tip.sourceUrl}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* After-execution memo */}
      <View style={styles.afterMemoCard}>
        <Text style={styles.sectionLabel}>実行後メモ</Text>
        <TextInput
          value={afterMemo}
          onChangeText={setAfterMemo}
          onBlur={saveAfterMemo}
          placeholder="実行してみてどうだったか、気づきを記録..."
          placeholderTextColor={colors.inkMuted}
          multiline
          style={styles.afterMemoInput}
        />
        {afterMemo !== (tip.afterMemo ?? '') ? (
          <TouchableOpacity
            style={[styles.saveMemoBtn, afterMemoSaving && { opacity: 0.6 }]}
            onPress={saveAfterMemo}
            activeOpacity={0.82}
            disabled={afterMemoSaving}
          >
            <Text style={styles.saveMemoText}>{afterMemoSaving ? '保存中...' : 'メモを保存'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Bottom edit CTA */}
      <TouchableOpacity style={styles.editCta} onPress={onEdit} activeOpacity={0.82}>
        <Text style={styles.editCtaText}>✏️  このTipsを編集する</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Edit mode ───────────────────────────────────────────────────────────────

function EditMode({ tip, allTips, onSave, onCancel }: {
  tip: Tip;
  allTips: Tip[];
  onSave: (patch: Partial<Tip>) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(tip.title ?? '');
  const [memo, setMemo] = useState(tip.memo ?? '');
  const [content, setContent] = useState(tip.content ?? '');
  const [sourceUrl, setSourceUrl] = useState(tip.sourceUrl ?? '');
  const [category, setCategory] = useState(tip.category ?? '');
  const [priority, setPriority] = useState(tip.priority);
  const [imageUri, setImageUri] = useState<string | undefined>(tip.imageUri);
  const [status, setStatus] = useState(tip.status);
  const [saving, setSaving] = useState(false);

  const usedCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...allTips.map((t) => t.category).filter(Boolean),
          ...categories.filter((c) => c !== 'その他'),
        ]),
      ).slice(0, 18) as string[],
    [allTips],
  );

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('写真へのアクセスが必要です', '設定から写真へのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82 });
    if (!result.canceled) setImageUri(result.assets[0]?.uri);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await onSave({
      title: title.trim() || undefined,
      memo: memo.trim() || undefined,
      content: content.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      category: category.trim() || undefined,
      imageUri,
      priority,
      status,
    });
    setSaving(false);
  };

  const handleDelete = () => {
    Alert.alert('このTipsを削除しますか？', '削除したデータは復元できません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除する', style: 'destructive',
        onPress: async () => {
          await deleteTip(tip.id);
          router.back();
        },
      },
    ]);
  };

  const statusOptions: { value: Tip['status']; label: string; color: string; bg: string }[] = [
    { value: 'todo', label: '未実行', color: colors.accent, bg: '#eef0ff' },
    { value: 'done', label: '実行済み', color: colors.green, bg: '#e6f9f0' },
    { value: 'trash', label: '不要', color: colors.inkMuted, bg: colors.bg },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.editHeader}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelText}>キャンセル</Text>
        </TouchableOpacity>
        <Text style={styles.editHeaderTitle}>Tipsを編集</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          activeOpacity={0.82}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? '保存中' : '保存'}</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>タイトル</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="例: 朝一にXで挨拶投稿する"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
        />
      </View>

      {/* Screenshot */}
      <TouchableOpacity activeOpacity={0.82} style={styles.imageCard} onPress={pickImage}>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <View style={styles.imageChangeBadge}>
              <Text style={styles.imageChangeBadgeText}>タップして変更</Text>
            </View>
          </>
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

      {/* Status */}
      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>ステータス</Text>
        <View style={styles.statusRow}>
          {statusOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.statusChip,
                status === opt.value && { backgroundColor: opt.bg, borderColor: opt.color },
              ]}
              onPress={() => setStatus(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.statusChipText, status === opt.value && { color: opt.color }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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

      {/* Priority */}
      <View style={styles.priorityCard}>
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

      {/* Save CTA */}
      <TouchableOpacity
        style={[styles.saveCta, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        activeOpacity={0.82}
        disabled={saving}
      >
        <Text style={styles.saveCtaText}>{saving ? '保存中...' : '変更を保存する'}</Text>
      </TouchableOpacity>

      {/* Delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.82}>
        <Text style={styles.deleteBtnText}>このTipsを削除する</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function TipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tip, setTip] = useState<Tip | null>(null);
  const [allTips, setAllTips] = useState<Tip[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [t, all] = await Promise.all([getTipById(id), getTips()]);
    setTip(t);
    setAllTips(all);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = useCallback(async () => {
    if (!tip) return;
    const next = tip.status === 'done' ? 'todo' : 'done';
    const updated = await updateTip(tip.id, { status: next });
    if (updated) setTip(updated);
  }, [tip]);

  const handleAfterMemoSave = useCallback(async (memo: string) => {
    if (!tip) return;
    const updated = await updateTip(tip.id, { afterMemo: memo });
    if (updated) setTip(updated);
  }, [tip]);

  const handleEditSave = useCallback(async (patch: Partial<Tip>) => {
    if (!tip) return;
    const updated = await updateTip(tip.id, patch);
    if (updated) setTip(updated);
    setIsEditing(false);
  }, [tip]);

  if (!tip) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.inkMuted, fontSize: 15, marginTop: 24 }}>
          Tipsが見つかりません
        </Text>
      </View>
    );
  }

  if (isEditing) {
    return (
      <EditMode
        tip={tip}
        allTips={allTips}
        onSave={handleEditSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <ViewMode
      tip={tip}
      onEdit={() => setIsEditing(true)}
      onToggleStatus={handleToggleStatus}
      onAfterMemoSave={handleAfterMemoSave}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 120,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.lg,
  },

  // View header
  viewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: { paddingVertical: 6, paddingRight: spacing.sm },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  editBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...shadow.button,
  },
  editBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  heroImage: {
    borderRadius: radius.xl,
    height: 220,
    width: '100%',
    backgroundColor: colors.border,
  },

  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  catBadge: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  catText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  priorityBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priorityText: { fontSize: 11, fontWeight: '700' },
  dateBadge: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    ...shadow.cardSoft,
  },
  dateText: { color: colors.inkMuted, fontSize: 11 },

  viewTitle: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
  },

  // Status bar
  statusBar: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingVertical: 14,
  },
  statusBarTodo: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
  },
  statusBarDone: {
    backgroundColor: '#e6f9f0',
    borderColor: colors.green,
  },
  statusBarText: {
    color: colors.inkSub,
    fontSize: 14,
    fontWeight: '700',
  },
  statusBarTextDone: { color: colors.green },

  trashBadge: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 12,
  },
  trashText: { color: colors.inkMuted, fontSize: 13 },

  section: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    gap: 6,
    padding: spacing.md,
    ...shadow.cardSoft,
  },
  sectionLabel: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionText: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  urlText: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 20,
    textDecorationLine: 'underline',
  },

  afterMemoCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadow.card,
  },
  afterMemoInput: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  saveMemoBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  saveMemoText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  editCta: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingVertical: 15,
    ...shadow.cardSoft,
  },
  editCtaText: { color: colors.ink, fontSize: 15, fontWeight: '700' },

  // Edit header
  editHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  editHeaderTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: { paddingVertical: 6, paddingRight: spacing.sm },
  cancelText: { color: colors.inkSub, fontSize: 15, fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  saveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  // Edit fields
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

  imageCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    height: 140,
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
  imagePreview: { height: '100%', width: '100%' },
  imageChangeBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.md,
    bottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    position: 'absolute',
    right: 10,
  },
  imageChangeBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },

  statusRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  statusChip: {
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
  },
  statusChipText: { color: colors.inkSub, fontSize: 12, fontWeight: '700' },

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

  priorityCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  sliderSep: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },

  saveCta: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: 16,
    ...shadow.button,
  },
  saveCtaText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  deleteBtn: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 12,
  },
  deleteBtnText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});
