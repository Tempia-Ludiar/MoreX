import { useEffect, useRef } from 'react';
import { Animated, StyleProp, TextStyle } from 'react-native';
import { useReducedMotion } from '@/lib/motion';

type Props = {
  /** trueで塗り★、falseで枠☆を表示。false→trueの変化時にポップする */
  active: boolean;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  /** マウント直後に一度ポップさせたいとき（保存直後に出現するバッジなど） */
  popOnMount?: boolean;
  style?: StyleProp<TextStyle>;
};

/**
 * MyTips追加時に★が弾むマイクロインタラクション。
 * activeがfalse→trueに変わった瞬間、または popOnMount 指定時に
 * スケールが弾むアニメーションを再生する。
 */
export function StarPop({
  active,
  size = 17,
  activeColor = '#ffcc00',
  inactiveColor = '#9090a0',
  popOnMount = false,
  style,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevActive = useRef(active);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const pop = () => {
    if (reducedRef.current) return;
    scale.setValue(0.4);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.45, duration: 140, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (popOnMount) {
      const timer = setTimeout(pop, 60);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (active && !prevActive.current) pop();
    prevActive.current = active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <Animated.Text
      style={[
        { color: active ? activeColor : inactiveColor, fontSize: size, transform: [{ scale }] },
        style,
      ]}
    >
      {active ? '★' : '☆'}
    </Animated.Text>
  );
}
