import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { tokens } from '@/constants/tokens';

const ONBOARDING_KEY = 'morex.onboarding.completed.v0';

const steps = [
  {
    title: '保存で終わらせない。',
    body: '気になったTipsをスクショで集めましょう。',
    action: '次へ',
  },
  {
    title: 'Libraryで実行へ。',
    body: '集めたTipsはLibraryに並びます。\n試したものは「実行済み」にチェック。',
    action: '次へ',
  },
  {
    title: '自分だけの型に。',
    body: '実行済みTipsはMyTipsに蓄積され、\nあなただけの型になります。',
    action: 'はじめる',
  },
];

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((completed) => {
      if (!completed) setVisible(true);
    });
  }, []);

  const complete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setVisible(false);
    router.replace('/');
  };

  const next = () => {
    if (stepIndex >= steps.length - 1) {
      complete();
      return;
    }
    setStepIndex((current) => current + 1);
  };

  const step = steps[stepIndex];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={complete}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity activeOpacity={0.82} style={styles.skipButton} onPress={complete}>
            <Text style={styles.skipText}>スキップ</Text>
          </TouchableOpacity>
          <Text style={styles.stepText}>Step {stepIndex + 1} / {steps.length}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>
          <View style={styles.dots}>
            {steps.map((item, index) => (
              <View key={item.title} style={[styles.dot, index === stepIndex && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.82} style={styles.actionButton} onPress={next}>
            <Text style={styles.actionText}>{step.action}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.xl,
    gap: tokens.spacing.md,
    padding: tokens.spacing.lg,
    paddingTop: tokens.spacing.xl,
    width: '100%',
  },
  skipButton: {
    position: 'absolute',
    right: tokens.spacing.md,
    top: tokens.spacing.md,
  },
  skipText: {
    color: tokens.color.mutedText,
    fontSize: 13,
    fontWeight: '800',
  },
  stepText: {
    color: tokens.color.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    color: tokens.color.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0,
  },
  body: {
    color: tokens.color.mutedText,
    fontSize: 15,
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
  },
  dot: {
    backgroundColor: tokens.color.border,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: tokens.color.accent,
    width: 22,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: tokens.color.black,
    borderRadius: tokens.radius.md,
    justifyContent: 'center',
    minHeight: 48,
  },
  actionText: {
    color: tokens.color.surface,
    fontSize: 15,
    fontWeight: '800',
  },
});
