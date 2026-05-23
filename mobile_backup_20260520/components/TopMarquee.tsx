import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@/constants/tokens';

type Props = {
  messages: string[];
};

export function TopMarquee({ messages }: Props) {
  const [copyWidth, setCopyWidth] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const text = useMemo(() => messages.filter(Boolean).join('   •   '), [messages]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    translateX.stopAnimation();
    translateX.setValue(0);
    if (!copyWidth || paused || reduceMotion) return;
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -copyWidth,
        duration: 18000,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [copyWidth, paused, reduceMotion, text, translateX]);

  return (
    <Pressable
      onHoverIn={() => setPaused(true)}
      onHoverOut={() => setPaused(false)}
      onPressIn={() => setPaused(true)}
      onPressOut={() => setPaused(false)}
      style={styles.wrapper}
    >
      {reduceMotion ? (
        <Text style={styles.text} numberOfLines={1}>{text}</Text>
      ) : (
        <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
          <Text onLayout={(event) => setCopyWidth(event.nativeEvent.layout.width)} style={styles.text} numberOfLines={1}>{text}</Text>
          <Text style={styles.text} numberOfLines={1}>{text}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: tokens.color.black,
    borderRadius: tokens.radius.sm,
    height: 28,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  track: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: '200%',
  },
  text: {
    color: tokens.color.surface,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    paddingHorizontal: tokens.spacing.lg,
  },
});
