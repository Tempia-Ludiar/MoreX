import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TopMarquee } from '@/components/TopMarquee';
import { colors, radius, shadow, spacing } from '@/theme';
import { clearTips } from '@/lib/tipsStorage';

const WAITLIST_KEY = 'morex.waitlist.email.v0';

const plusFeatures = [
  { icon: '⚡', label: 'MyTips無制限', desc: '実行済みTipsをすべて蓄積' },
  { icon: '🔍', label: 'OCR検索', desc: 'スクショ内テキストを全文検索' },
  { icon: '📤', label: 'Markdownエクスポート', desc: 'TipsをMDファイルで書き出し' },
  { icon: '🏷', label: 'カスタムカテゴリ', desc: '自分だけのカテゴリ管理' },
];

export default function SettingsScreen() {
  const [dangerOpen, setDangerOpen] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(WAITLIST_KEY).then((saved) => {
      if (!saved) return;
      setEmail(saved);
      setRegistered(true);
    });
  }, []);

  const registerWaitlist = async () => {
    if (!email.trim()) return;
    await AsyncStorage.setItem(WAITLIST_KEY, email.trim());
    setRegistered(true);
  };

  const reset = async () => {
    await clearTips();
    setConfirmVisible(false);
    Alert.alert('削除完了', 'すべてのデータを削除しました。');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TopMarquee messages={['MoreX — 保存で終わらせない。Tipsを実行に変える。']} />
      <ScreenHeader title="Settings" subtitle="MoreXの状態とPlus機能を確認できます。" />

      {/* App info card */}
      <View style={styles.card}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <View style={styles.logoInfo}>
            <Text style={styles.appName}>MoreX</Text>
            <Text style={styles.appTagline}>保存で終わらせない。Tipsを実行に変える。</Text>
          </View>
        </View>
      </View>

      {/* Plus features */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Plus機能</Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      </View>

      <View style={styles.card}>
        {plusFeatures.map((feature, i) => (
          <View key={feature.label} style={[styles.featureRow, i > 0 && styles.featureDivider]}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureLabel}>{feature.label}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.featureNote}>
          OCR検索は端末内OCRで実装可能な場合のみ対応します。
        </Text>
      </View>

      {/* Waitlist */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>リリース通知</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.waitlistTitle}>Plusリリース時に通知を受け取る</Text>
        {registered ? (
          <View style={styles.registeredRow}>
            <Text style={styles.registeredCheck}>✓</Text>
            <Text style={styles.registeredText}>{email} で登録済み</Text>
          </View>
        ) : (
          <View style={styles.waitlistRow}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="メールアドレス"
              placeholderTextColor={colors.inkMuted}
              style={styles.emailInput}
              value={email}
            />
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.registerButton}
              onPress={registerWaitlist}
            >
              <Text style={styles.registerText}>登録</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Danger zone accordion */}
      <TouchableOpacity
        style={styles.accordionRow}
        onPress={() => setDangerOpen((v) => !v)}
        activeOpacity={0.75}
      >
        <Text style={styles.accordionTitle}>詳細設定</Text>
        <Text style={styles.accordionChevron}>{dangerOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {dangerOpen ? (
        <View style={styles.dangerCard}>
          <Text style={styles.dangerNote}>保存データの削除など、取り消せない操作です。</Text>
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.dangerButton}
            onPress={() => setConfirmVisible(true)}
          >
            <Text style={styles.dangerButtonText}>データを全削除する</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Confirm modal */}
      <Modal
        transparent
        visible={confirmVisible}
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>すべてのデータを削除します</Text>
            <Text style={styles.modalText}>
              保存されたTips、MyTips、優先度設定がすべて削除されます。{'\n'}この操作は取り消せません。
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.cancelButton}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.cancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.deleteButton}
                onPress={reset}
              >
                <Text style={styles.deleteText}>削除する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 110 },

  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },

  logoRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  logoBox: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  logoText: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  logoInfo: { flex: 1, gap: 2 },
  appName: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  appTagline: { color: colors.inkSub, fontSize: 12, lineHeight: 18 },

  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: 2 },
  sectionTitle: { color: colors.inkSub, fontSize: 12, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  comingSoonBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  comingSoonText: { color: colors.accent, fontSize: 10, fontWeight: '700' },

  featureRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  featureDivider: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md },
  featureIcon: { fontSize: 20 },
  featureInfo: { flex: 1, gap: 2 },
  featureLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  featureDesc: { color: colors.inkSub, fontSize: 12 },
  featureNote: { color: colors.inkMuted, fontSize: 11, lineHeight: 17, marginTop: spacing.xs },

  waitlistTitle: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  waitlistRow: { flexDirection: 'row', gap: spacing.sm },
  emailInput: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  registerButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  registerText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  registeredRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  registeredCheck: { color: colors.green, fontSize: 16, fontWeight: '700' },
  registeredText: { color: colors.inkSub, fontSize: 13 },

  accordionRow: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    ...shadow.cardSoft,
  },
  accordionTitle: { color: colors.inkSub, fontSize: 13, fontWeight: '600' },
  accordionChevron: { color: colors.inkMuted, fontSize: 11 },

  dangerCard: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#fca5a5',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  dangerNote: { color: colors.danger, fontSize: 12, lineHeight: 18 },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingVertical: 12,
  },
  dangerButtonText: { color: colors.danger, fontSize: 14, fontWeight: '700' },

  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.44)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    gap: spacing.md,
    padding: spacing.xl,
    width: '100%',
    ...shadow.card,
  },
  modalTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  modalText: { color: colors.inkSub, fontSize: 13, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end', marginTop: spacing.xs },
  cancelButton: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
  },
  cancelText: { color: colors.inkSub, fontSize: 14, fontWeight: '600' },
  deleteButton: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#fca5a5',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
  },
  deleteText: { color: colors.danger, fontSize: 14, fontWeight: '700' },
});
