import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, shadow, spacing } from '@/theme';

type PolicySection =
  | { title: string; body: string[]; text?: never }
  | { title: string; text: string; body?: never };

const sections: PolicySection[] = [
  {
    title: '1. 取得する情報',
    body: [
      'ログインに使用するメールアドレス',
      'ユーザーが保存したTipsのタイトル、本文メモ、カテゴリ、優先度、参照URL、画像',
      'Tipsの作成日時、更新日時、実行状態、MyTips保存状態',
      'Plusリリース通知、機能案内、重要なお知らせ等のために登録されたメールアドレス',
      'お問い合わせ時にユーザーが提供した情報',
    ],
  },
  {
    title: '2. 利用目的',
    body: [
      'ユーザー本人のTipsを保存、表示、編集、削除するため',
      'ログイン状態を維持し、ユーザーごとに保存データを分離するため',
      '本サービスの提供、改善、不具合調査、セキュリティ保護のため',
      'Plus機能、アップデート、重要なお知らせ等を案内するため',
      'お問い合わせへの対応のため',
    ],
  },
  {
    title: '3. 外部サービスの利用',
    body: [
      'Supabase: 認証、データベース、画像ストレージ',
      'Vercel: Webアプリのホスティング、リンクプレビューAPIの実行',
      '将来的にアクセス解析、広告配信、決済等の外部サービスを追加する場合があります。その場合は、必要に応じて本ポリシーを更新します。',
    ],
  },
  {
    title: '4. リンクプレビューについて',
    text: 'ユーザーがURLを入力した場合、本サービスはリンク先のタイトル、説明、画像などのプレビュー情報を取得するため、リンク先ページへアクセスすることがあります。',
  },
  {
    title: '5. データの保存と削除',
    text: '保存したTipsは、ログイン中のユーザー本人に紐づいて保存されます。ユーザーは、アプリ内の設定画面から保存データを削除できます。また、削除に関する問い合わせは、問い合わせ先でも受け付けます。削除されたデータは復元できない場合があります。',
  },
  {
    title: '6. 第三者提供',
    text: '運営者は、法令に基づく場合を除き、ユーザーの保存データを第三者に販売または提供しません。',
  },
  {
    title: '7. 未成年の利用',
    text: '未成年の方も本サービスを利用できます。ただし、必要に応じて保護者の同意を得たうえで利用してください。',
  },
  {
    title: '8. プライバシーポリシーの変更',
    text: '運営者は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、本サービス上または登録されたメールアドレス宛に通知します。',
  },
];

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
        <Text style={styles.backText}>← 戻る</Text>
      </TouchableOpacity>

      <View style={styles.hero}>
        <Text style={styles.kicker}>MoreX</Text>
        <Text style={styles.title}>プライバシーポリシー</Text>
        <Text style={styles.date}>制定日: 2026年6月9日</Text>
        <Text style={styles.lead}>
          MoreX運営は、MoreXにおけるユーザー情報の取り扱いについて、以下のとおり定めます。
        </Text>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.card}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.body ? (
            <View style={styles.list}>
              {section.body.map((item) => (
                <View key={item} style={styles.listRow}>
                  <Text style={styles.bullet}>・</Text>
                  <Text style={styles.body}>{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.body}>{section.text}</Text>
          )}
        </View>
      ))}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>9. 問い合わせ先</Text>
        <Text style={styles.body}>本ポリシーに関する問い合わせは、以下のメールアドレスまでお願いします。</Text>
        <Text style={styles.email}>porto26harbor@gmail.com</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 120 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { color: colors.accentDeep, fontSize: 13, fontWeight: '800' },
  hero: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xxl,
    gap: spacing.sm,
    padding: spacing.xl,
    ...shadow.card,
  },
  kicker: { color: colors.accentDeep, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 26, fontWeight: '900', letterSpacing: -0.5, lineHeight: 33 },
  date: { color: colors.inkMuted, fontSize: 12, fontWeight: '700' },
  lead: { color: colors.inkSub, fontSize: 13, lineHeight: 20 },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.lg,
    ...shadow.cardSoft,
  },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '900', lineHeight: 21 },
  list: { gap: 5 },
  listRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 2 },
  bullet: { color: colors.accentDeep, fontSize: 13, lineHeight: 21 },
  body: { color: colors.inkSub, flex: 1, fontSize: 12.5, lineHeight: 21 },
  email: { color: colors.accentDeep, fontSize: 13, fontWeight: '800' },
});
