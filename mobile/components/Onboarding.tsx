import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@/theme';

export const ONBOARDING_KEY = 'morex.onboarding.completed.v0';

const SLIDES = [
  {
    gradient: ['#0e0e28', '#1e1058', '#0a1830'] as [string, string, string],
    icon: '📌',
    eyebrow: 'STEP 1  ·  ADD',
    title: '気になったら、\nすぐ保存',
    body: 'X・YouTube・note などの URL、\nテキストメモをそのまま保存。\nスクリーンショットも添付できます。',
    accent: '#a5b4fc',
  },
  {
    gradient: ['#0e1820', '#0e2a3c', '#162040'] as [string, string, string],
    icon: '🎯',
    eyebrow: 'STEP 2  ·  TODO',
    title: '選んで実行、\n完了に変える',
    body: '保存した Tips は Todo に並びます。\n実行したら「完了」にチェック。\n不要なものはその場で削除できます。',
    accent: '#7dd3fc',
  },
  {
    gradient: ['#1a0a3e', '#2d1070', '#180a30'] as [string, string, string],
    icon: '⭐',
    eyebrow: 'STEP 3  ·  MYTIPS',
    title: '自分だけの型を\nつくる',
    body: '完了した Tips の中から\n本当に役立ったものだけを MyTips に残す。\n知識資産として蓄積されていきます。',
    accent: '#c084fc',
  },
] as const;

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => {
      if (!v) setVisible(true);
    });
  }, []);

  const complete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setVisible(false);
    router.replace('/');
  };

  const goNext = () => {
    if (index >= SLIDES.length - 1) { complete(); return; }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(translateAnim, { toValue: -16, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setIndex((i) => i + 1);
      translateAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={complete}
      statusBarTranslucent
    >
      <LinearGradient
        colors={slide.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screen}
      >
        {/* Background decoration bubbles */}
        <View style={[styles.bubble, styles.bubble1]} />
        <View style={[styles.bubble, styles.bubble2]} />
        <View style={[styles.bubble, styles.bubble3]} />

        {/* Nav */}
        <View style={styles.nav}>
          <View />
          {!isLast ? (
            <TouchableOpacity onPress={complete} style={styles.skipBtn} activeOpacity={0.75}>
              <Text style={styles.skipText}>スキップ</Text>
            </TouchableOpacity>
          ) : <View />}
        </View>

        {/* Animated content */}
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: translateAnim }] },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconWrap}>
            <View style={[styles.iconRing, { borderColor: slide.accent + '44' }]}>
              <Text style={styles.iconEmoji}>{slide.icon}</Text>
            </View>
          </View>

          {/* Eyebrow */}
          <Text style={[styles.eyebrow, { color: slide.accent }]}>{slide.eyebrow}</Text>

          {/* Title */}
          <Text style={styles.title}>{slide.title}</Text>

          {/* Body */}
          <Text style={styles.body}>{slide.body}</Text>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <View
                key={s.eyebrow}
                style={[
                  styles.dot,
                  i === index
                    ? [styles.dotActive, { backgroundColor: slide.accent }]
                    : { backgroundColor: 'rgba(255,255,255,0.22)' },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={goNext} activeOpacity={0.85} style={styles.actionBtn}>
            {isLast ? (
              <LinearGradient
                colors={['#4f46e5', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionBtnInner}
              >
                <Text style={styles.actionText}>はじめる →</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.actionBtnInner, styles.actionBtnGhost]}>
                <Text style={[styles.actionText, styles.actionTextGhost]}>次へ</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },

  // Decorative background bubbles
  bubble: {
    borderRadius: 999,
    position: 'absolute',
  },
  bubble1: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    height: 300,
    right: -90,
    top: -80,
    width: 300,
  },
  bubble2: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: 60,
    height: 220,
    left: -70,
    width: 220,
  },
  bubble3: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    height: 140,
    right: 30,
    bottom: 160,
    width: 140,
  },

  // Nav
  nav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xl,
  },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  skipText: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Animated content area
  content: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  iconWrap: {
    marginBottom: spacing.sm,
  },
  iconRing: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 28,
    borderWidth: 1.5,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  iconEmoji: {
    fontSize: 44,
    lineHeight: 52,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  body: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 15,
    lineHeight: 24,
  },

  // Footer
  footer: {
    gap: spacing.md,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  dot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  dotActive: {
    height: 7,
    width: 26,
  },
  actionBtn: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  actionBtnInner: {
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: 17,
  },
  actionBtnGhost: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionTextGhost: {
    color: 'rgba(255,255,255,0.90)',
  },
});
