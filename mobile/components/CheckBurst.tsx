import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import { useReducedMotion } from '@/lib/motion';

export type CheckBurstHandle = {
  /** チェック演出（ポップ＋リング拡散＋ドット）を再生する */
  burst: () => void;
};

type Props = {
  done: boolean;
  /** チェック円の直径（px） */
  size?: number;
  /** マウント時に一度演出を再生する（完了ボトムシートなど用） */
  burstOnMount?: boolean;
};

const DOT_COUNT = 6;
const DOT_ANGLES = Array.from({ length: DOT_COUNT }, (_, i) => (Math.PI * 2 * i) / DOT_COUNT - Math.PI / 2);

/**
 * done操作時の達成感演出つきチェックサークル。
 * 見た目はTodoカードの既存チェックボタンを踏襲し、burst()で
 * 円のポップ・リングの拡散・小さなドットの飛び散りを再生する。
 */
export const CheckBurst = forwardRef<CheckBurstHandle, Props>(function CheckBurst(
  { done, size = 26, burstOnMount = false },
  ref,
) {
  const circleScale = useRef(new Animated.Value(1)).current;
  const ringProgress = useRef(new Animated.Value(0)).current;
  const dotsProgress = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const burst = () => {
    if (reducedRef.current) return;
    ringProgress.setValue(0);
    dotsProgress.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(circleScale, { toValue: 0.8, duration: 70, useNativeDriver: true }),
        Animated.spring(circleScale, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }),
      ]),
      Animated.timing(ringProgress, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(dotsProgress, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  };

  useImperativeHandle(ref, () => ({ burst }));

  useEffect(() => {
    if (burstOnMount) {
      const timer = setTimeout(burst, 120);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringScale = ringProgress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.0] });
  const ringOpacity = ringProgress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] });
  const dotOpacity = dotsProgress.interpolate({ inputRange: [0, 0.12, 0.8, 1], outputRange: [0, 1, 0.6, 0] });
  const dotDistance = size * 1.15;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      {DOT_ANGLES.map((angle, i) => {
        const translateX = dotsProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angle) * dotDistance],
        });
        const translateY = dotsProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angle) * dotDistance],
        });
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[styles.dot, { opacity: dotOpacity, transform: [{ translateX }, { translateY }] }]}
          />
        );
      })}
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: circleScale }],
          },
          done && styles.circleDone,
        ]}
      >
        {done && <Text style={[styles.check, { fontSize: size * 0.42 }]}>✓</Text>}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  circle: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(20,20,40,0.2)',
    borderWidth: 2,
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
    elevation: 3,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  check: { color: '#ffffff', fontWeight: '700' },
  ring: {
    borderColor: colors.green,
    borderWidth: 2,
    position: 'absolute',
  },
  dot: {
    backgroundColor: colors.green,
    borderRadius: 2.5,
    height: 5,
    position: 'absolute',
    width: 5,
  },
});
