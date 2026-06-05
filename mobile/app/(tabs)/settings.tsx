import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SupabaseAuthCard } from '@/components/SupabaseAuthCard';
import { BillingPlan, PLUS_PRICE_JPY } from '@/constants/billing';
import { colors, radius, shadow, spacing } from '@/theme';
import { clearTips, getTips } from '@/lib/tipsStorage';
import {
  countCustomCategories,
  countMyTips,
  formatUsage,
  getCurrentBillingPlan,
  getPlanLabel,
} from '@/lib/billing';
import { getUserCategories } from '@/lib/userCategories';

const WAITLIST_KEY = 'morex.waitlist.email.v0';

export default function SettingsScreen() {
  const [dangerOpen, setDangerOpen] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [registered, setRegistered] = useState(false);
  const [categoryCount, setCategoryCount] = useState(0);
  const [plan, setPlan] = useState<BillingPlan>('free');
  const [savedTipsCount, setSavedTipsCount] = useState(0);
  const [myTipsCount, setMyTipsCount] = useState(0);
  const [customCategoryCount, setCustomCategoryCount] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(WAITLIST_KEY).then((saved) => {
      if (!saved) return;
      setEmail(saved);
      setRegistered(true);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    Promise.all([getCurrentBillingPlan(), getTips(), getUserCategories()])
      .then(([nextPlan, tips, categories]) => {
        setPlan(nextPlan);
        setSavedTipsCount(tips.length);
        setMyTipsCount(countMyTips(tips));
        setCategoryCount(categories.length);
        setCustomCategoryCount(countCustomCategories(categories));
      })
      .catch(() => {
        getUserCategories().then((items) => setCategoryCount(items.length));
      });
  }, []));

  const registerWaitlist = async () => {
    if (!email.trim()) return;
    await AsyncStorage.setItem(WAITLIST_KEY, email.trim());
    setRegistered(true);
  };

  const reset = async () => {
    try {
      await clearTips();
      setConfirmVisible(false);
      Alert.alert('削除完了', 'ログイン中のアカウントのデータを削除しました。');
    } catch (error) {
      Alert.alert('削除できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Settings" subtitle="アカウントとアプリの設定" />

      {/* Account section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>アカウント</Text>
      </View>
      <SupabaseAuthCard />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>アプリ設定</Text>
      </View>
      <TouchableOpacity
        style={styles.settingCard}
        onPress={() => router.push('/settings/categories')}
        activeOpacity={0.82}
      >
        <View style={styles.settingIcon}>
          <Text style={styles.settingIconText}>🏷</Text>
        </View>
        <View style={styles.settingBody}>
          <Text style={styles.settingTitle}>カテゴリ管理</Text>
          <Text style={styles.settingDesc}>Add画面に表示するカテゴリ候補を整理</Text>
        </View>
        <View style={styles.settingMeta}>
          <Text style={styles.settingCount}>{categoryCount}件</Text>
          <Text style={styles.settingArrow}>›</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planKicker}>現在のプラン</Text>
            <Text style={styles.planTitle}>{getPlanLabel(plan)}</Text>
          </View>
          <TouchableOpacity
            style={styles.planButton}
            onPress={() => router.push('/plus')}
            activeOpacity={0.82}
          >
            <Text style={styles.planButtonText}>Plusを見る</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.usageGrid}>
          <UsageItem label="保存Tips" value={formatUsage(plan, 'savedTips', savedTipsCount)} />
          <UsageItem label="MyTips" value={formatUsage(plan, 'myTips', myTipsCount)} />
          <UsageItem label="カスタムカテゴリ" value={formatUsage(plan, 'customCategories', customCategoryCount)} />
        </View>
        <Text style={styles.planNote}>Plusは¥{PLUS_PRICE_JPY}/月で、保存・MyTips・カテゴリを無制限にできます。</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>通知</Text>
      </View>
      {/* Release notification — highlighted CTA */}
      <View style={styles.notifyCard}>
        <Text style={styles.notifyTitle}>Plusリリース時に通知を受け取る</Text>
        {registered ? (
          <View style={styles.registeredRow}>
            <Text style={styles.registeredCheck}>✓</Text>
            <Text style={styles.registeredText}>{email} で登録済み</Text>
          </View>
        ) : (
          <View style={styles.notifyRow}>
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
              style={styles.notifyButton}
              onPress={registerWaitlist}
            >
              <Text style={styles.notifyButtonText}>登録</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>データ管理</Text>
      </View>
      {/* Danger zone accordion */}
      <TouchableOpacity
        style={styles.accordionRow}
        onPress={() => setDangerOpen((v) => !v)}
        activeOpacity={0.75}
      >
        <Text style={styles.accordionTitle}>データ削除</Text>
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

function UsageItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.usageItem}>
      <Text style={styles.usageLabel}>{label}</Text>
      <Text style={styles.usageValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 110 },

  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.inkSub,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  // Notification CTA card
  notifyCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  notifyTitle: { color: colors.accentDeep, fontSize: 14, fontWeight: '700' },
  notifyRow: { flexDirection: 'row', gap: spacing.sm },
  emailInput: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  notifyButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  notifyButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  registeredRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  registeredCheck: { color: colors.accentDeep, fontSize: 16, fontWeight: '700' },
  registeredText: { color: colors.accentDeep, fontSize: 13 },

  settingCard: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.cardSoft,
  },
  settingIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  settingIconText: { fontSize: 20 },
  settingBody: { flex: 1, gap: 3 },
  settingTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  settingDesc: { color: colors.inkSub, fontSize: 12, lineHeight: 17 },
  settingMeta: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  settingCount: { color: colors.inkMuted, fontSize: 12, fontWeight: '700' },
  settingArrow: { color: colors.inkMuted, fontSize: 22, lineHeight: 24 },
  planCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.cardSoft,
  },
  planHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planKicker: { color: colors.inkMuted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  planTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', letterSpacing: -0.4, marginTop: 2 },
  planButton: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  planButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  usageGrid: { flexDirection: 'row', gap: spacing.sm },
  usageItem: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    flex: 1,
    gap: 3,
    padding: spacing.sm,
  },
  usageLabel: { color: colors.inkMuted, fontSize: 10, fontWeight: '800' },
  usageValue: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  planNote: { color: colors.inkSub, fontSize: 11.5, lineHeight: 17 },

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
