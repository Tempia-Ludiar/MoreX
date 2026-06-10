import { ReactNode, useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Insets,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useReducedMotion } from '@/lib/motion';

type Props = {
  children: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  /** Animated.View（見た目のコンテナ）に適用するスタイル */
  style?: StyleProp<ViewStyle>;
  /** Pressable（レイアウト用の外側）に適用するスタイル。flex:1 などはこちらへ */
  containerStyle?: StyleProp<ViewStyle>;
  pressedScale?: number;
  hitSlop?: Insets | number;
  accessibilityLabel?: string;
};

/**
 * タップ時に軽く沈み込み、離すとスプリングで戻る汎用ラッパー。
 * TouchableOpacityの置き換え用。transformのみなのでネイティブドライバで動く。
 */
export function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled,
  style,
  containerStyle,
  pressedScale = 0.97,
  hitSlop,
  accessibilityLabel,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();

  const handlePressIn = () => {
    if (reduced) return;
    Animated.spring(scale, {
      toValue: pressedScale,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (reduced) return;
    Animated.spring(scale, {
      toValue: 1,
      speed: 24,
      bounciness: 7,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
