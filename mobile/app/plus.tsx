import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { PLUS_PRICE_JPY } from '@/constants/billing';
import { colors, radius, shadow, spacing } from '@/theme';

const plusFeatures = [
  { title: '保存Tips 無制限', desc: 'アイデアや参考URLを、数を気にせず蓄積できます。' },
  { title: 'MyTips 無制限', desc: '実行して役に立ったTipsを、知識資産として残せます。' },
  { title: 'カスタムカテゴリ 無制限', desc: '自分の仕事や生活に合わせて、カテゴリ候補を自由に作れます。' },
];

const futureFeatures = [
  'Collections',
  '再浮上リマインド',
];

export default function PlusScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
        <Text style={styles.backText}>← 戻る</Text>
      </TouchableOpacity>

      <LinearGradient
        colors={['#17143d', '#32156a', '#5b21b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.kicker}>MoreX Plus</Text>
        <Text style={styles.title}>知識の蓄積を、制限なく育てる</Text>
        <Text style={styles.subtitle}>
          Freeで使い始めて、日常的に使うならPlusへ。保存・MyTips・カテゴリを無制限にできます。
        </Text>
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>¥{PLUS_PRICE_JPY}/月</Text>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plusで解放されること</Text>
        {plusFeatures.map((feature) => (
          <View style={styles.featureCard} key={feature.title}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkText}>✓</Text>
            </View>
            <View style={styles.featureBody}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.futureCard}>
        <Text style={styles.futureTitle}>将来Plusに追加予定</Text>
        <View style={styles.futureRow}>
          {futureFeatures.map((feature) => (
            <Text key={feature} style={styles.futurePill}>{feature}</Text>
          ))}
        </View>
        <Text style={styles.futureNote}>
          AI連携の強い機能は、将来のProプラン側で検討します。
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => Alert.alert('MoreX Plus', '決済機能は準備中です。まずはPlusの内容を固めています。')}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>Plusは準備中</Text>
      </TouchableOpacity>
      <Text style={styles.note}>年額プランは、アプリが安定してから検討します。</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 110 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { color: colors.accentDeep, fontSize: 13, fontWeight: '800' },
  hero: {
    borderRadius: radius.xxl,
    gap: spacing.sm,
    overflow: 'hidden',
    padding: spacing.xl,
    ...shadow.card,
  },
  kicker: { color: '#ffcf7a', fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 25, fontWeight: '900', letterSpacing: -0.6, lineHeight: 32 },
  subtitle: { color: 'rgba(255,255,255,0.74)', fontSize: 13, lineHeight: 20 },
  pricePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  priceText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: spacing.xs },
  featureCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.cardSoft,
  },
  checkCircle: {
    alignItems: 'center',
    backgroundColor: colors.greenSoft,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  checkText: { color: colors.green, fontSize: 16, fontWeight: '900' },
  featureBody: { flex: 1, gap: 4 },
  featureTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  featureDesc: { color: colors.inkSub, fontSize: 12, lineHeight: 18 },
  futureCard: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(99,102,241,0.14)',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  futureTitle: { color: colors.accentDeep, fontSize: 13, fontWeight: '900' },
  futureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  futurePill: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    color: colors.accentDeep,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  futureNote: { color: colors.accentDeep, fontSize: 11.5, lineHeight: 17 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: 16,
    ...shadow.button,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  note: { color: colors.inkMuted, fontSize: 11.5, lineHeight: 17, textAlign: 'center' },
});
