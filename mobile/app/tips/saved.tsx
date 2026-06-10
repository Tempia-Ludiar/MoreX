import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { PressableScale } from '@/components/PressableScale';
import { useReducedMotion } from '@/lib/motion';
import { colors, radius, shadow, spacing } from '@/theme';

const NEXT_STEPS = [
  { icon: '1', label: 'Todoで優先度を確認' },
  { icon: '2', label: '実行して完了にする' },
  { icon: '★', label: 'よかったTipsはMyTipsへ' },
];

export default function TipSavedScreen() {
  const iconScale = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      iconScale.setValue(1);
      return;
    }
    Animated.spring(iconScale, {
      toValue: 1,
      friction: 5,
      tension: 140,
      delay: 80,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.iconCircle, { transform: [{ scale: iconScale }] }]}>
        <Text style={styles.icon}>✓</Text>
      </Animated.View>

      <FadeSlideIn delay={120}>
        <Text style={styles.title}>保存しました！</Text>
      </FadeSlideIn>
      <FadeSlideIn delay={200}>
        <Text style={styles.body}>
          次は実行です。いつやるかをイメージしておくと、{'\n'}「保存しただけ」で終わらなくなります。
        </Text>
      </FadeSlideIn>

      <FadeSlideIn delay={300} style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>Tipsを知識資産に変える流れ</Text>
        {NEXT_STEPS.map((step) => (
          <View key={step.label} style={styles.stepRow}>
            <View style={[styles.stepBadge, step.icon === '★' && styles.stepBadgeStar]}>
              <Text style={[styles.stepBadgeText, step.icon === '★' && styles.stepBadgeTextStar]}>
                {step.icon}
              </Text>
            </View>
            <Text style={styles.stepLabel}>{step.label}</Text>
          </View>
        ))}
      </FadeSlideIn>

      <FadeSlideIn delay={400} style={styles.buttons}>
        <PressableScale style={styles.primaryButton} onPress={() => router.replace('/(tabs)/board')}>
          <Text style={styles.primaryButtonText}>Todoで優先度を確認する</Text>
        </PressableScale>
        <PressableScale style={styles.secondaryButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.secondaryButtonText}>続けてTipsを追加する</Text>
        </PressableScale>
      </FadeSlideIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', backgroundColor: colors.bg, flex: 1, justifyContent: 'center', padding: spacing.xl },
  iconCircle: { alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: 36, height: 72, justifyContent: 'center', marginBottom: spacing.lg, width: 72 },
  icon: { color: colors.green, fontSize: 34, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', marginBottom: spacing.sm, textAlign: 'center' },
  body: { color: colors.inkSub, fontSize: 14, lineHeight: 22, marginBottom: spacing.lg, maxWidth: 340, textAlign: 'center' },
  stepsCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    width: '100%',
    ...shadow.cardSoft,
  },
  stepsTitle: { color: colors.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  stepRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  stepBadgeStar: { backgroundColor: '#fff8e1' },
  stepBadgeText: { color: colors.accentDeep, fontSize: 11, fontWeight: '800' },
  stepBadgeTextStar: { color: '#c08020' },
  stepLabel: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  buttons: { width: '100%' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.lg, paddingVertical: 16, width: '100%', ...shadow.button },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.bgElevated, borderColor: colors.ink, borderRadius: radius.lg, borderWidth: 1.5, marginTop: spacing.md, paddingVertical: 15, width: '100%' },
  secondaryButtonText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
});
