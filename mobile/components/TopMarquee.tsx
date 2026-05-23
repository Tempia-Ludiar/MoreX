import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  messages: string[];
};

export function TopMarquee({ messages }: Props) {
  const [copyWidth, setCopyWidth] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const text = useMemo(() => messages.filter(Boolean).join('   ·   '), [messages]);

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
      onPressIn={() => setPaused(true)}
      onPressOut={() => setPaused(false)}
      style={styles.wrapper}
    >
      {reduceMotion ? (
        <Text style={styles.text} numberOfLines={1}>{text}</Text>
      ) : (
        <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
          <Text
            onLayout={(e) => setCopyWidth(e.nativeEvent.layout.width)}
            style={styles.text}
            numberOfLines={1}
          >
            {text}
          </Text>
          <Text style={styles.text} numberOfLines={1}>{text}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1a1a2e',
    borderRadius: 100,
    height: 32,
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  track: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: '200%',
  },
  text: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
  },
});
