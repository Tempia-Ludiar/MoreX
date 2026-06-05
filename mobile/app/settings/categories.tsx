import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BillingPlan } from '@/constants/billing';
import { colors, radius, shadow, spacing } from '@/theme';
import {
  countCustomCategories,
  formatUsage,
  getCurrentBillingPlan,
  getUpgradeMessage,
  isDefaultCategory,
  isAtLimit,
} from '@/lib/billing';
import {
  addUserCategory,
  deleteUserCategory,
  getUserCategories,
  renameUserCategory,
  resetUserCategories,
} from '@/lib/userCategories';

export default function CategorySettingsScreen() {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<BillingPlan>('free');

  useEffect(() => {
    Promise.all([getCurrentBillingPlan(), getUserCategories()]).then(([nextPlan, nextCategories]) => {
      setPlan(nextPlan);
      setCategories(nextCategories);
    });
  }, []);

  const addCategory = async () => {
    const value = newCategory.trim();
    if (!value || saving) return;
    if (!isDefaultCategory(value) && isAtLimit(plan, 'customCategories', countCustomCategories(categories))) {
      const message = getUpgradeMessage('customCategories');
      Alert.alert(message.title, message.body, [
        { text: 'あとで', style: 'cancel' },
        { text: 'Plusを見る', onPress: () => router.push('/plus') },
      ]);
      return;
    }

    setSaving(true);
    try {
      const next = await addUserCategory(value);
      setCategories(next);
      setNewCategory('');
    } catch (error) {
      Alert.alert('追加できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (category: string) => {
    setEditingCategory(category);
    setEditingValue(category);
  };

  const saveEditing = async () => {
    if (!editingCategory || saving) return;
    const value = editingValue.trim();
    if (!value) {
      Alert.alert('カテゴリ名を入力してください');
      return;
    }

    setSaving(true);
    try {
      const next = await renameUserCategory(editingCategory, value);
      setCategories(next);
      setEditingCategory(null);
      setEditingValue('');
    } catch (error) {
      Alert.alert('変更できませんでした', error instanceof Error ? error.message : '時間をおいてもう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (category: string) => {
    Alert.alert('カテゴリ候補から削除しますか？', '既存Tipsのカテゴリ名は変更されません。Add画面の候補から外れます。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除する',
        style: 'destructive',
        onPress: async () => {
          const next = await deleteUserCategory(category);
          setCategories(next);
        },
      },
    ]);
  };

  const confirmReset = () => {
    Alert.alert('初期カテゴリに戻しますか？', '自分で追加・変更した候補はリセットされます。既存Tipsは変更されません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '戻す',
        onPress: async () => {
          const next = await resetUserCategories();
          setCategories(next);
          setEditingCategory(null);
          setEditingValue('');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
        <Text style={styles.backText}>← 戻る</Text>
      </TouchableOpacity>

      <ScreenHeader
        title="カテゴリ管理"
        subtitle="Add画面や編集画面で表示するカテゴリ候補を整理できます。"
      />

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ここで管理するもの</Text>
        <Text style={styles.infoText}>
          カテゴリの候補リストだけを変更します。既に保存済みのTipsのカテゴリ名は勝手に書き換えません。
        </Text>
        <Text style={styles.infoUsage}>
          カスタムカテゴリ: {formatUsage(plan, 'customCategories', countCustomCategories(categories))}
        </Text>
      </View>

      <View style={styles.addCard}>
        <Text style={styles.cardTitle}>カテゴリを追加</Text>
        <View style={styles.addRow}>
          <TextInput
            value={newCategory}
            onChangeText={setNewCategory}
            placeholder="例：UI改善、営業、習慣化"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={addCategory}
          />
          <TouchableOpacity
            style={[styles.addButton, (!newCategory.trim() || saving) && styles.buttonDisabled]}
            onPress={addCategory}
            activeOpacity={0.82}
            disabled={!newCategory.trim() || saving}
          >
            <Text style={styles.addButtonText}>追加</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>表示するカテゴリ</Text>
        <Text style={styles.listCount}>{categories.length}件</Text>
      </View>

      <View style={styles.listCard}>
        {categories.map((category) => {
          const editing = editingCategory === category;
          return (
            <View key={category} style={styles.categoryRow}>
              {editing ? (
                <TextInput
                  value={editingValue}
                  onChangeText={setEditingValue}
                  placeholder="カテゴリ名"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.input, styles.editInput]}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveEditing}
                />
              ) : (
                <Text style={styles.categoryName}>{category}</Text>
              )}
              <View style={styles.rowActions}>
                {editing ? (
                  <>
                    <TouchableOpacity style={styles.miniButton} onPress={() => setEditingCategory(null)} activeOpacity={0.75}>
                      <Text style={styles.miniButtonText}>取消</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.miniButton, styles.saveMiniButton]} onPress={saveEditing} activeOpacity={0.75}>
                      <Text style={[styles.miniButtonText, styles.saveMiniText]}>保存</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.miniButton} onPress={() => startEditing(category)} activeOpacity={0.75}>
                      <Text style={styles.miniButtonText}>編集</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.miniButton, styles.deleteMiniButton]} onPress={() => confirmDelete(category)} activeOpacity={0.75}>
                      <Text style={[styles.miniButtonText, styles.deleteMiniText]}>削除</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={confirmReset} activeOpacity={0.75}>
        <Text style={styles.resetButtonText}>初期カテゴリに戻す</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 110 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { color: colors.accentDeep, fontSize: 13, fontWeight: '700' },
  infoCard: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(99,102,241,0.14)',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 5,
    padding: spacing.lg,
  },
  infoTitle: { color: colors.accentDeep, fontSize: 13, fontWeight: '800' },
  infoText: { color: colors.accentDeep, fontSize: 12, lineHeight: 18 },
  infoUsage: { color: colors.accentDeep, fontSize: 11.5, fontWeight: '900', marginTop: 3 },
  addCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.cardSoft,
  },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  addRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  addButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  buttonDisabled: { opacity: 0.45 },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  listTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  listCount: { color: colors.inkMuted, fontSize: 12, fontWeight: '700' },
  listCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.cardSoft,
  },
  categoryRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  categoryName: { color: colors.ink, flex: 1, fontSize: 14, fontWeight: '700' },
  editInput: { paddingVertical: 9 },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  miniButton: {
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  miniButtonText: { color: colors.inkSub, fontSize: 11, fontWeight: '800' },
  saveMiniButton: { backgroundColor: colors.greenSoft },
  saveMiniText: { color: colors.green },
  deleteMiniButton: { backgroundColor: colors.dangerSoft },
  deleteMiniText: { color: colors.danger },
  resetButton: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 13,
  },
  resetButtonText: { color: colors.inkSub, fontSize: 13, fontWeight: '800' },
});
