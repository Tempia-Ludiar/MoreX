import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { PressableScale } from '@/components/PressableScale';
import { getCurrentBillingPlan, getUpgradeMessage, isAtLimit } from '@/lib/billing';
import {
  detectLinkPreviewType,
  fetchLinkPreview,
  normalizeUrl,
  type LinkPreview,
} from '@/lib/linkPreview';
import { createTip, deleteTip, getTips } from '@/lib/tipsStorage';
import { colors, gradients, radius, shadow, spacing } from '@/theme';

const SNACKBAR_MS = 6000;

function isUrlInput(text: string) {
  return /^https?:\/\/\S+$/i.test(text.trim());
}

export default function AddScreen() {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [lastSaved, setLastSaved] = useState<{ id: string; title: string } | null>(null);
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = input.trim();
  const isUrl = isUrlInput(trimmed);
  const previewType = isUrl ? (preview?.type || detectLinkPreviewType(trimmed)) : null;

  // URL入力時だけ、裏でタイトルを取りに行く（表示は1行のみ）
  useEffect(() => {
    if (!isUrl) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const next = await fetchLinkPreview(trimmed);
      if (!cancelled) setPreview(next);
    }, 550);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, isUrl]);

  useEffect(() => () => {
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
  }, []);

  const showSnackbar = (id: string, title: string) => {
    setLastSaved({ id, title });
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    snackbarTimer.current = setTimeout(() => setLastSaved(null), SNACKBAR_MS);
  };

  const save = async () => {
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const [plan, tips] = await Promise.all([getCurrentBillingPlan(), getTips()]);
      if (isAtLimit(plan, 'savedTips', tips.length)) {
        const message = getUpgradeMessage('savedTips');
        Alert.alert(message.title, message.body, [
          { text: 'あとで', style: 'cancel' },
          { text: 'Plusを見る', onPress: () => router.push('/plus') },
        ]);
        return;
      }

      let draft;
      if (isUrl) {
        draft = {
          sourceUrl: normalizeUrl(trimmed) || trimmed,
          title: preview?.title || preview?.siteName || undefined,
          status: 'todo' as const,
          priority: 50,
          afterMemo: '',
        };
      } else {
        const firstLine = trimmed.split('\n')[0].slice(0, 60);
        draft = {
          title: firstLine,
          memo: trimmed !== firstLine ? trimmed : undefined,
          status: 'todo' as const,
          priority: 50,
          afterMemo: '',
        };
      }

      const tip = await createTip(draft);
      setInput('');
      setPreview(null);
      showSnackbar(tip.id, tip.title || '無題のTips');
    } catch (error) {
      Alert.alert('保存できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const undo = async () => {
    if (!lastSaved) return;
    const target = lastSaved;
    setLastSaved(null);
    try {
      await deleteTip(target.id);
    } catch (error) {
      Alert.alert('元に戻せませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    }
  };

  const refine = () => {
    if (!lastSaved) return;
    const id = lastSaved.id;
    setLastSaved(null);
    router.push(`/tips/${id}`);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient colors={gradients.screenTint} style={styles.bgTint} pointerEvents="none" />

      <Text style={styles.title}>何を保存する？</Text>
      <Text style={styles.sub}>URLでもメモでも、1行で十分</Text>

      <View style={styles.inputCard}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="URLを貼るか、メモを書く"
          placeholderTextColor={colors.inkMuted}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        {previewType ? (
          <View style={styles.detectRow}>
            <View style={styles.detectPill}>
              <Text style={styles.detectPillText}>{previewType}</Text>
            </View>
            {preview?.title ? (
              <Text style={styles.detectTitle} numberOfLines={1}>{preview.title}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <PressableScale
        onPress={save}
        disabled={!trimmed || saving}
        style={[styles.saveBtn, (!trimmed || saving) && styles.saveBtnDisabled]}
      >
        <Text style={styles.saveBtnText}>{saving ? '保存中...' : '保存する'}</Text>
      </PressableScale>

      {lastSaved ? (
        <FadeSlideIn style={styles.snackbar}>
          <View style={styles.snackbarLeft}>
            <Text style={styles.snackbarCheck}>✓</Text>
            <Text style={styles.snackbarText} numberOfLines={1}>保存しました</Text>
          </View>
          <View style={styles.snackbarActions}>
            <PressableScale onPress={undo} style={styles.snackbarBtn}>
              <Text style={styles.snackbarBtnText}>元に戻す</Text>
            </PressableScale>
            <PressableScale onPress={refine} style={[styles.snackbarBtn, styles.snackbarBtnPrimary]}>
              <Text style={[styles.snackbarBtnText, styles.snackbarBtnTextPrimary]}>整える</Text>
            </PressableScale>
          </View>
        </FadeSlideIn>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { padding: spacing.xl, paddingTop: 84, paddingBottom: 110 },
  bgTint: { height: 260, left: -spacing.xl, position: 'absolute', right: -spacing.xl, top: 0 },

  title: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: colors.inkMuted, fontSize: 13, marginBottom: spacing.xl, marginTop: 6 },

  inputCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  input: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  detectRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  detectPill: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  detectPillText: { color: colors.accentDeep, fontSize: 12, fontWeight: '700' },
  detectTitle: { color: colors.inkSub, flex: 1, fontSize: 13 },

  saveBtn: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: 17,
    ...shadow.button,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  snackbar: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    ...shadow.card,
  },
  snackbarLeft: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: spacing.sm },
  snackbarCheck: { color: colors.green, fontSize: 16, fontWeight: '800' },
  snackbarText: { color: colors.ink, flexShrink: 1, fontSize: 14, fontWeight: '600' },
  snackbarActions: { flexDirection: 'row', gap: spacing.sm },
  snackbarBtn: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  snackbarBtnPrimary: { backgroundColor: colors.accentSoft },
  snackbarBtnText: { color: colors.inkSub, fontSize: 13, fontWeight: '700' },
  snackbarBtnTextPrimary: { color: colors.accentDeep },
});
