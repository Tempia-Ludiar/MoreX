import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { clampPriority, getPriorityMeta } from '@/constants/priority';
import { colors, radius, shadow, spacing } from '@/theme';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function PrioritySlider({ value, onChange }: Props) {
  const trackRef = useRef<View>(null);
  const trackX = useRef(0);
  const widthRef = useRef(1);
  const onChangeRef = useRef(onChange);
  const [width, setWidth] = useState(1);
  const [inputValue, setInputValue] = useState(`${clampPriority(value)}`);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { setInputValue(`${clampPriority(value)}`); }, [value]);

  const updateFromLocalX = (x: number) => {
    const ratio = Math.min(1, Math.max(0, x / Math.max(1, widthRef.current)));
    onChangeRef.current(clampPriority(1 + ratio * 99));
  };

  const updateFromPageX = (pageX: number) => updateFromLocalX(pageX - trackX.current);

  const measureTrack = () => {
    trackRef.current?.measureInWindow((x, _y, w) => {
      trackX.current = x;
      if (w > 0) { widthRef.current = w; setWidth(w); }
    });
  };

  const updateFromInput = (text: string) => {
    const next = text.replace(/[^\d]/g, '').slice(0, 3);
    setInputValue(next);
    if (!next) return;
    onChange(clampPriority(Number(next)));
  };

  const commitInput = () => {
    if (!inputValue) { setInputValue(`${clampPriority(value)}`); return; }
    const next = clampPriority(Number(inputValue));
    setInputValue(`${next}`);
    onChange(next);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (event) => {
        measureTrack();
        const pageX = event.nativeEvent.pageX;
        if (typeof pageX === 'number' && trackX.current) {
          updateFromPageX(pageX);
          return;
        }
        updateFromLocalX(event.nativeEvent.locationX);
      },
      onPanResponderMove: (_e, gs) => updateFromPageX(gs.moveX),
    }),
  ).current;

  const priority = clampPriority(value);
  const meta = getPriorityMeta(priority);
  const thumbLeft = ((priority - 1) / 99) * width;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>優先度</Text>
          <Text style={styles.helper}>低いほどあとで、高いほど先に実行</Text>
        </View>
        <View style={styles.valueBox}>
          <TextInput
            keyboardType="number-pad"
            maxLength={3}
            onBlur={commitInput}
            onChangeText={updateFromInput}
            selectTextOnFocus
            style={styles.valueInput}
            value={inputValue}
          />
        </View>
      </View>

      <View
        ref={trackRef}
        style={styles.trackArea}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
          requestAnimationFrame(measureTrack);
        }}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={['#a8b5e8', '#f0c95f', '#e8704a', '#e84a6f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientTrack}
        />
        <View
          style={[
            styles.thumb,
            {
              left: thumbLeft - 11,
              borderColor: meta.color,
              shadowColor: meta.color,
            },
          ]}
        />
      </View>

      <View style={styles.scale}>
        <Text style={styles.scaleText}>低 · 1</Text>
        {meta.label ? (
          <Text style={[styles.priorityLabel, { color: meta.color }]}>{meta.label}</Text>
        ) : null}
        <Text style={styles.scaleText}>100 · 高</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  helper: {
    color: colors.inkMuted,
    fontSize: 11,
    marginTop: 2,
  },
  valueBox: {
    backgroundColor: '#f0f0f5',
    borderRadius: radius.sm,
    minWidth: 52,
  },
  valueInput: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    textAlign: 'center',
  },
  trackArea: {
    height: 36,
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  gradientTrack: {
    borderRadius: 100,
    height: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 14,
  },
  thumb: {
    backgroundColor: '#ffffff',
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    position: 'absolute',
    top: 7,
    width: 22,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scaleText: {
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
