import { useCallback, useEffect, useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { clampPriority, getPriorityMeta } from '@/constants/priority';
import { colors, radius, shadow, spacing } from '@/theme';
import { getTipById, updateTip, deleteTip } from '@/lib/tipsStorage';
import { Tip } from '@/types/tip';

export default function TipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tip, setTip] = useState<Tip | null>(null);
  const [afterMemo, setAfterMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const t = await getTipById(id);
    setTip(t);
    setAfterMemo(t?.afterMemo ?? '');
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async () => {
    if (!tip) return;
    const next = tip.status === 'done' ? 'todo' : 'done';
    const updated = await updateTip(tip.id, { status: next });
    if (updated) setTip(updated);
  };

  const saveAfterMemo = async () => {
    if (!tip || saving) return;
    setSaving(true);
    const updated = await updateTip(tip.id, { afterMemo });
    if (updated) setTip(updated);
    setSaving(false);
  };

  const handleDelete = () => {
    Alert.alert('このTipsを削除しますか？', '削除したデータは復元できません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除する',
        style: 'destructive',
        onPress: async () => {
          if (!tip) return;
          await deleteTip(tip.id);
          router.back();
        },
      },
    ]);
  };

  if (!tip) {
    return (
      <View style={styles.screen}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Tipsが見つかりません</Text>
        </View>
      </View>
    );
  }

  const priority = clampPriority(tip.priority);
  const meta = getPriorityMeta(priority);
  const isDone = tip.status === 'done';
  const createdDate = new Date(tip.createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusBtn, isDone && styles.statusBtnDone]}
          onPress={toggleStatus}
          activeOpacity={0.82}
        >
          <Text style={[styles.statusBtnText, isDone && styles.statusBtnTextDone]}>
            {isDone ? '✓ 実行済み' : '実行済みにする'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screenshot */}
      {tip.imageUri ? (
        <Image source={{ uri: tip.imageUri }} style={styles.image} resizeMode="cover" />
      ) : null}

      {/* Category + Priority */}
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
      </View>

      {/* Title */}
      <Text style={styles.title}>{tip.title || '無題のTips'}</Text>

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
          <Text style={styles.sectionLabel}>URL</Text>
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
          placeholder="実行してみてどうだったか..."
          placeholderTextColor={colors.inkMuted}
          multiline
          style={styles.afterMemoInput}
        />
        {afterMemo !== (tip.afterMemo ?? '') ? (
          <TouchableOpacity
            style={[styles.saveMemoBtn, saving && styles.savingBtn]}
            onPress={saveAfterMemo}
            activeOpacity={0.82}
            disabled={saving}
          >
            <Text style={styles.saveMemoText}>{saving ? '保存中...' : 'メモを保存'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Meta info */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>保存日: {createdDate}</Text>
      </View>

      {/* Delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.82}>
        <Text style={styles.deleteBtnText}>このTipsを削除</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 110,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.lg,
  },

  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: spacing.sm,
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },

  statusBtn: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  statusBtnDone: {
    backgroundColor: '#e6f9f0',
    borderColor: colors.green,
  },
  statusBtnText: {
    color: colors.inkSub,
    fontSize: 13,
    fontWeight: '700',
  },
  statusBtnTextDone: {
    color: colors.green,
  },

  image: {
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

  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
  },

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
  sectionText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
  },
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
  savingBtn: { opacity: 0.6 },
  saveMemoText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  metaText: { color: colors.inkMuted, fontSize: 11 },

  deleteBtn: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 12,
  },
  deleteBtnText: { color: colors.danger, fontSize: 13, fontWeight: '600' },

  notFound: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  notFoundText: { color: colors.inkMuted, fontSize: 15 },
});
