import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { getPriorityMeta } from '@/constants/priority';
import { clearPendingTipDraft, getPendingTipDraft } from '@/lib/pendingTipDraft';
import { createTip } from '@/lib/tipsStorage';
import { colors, radius, shadow, spacing } from '@/theme';
import { TipDraft } from '@/types/tip';

export default function ConfirmTipScreen() {
  const [draft, setDraft] = useState<TipDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPendingTipDraft().then((nextDraft) => {
      setDraft(nextDraft);
      setLoading(false);
    });
  }, []);

  const save = useCallback(async () => {
    if (!draft || saving) return;
    setSaving(true);
    try {
      const tip = await createTip(draft);
      await clearPendingTipDraft();
      router.replace({ pathname: '/tips/saved', params: { id: tip.id } });
    } catch (error) {
      Alert.alert('保存できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
      setSaving(false);
    }
  }, [draft, saving]);

  if (loading) {
    return <View style={styles.center}><Text style={styles.muted}>読み込み中...</Text></View>;
  }

  if (!draft) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>確認する内容がありません</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.primaryButtonText}>Addへ戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = getPriorityMeta(draft.priority);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={styles.backText}>← 入力画面へ戻る</Text>
      </TouchableOpacity>

      <View>
        <Text style={styles.eyebrow}>保存前の確認</Text>
        <Text style={styles.title}>{draft.title || '無題のTips'}</Text>
      </View>

      {draft.imageUri ? <Image source={{ uri: draft.imageUri }} style={styles.image} resizeMode="cover" /> : null}

      <View style={styles.badgeRow}>
        {draft.category ? <Text style={styles.categoryBadge}>{draft.category}</Text> : null}
        <Text style={[styles.priorityBadge, { backgroundColor: meta.background, color: meta.color }]}>
          {meta.label} · {draft.priority}
        </Text>
      </View>

      {draft.memo ? <InfoCard label="この情報をどう使う？" value={draft.memo} /> : null}
      {draft.content ? <InfoCard label="本文メモ" value={draft.content} /> : null}
      {draft.sourceUrl ? (
        <View style={styles.card}>
          <Text style={styles.label}>参照URL</Text>
          <TouchableOpacity onPress={() => draft.sourceUrl && Linking.openURL(draft.sourceUrl)}>
            <Text style={styles.url}>{draft.sourceUrl}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.primaryButton, saving && styles.disabled]} onPress={save} disabled={saving}>
        <Text style={styles.primaryButtonText}>{saving ? '保存中...' : 'この内容で保存する'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} disabled={saving}>
        <Text style={styles.secondaryButtonText}>入力内容を修正する</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.body}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 120, paddingTop: Platform.OS === 'ios' ? 56 : spacing.lg },
  center: { alignItems: 'center', backgroundColor: colors.bg, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  backText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 5 },
  title: { color: colors.ink, fontSize: 26, fontWeight: '800', lineHeight: 34 },
  muted: { color: colors.inkMuted, fontSize: 14 },
  image: { backgroundColor: colors.border, borderRadius: radius.xl, height: 190, width: '100%' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryBadge: { backgroundColor: colors.ink, borderRadius: radius.pill, color: '#ffffff', fontSize: 11, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5 },
  priorityBadge: { borderRadius: radius.pill, fontSize: 11, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5 },
  card: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, gap: 7, padding: spacing.md, ...shadow.cardSoft },
  label: { color: colors.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  url: { color: colors.accent, fontSize: 13, lineHeight: 20, textDecorationLine: 'underline' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.lg, marginTop: spacing.sm, paddingVertical: 16, ...shadow.button },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.bgElevated, borderColor: colors.ink, borderRadius: radius.lg, borderWidth: 1.5, paddingVertical: 14 },
  secondaryButtonText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
