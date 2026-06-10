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
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { PressableScale } from '@/components/PressableScale';
import { PriorityBucketToggle } from '@/components/PriorityBucketToggle';
import { PrioritySlider } from '@/components/PrioritySlider';
import { StarPop } from '@/components/StarPop';
import { clampPriority } from '@/constants/priority';
import { colors, radius, shadow, spacing } from '@/theme';
import { countMyTips, getCurrentBillingPlan, getUpgradeMessage, isAtLimit } from '@/lib/billing';
import { deleteTip, getTipById, getTips, updateTip } from '@/lib/tipsStorage';
import { getUserCategories } from '@/lib/userCategories';
import { Tip } from '@/types/tip';

// ─── Source / hero config ────────────────────────────────────────────────────

const KNOWN_SOURCES_SET = new Set(['ChatGPT', 'Claude', 'Codex', 'X', 'YouTube', 'note', 'Web']);

const HERO_GRADIENTS: Record<string, [string, string, string]> = {
  ChatGPT: ['#0a1a10', '#0d3320', '#155830'],
  Claude:  ['#0e0828', '#1a1050', '#2d1870'],
  Codex:   ['#100820', '#1e1045', '#3a1878'],
  X:       ['#080810', '#121220', '#1a1a28'],
  YouTube: ['#1a0508', '#3a0c0c', '#5c1212'],
  note:    ['#0d052a', '#200a4a', '#38106a'],
  Web:     ['#050d20', '#0a2040', '#123060'],
  Other:   ['#0e0e2a', '#1a1848', '#261568'],
};

const SOURCE_CHIP_STYLES: Record<string, { bg: string; text: string }> = {
  ChatGPT: { bg: 'rgba(52,199,89,0.22)',   text: '#4ade80' },
  Claude:  { bg: 'rgba(139,92,246,0.22)',  text: '#c084fc' },
  Codex:   { bg: 'rgba(244,114,182,0.22)', text: '#f472b6' },
  X:       { bg: 'rgba(200,200,200,0.15)', text: '#e5e5e5' },
  YouTube: { bg: 'rgba(255,60,50,0.22)',   text: '#ff8080' },
  note:    { bg: 'rgba(190,100,242,0.22)', text: '#d880f5' },
  Web:     { bg: 'rgba(90,200,250,0.22)',  text: '#7dd3fc' },
  Other:   { bg: 'rgba(255,220,80,0.18)',  text: '#fbbf24' },
};

const PRIORITY_HERO = {
  high: { bg: 'rgba(255,122,48,0.22)', text: '#ffb070', label: 'HIGH' },
  mid:  { bg: 'rgba(255,204,0,0.22)',  text: '#ffd585', label: 'MED' },
  low:  { bg: 'rgba(99,102,241,0.22)', text: '#a5b4fc', label: 'LOW' },
} as const;

function getSourceKey(category?: string): string {
  const cat = category?.trim();
  if (!cat) return 'Other';
  return KNOWN_SOURCES_SET.has(cat) ? cat : 'Other';
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

// ─── View mode ───────────────────────────────────────────────────────────────

function ViewMode({ tip, onEdit, onToggleStatus, onAddToMyTips, onAfterMemoSave }: {
  tip: Tip;
  onEdit: () => void;
  onToggleStatus: () => void;
  onAddToMyTips: () => Promise<void>;
  onAfterMemoSave: (memo: string) => void;
}) {
  const priority = clampPriority(tip.priority);
  const isDone = tip.status === 'done';
  const isTrash = tip.status === 'trash';
  const [afterMemo, setAfterMemo] = useState(tip.afterMemo ?? '');
  const [afterMemoSaving, setAfterMemoSaving] = useState(false);
  const [myTipsSaving, setMyTipsSaving] = useState(false);

  useEffect(() => { setAfterMemo(tip.afterMemo ?? ''); }, [tip.afterMemo]);

  const saveAfterMemo = async () => {
    if (afterMemo === (tip.afterMemo ?? '')) return;
    setAfterMemoSaving(true);
    await onAfterMemoSave(afterMemo);
    setAfterMemoSaving(false);
  };

  const addToMyTips = async () => {
    if (tip.isInMyTips || myTipsSaving) return;
    setMyTipsSaving(true);
    try { await onAddToMyTips(); }
    finally { setMyTipsSaving(false); }
  };

  const createdDate = new Date(tip.createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const srcKey = getSourceKey(tip.category);
  const heroGrad = (HERO_GRADIENTS[srcKey] ?? HERO_GRADIENTS.Other) as [string, string, string];
  const srcStyle = SOURCE_CHIP_STYLES[srcKey] ?? SOURCE_CHIP_STYLES.Other;
  const priHero = priority >= 75 ? PRIORITY_HERO.high : priority >= 50 ? PRIORITY_HERO.mid : PRIORITY_HERO.low;
  const showCategoryChip = tip.category && tip.category.trim() !== srcKey;
  const hasMemo = (tip.afterMemo ?? '').length > 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.viewContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Hero ── */}
      <LinearGradient
        colors={heroGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBackBtn} activeOpacity={0.75}>
            <Text style={styles.heroBackText}>← 戻る</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} style={styles.heroEditChip} activeOpacity={0.75}>
            <Text style={styles.heroEditChipText}>✏️ 編集</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroBadgeRow}>
          <View style={[styles.heroChip, { backgroundColor: srcStyle.bg }]}>
            <Text style={[styles.heroChipText, { color: srcStyle.text }]}>{srcKey}</Text>
          </View>
          {showCategoryChip ? (
            <View style={[styles.heroChip, { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
              <Text style={[styles.heroChipText, { color: 'rgba(255,255,255,0.70)' }]}>{tip.category}</Text>
            </View>
          ) : null}
          <View style={[styles.heroChip, { backgroundColor: priHero.bg }]}>
            <Text style={[styles.heroChipText, { color: priHero.text }]}>
              {priHero.label} · {priority}
            </Text>
          </View>
          {isTrash ? (
            <View style={[styles.heroChip, { backgroundColor: 'rgba(144,144,160,0.18)' }]}>
              <Text style={[styles.heroChipText, { color: 'rgba(255,255,255,0.45)' }]}>不要</Text>
            </View>
          ) : isDone ? (
            <View style={[styles.heroChip, { backgroundColor: 'rgba(16,185,129,0.22)' }]}>
              <Text style={[styles.heroChipText, { color: '#6ee7b7' }]}>✓ 実行済み</Text>
            </View>
          ) : (
            <View style={[styles.heroChip, { backgroundColor: 'rgba(99,102,241,0.22)' }]}>
              <Text style={[styles.heroChipText, { color: '#a5b4fc' }]}>未実行</Text>
            </View>
          )}
        </View>

        <Text style={styles.heroTitle}>{tip.title || '無題のTips'}</Text>
        <Text style={styles.heroDate}>{createdDate} 保存</Text>

        {tip.imageUri ? (
          <Image source={{ uri: tip.imageUri }} style={styles.heroThumb} resizeMode="cover" />
        ) : null}

        <View style={styles.heroPriorityTrack}>
          <View style={[styles.heroPriorityFill, { width: `${priority}%` as any, backgroundColor: priHero.text }]} />
        </View>
      </LinearGradient>

      {/* ── Actions ── */}
      <View style={styles.actionSection}>
        {!isTrash ? (
          <PressableScale onPress={onToggleStatus} style={styles.actionBtnWrapper}>
            <LinearGradient
              colors={isDone ? ['#059669', '#10b981'] : ['#1a1a3c', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionPrimary}
            >
              <Text style={[styles.actionPrimaryText, isDone && styles.actionPrimaryTextDone]}>
                {isDone ? '✓  実行済み  —  タップで未実行に戻す' : '▶  実行済みにする'}
              </Text>
            </LinearGradient>
          </PressableScale>
        ) : (
          <View style={styles.trashNotice}>
            <Text style={styles.trashNoticeText}>🗑  不要としてマーク済み</Text>
          </View>
        )}

        {isDone && !isTrash ? (
          <PressableScale
            style={[styles.actionMyTips, styles.actionMyTipsRow, tip.isInMyTips && styles.actionMyTipsAdded]}
            onPress={addToMyTips}
            disabled={tip.isInMyTips || myTipsSaving}
          >
            <StarPop
              active={tip.isInMyTips === true}
              size={14}
              activeColor="#7c3aed"
              inactiveColor={colors.accentDeep}
            />
            <Text style={[styles.actionMyTipsText, tip.isInMyTips && styles.actionMyTipsTextAdded]}>
              {tip.isInMyTips ? ' MyTips 追加済み' : myTipsSaving ? ' 追加中...' : ' MyTipsに追加する'}
            </Text>
          </PressableScale>
        ) : null}
      </View>

      {/* ── Core Insight ── */}
      {tip.content ? (
        <View style={styles.insightCard}>
          <LinearGradient
            colors={[colors.accent, colors.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.insightBar}
          />
          <View style={styles.insightBody}>
            <Text style={styles.cardLabel}>CORE INSIGHT</Text>
            <Text style={styles.insightText}>{tip.content}</Text>
          </View>
        </View>
      ) : null}

      {/* ── My Plan ── */}
      {tip.memo ? (
        <View style={styles.noteCard}>
          <Text style={styles.cardLabel}>MY PLAN</Text>
          <Text style={styles.noteText}>{tip.memo}</Text>
        </View>
      ) : null}

      {/* ── Source ── */}
      {tip.sourceUrl ? (
        <TouchableOpacity
          style={styles.sourceCard}
          onPress={() => tip.sourceUrl && Linking.openURL(tip.sourceUrl)}
          activeOpacity={0.8}
        >
          <View style={styles.sourceRow}>
            <Text style={styles.cardLabel}>SOURCE</Text>
            <Text style={styles.sourceArrow}>↗</Text>
          </View>
          <Text style={styles.sourceDomain}>{extractDomain(tip.sourceUrl)}</Text>
          <Text style={styles.sourceUrl} numberOfLines={1}>{tip.sourceUrl}</Text>
        </TouchableOpacity>
      ) : null}

      {/* ── After Action ── */}
      <View style={[styles.afterCard, hasMemo && styles.afterCardFilled]}>
        <Text style={[styles.cardLabel, hasMemo && styles.cardLabelLight]}>AFTER ACTION</Text>
        <TextInput
          value={afterMemo}
          onChangeText={setAfterMemo}
          onBlur={saveAfterMemo}
          placeholder="実行してみてどうだったか、気づきを記録..."
          placeholderTextColor={hasMemo ? 'rgba(255,255,255,0.35)' : colors.inkMuted}
          multiline
          style={[styles.afterInput, hasMemo && styles.afterInputDark]}
        />
        {afterMemo !== (tip.afterMemo ?? '') ? (
          <TouchableOpacity
            style={[styles.afterSaveBtn, afterMemoSaving && { opacity: 0.6 }]}
            onPress={saveAfterMemo}
            activeOpacity={0.82}
            disabled={afterMemoSaving}
          >
            <Text style={styles.afterSaveText}>{afterMemoSaving ? '保存中...' : 'メモを保存'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Footer ── */}
      <View style={styles.viewFooter}>
        <TouchableOpacity style={styles.editFooterBtn} onPress={onEdit} activeOpacity={0.82}>
          <Text style={styles.editFooterText}>このTipsを編集する</Text>
        </TouchableOpacity>
      </View>
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
  const [managedCategories, setManagedCategories] = useState<string[]>([]);

  useEffect(() => {
    getUserCategories().then(setManagedCategories);
  }, []);

  const usedCategories = useMemo(
    () => {
      const currentCategory = tip.category?.trim();
      const next = currentCategory && !managedCategories.includes(currentCategory)
        ? [currentCategory, ...managedCategories]
        : managedCategories;
      return next.slice(0, 18);
    },
    [managedCategories, tip.category],
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
    try {
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
    } catch (error) {
      Alert.alert('保存できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    } finally {
      setSaving(false);
    }
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
        <View style={styles.fieldLabelRow}>
          <Text style={[styles.fieldLabel, styles.fieldLabelInRow]}>カテゴリ</Text>
          <TouchableOpacity
            onPress={() => router.push('/settings/categories')}
            activeOpacity={0.75}
          >
            <Text style={styles.manageCategoryLink}>設定で管理</Text>
          </TouchableOpacity>
        </View>
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
    try {
      const [t, all] = await Promise.all([getTipById(id), getTips()]);
      setTip(t);
      setAllTips(all);
    } catch (error) {
      Alert.alert('クラウド保存を確認してください', error instanceof Error ? error.message : 'Tipsを読み込めませんでした。');
    }
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

  const handleAddToMyTips = useCallback(async () => {
    if (!tip || tip.isInMyTips) return;
    try {
      const plan = await getCurrentBillingPlan();
      if (isAtLimit(plan, 'myTips', countMyTips(allTips))) {
        const message = getUpgradeMessage('myTips');
        Alert.alert(message.title, message.body, [
          { text: 'あとで', style: 'cancel' },
          { text: 'Plusを見る', onPress: () => router.push('/plus') },
        ]);
        return;
      }
      const updated = await updateTip(tip.id, { isInMyTips: true });
      if (updated) setTip(updated);
    } catch (error) {
      Alert.alert('MyTipsに追加できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    }
  }, [allTips, tip]);

  const handleEditSave = useCallback(async (patch: Partial<Tip>) => {
    if (!tip) return;
    const updated = await updateTip(tip.id, patch);
    if (updated) setTip(updated);
    setIsEditing(false);
  }, [tip]);

  if (!tip) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <TouchableOpacity
          style={{ paddingVertical: 6, paddingRight: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '600' }}>← 戻る</Text>
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
      onAddToMyTips={handleAddToMyTips}
      onAfterMemoSave={handleAfterMemoSave}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },

  // ── View mode ──────────────────────────────────────────────────────────────

  viewContent: {
    gap: spacing.md,
    paddingBottom: 120,
  },

  // Hero
  hero: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.xl,
  },
  heroNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  heroBackBtn: { paddingRight: spacing.sm, paddingVertical: 6 },
  heroBackText: { color: 'rgba(255,255,255,0.82)', fontSize: 15, fontWeight: '600' },
  heroEditChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroEditChipText: { color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: '600' },
  heroBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroChip: {
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  heroChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  heroTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginTop: spacing.xs,
  },
  heroDate: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  heroThumb: {
    borderRadius: radius.lg,
    height: 160,
    marginTop: spacing.sm,
    width: '100%',
  },
  heroPriorityTrack: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    height: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
    width: '100%',
  },
  heroPriorityFill: {
    borderRadius: 2,
    height: 3,
    opacity: 0.75,
  },

  // Actions
  actionSection: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionBtnWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.button,
  },
  actionPrimary: {
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: 16,
  },
  actionPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionPrimaryTextDone: { color: '#d1fae5' },
  actionMyTips: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    paddingVertical: 14,
  },
  actionMyTipsRow: { flexDirection: 'row', justifyContent: 'center' },
  actionMyTipsAdded: { backgroundColor: '#f3e8ff' },
  actionMyTipsText: { color: colors.accentDeep, fontSize: 14, fontWeight: '700' },
  actionMyTipsTextAdded: { color: '#7c3aed' },
  trashNotice: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 12,
  },
  trashNoticeText: { color: colors.inkMuted, fontSize: 13 },

  // Core Insight
  insightCard: {
    backgroundColor: 'rgba(99,102,241,0.04)',
    borderColor: 'rgba(99,102,241,0.10)',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  insightBar: {
    width: 5,
  },
  insightBody: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardLabel: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  cardLabelLight: {
    color: 'rgba(255,255,255,0.50)',
  },
  insightText: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 26,
  },

  // My Plan
  noteCard: {
    backgroundColor: '#fffdf5',
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    ...shadow.cardSoft,
  },
  noteText: { color: colors.inkSub, fontSize: 14, lineHeight: 22 },

  // Source
  sourceCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    gap: 6,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    ...shadow.cardSoft,
  },
  sourceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sourceArrow: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  sourceDomain: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sourceUrl: { color: colors.inkMuted, fontSize: 11, lineHeight: 16 },

  // After Action
  afterCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    ...shadow.card,
  },
  afterCardFilled: {
    backgroundColor: '#1a1a2e',
  },
  afterInput: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  afterInputDark: {
    color: '#e5e5ff',
  },
  afterSaveBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  afterSaveText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  // View footer
  viewFooter: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  editFooterBtn: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingVertical: 14,
    ...shadow.cardSoft,
  },
  editFooterText: { color: colors.ink, fontSize: 14, fontWeight: '600' },

  // ── Edit mode ──────────────────────────────────────────────────────────────

  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 120,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.lg,
  },

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
  fieldLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabelInRow: { marginBottom: 0 },
  manageCategoryLink: { color: colors.accentDeep, fontSize: 11, fontWeight: '800' },
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
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    flex: 1,
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
