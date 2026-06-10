import { ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from '@/lib/motion';

type Props = {
  children: ReactNode;
  /** 出現開始までの遅延（ms）。リストの段差表示に使う */
  delay?: number;
  duration?: number;
  /** 下からスライドする距離（px） */
  distance?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * マウント時に opacity + translateY でふわっと出現する汎用ラッパー。
 * 一度だけ再生され、再レンダリングでは再生されない。
 */
export function FadeSlideIn({ children, delay = 0, duration = 360, distance = 14, style }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
