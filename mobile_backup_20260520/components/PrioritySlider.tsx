import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, TextInput, View } from 'react-native';
import { clampPriority, getPriorityMeta, priorityGradientStops } from '@/constants/priority';
import { tokens } from '@/constants/tokens';

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

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setInputValue(`${clampPriority(value)}`);
  }, [value]);

  const updateFromLocalX = (x: number) => {
    const trackWidth = Math.max(1, widthRef.current);
    const ratio = Math.min(1, Math.max(0, x / trackWidth));
    onChangeRef.current(clampPriority(1 + ratio * 99));
  };

  const updateFromPageX = (pageX: number) => {
    updateFromLocalX(pageX - trackX.current);
  };

  const measureTrack = () => {
    trackRef.current?.measureInWindow((x, _y, measuredWidth) => {
      trackX.current = x;
      if (measuredWidth > 0) {
        widthRef.current = measuredWidth;
        setWidth(measuredWidth);
      }
    });
  };

  const updateFromInput = (text: string) => {
    const next = text.replace(/[^\d]/g, '').slice(0, 3);
    setInputValue(next);
    if (!next) return;
    onChange(clampPriority(Number(next)));
  };

  const commitInput = () => {
    if (!inputValue) {
      setInputValue(`${clampPriority(value)}`);
      return;
    }
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
      onPanResponderMove: (_event, gestureState) => updateFromPageX(gestureState.moveX),
    }),
  ).current;

  const priority = clampPriority(value);
  const priorityMeta = getPriorityMeta(priority);
  const fillWidth = ((priority - 1) / 99) * width;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>優先度</Text>
          <Text style={styles.helper}>低いほどあとで、高いほど先に実行</Text>
        </View>
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
      <View
        ref={trackRef}
        style={[styles.track, { borderColor: priorityMeta.border }]}
        onLayout={(event) => {
          widthRef.current = event.nativeEvent.layout.width;
          setWidth(event.nativeEvent.layout.width);
          requestAnimationFrame(measureTrack);
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.gradientTrack}>
          {priorityGradientStops.map((color, index) => (
            <View key={`${color}-${index}`} style={[styles.gradientStop, { backgroundColor: color }]} />
          ))}
        </View>
        <View style={[styles.inactiveMask, { left: fillWidth }]} />
        <View style={[styles.thumb, { borderColor: priorityMeta.color, left: fillWidth }]}>
          <View style={[styles.thumbDot, { backgroundColor: priorityMeta.color }]} />
        </View>
      </View>
      <View style={styles.prioritySummary}>
        <Text style={[styles.prioritySummaryText, { color: priorityMeta.color }]}>{priorityMeta.label}</Text>
      </View>
      <View style={styles.scale}>
        <View>
          <Text style={styles.scaleText}>1</Text>
          <Text style={styles.scaleLabel}>低</Text>
        </View>
        <View style={styles.scaleRight}>
          <Text style={styles.scaleText}>100</Text>
          <Text style={styles.scaleLabel}>高</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: tokens.color.text,
    fontSize: 13,
    fontWeight: '800',
  },
  helper: {
    color: tokens.color.mutedText,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 2,
  },
  valueInput: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    color: tokens.color.text,
    fontSize: 22,
    fontWeight: '900',
    minWidth: 64,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    textAlign: 'center',
  },
  track: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    overflow: 'visible',
  },
  gradientTrack: {
    borderRadius: 999,
    flexDirection: 'row',
    height: 28,
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  gradientStop: {
    flex: 1,
  },
  inactiveMask: {
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    bottom: 3,
    position: 'absolute',
    right: 3,
    top: 3,
  },
  thumb: {
    backgroundColor: tokens.color.surface,
    borderRadius: 999,
    borderWidth: 3,
    height: 30,
    justifyContent: 'center',
    marginLeft: -15,
    position: 'absolute',
    alignItems: 'center',
    width: 30,
  },
  thumbDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  prioritySummary: {
    alignItems: 'flex-end',
    marginTop: -2,
  },
  prioritySummaryText: {
    fontSize: 12,
    fontWeight: '900',
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleText: {
    color: tokens.color.mutedText,
    fontSize: 11,
    fontWeight: '800',
  },
  scaleLabel: {
    color: tokens.color.mutedText,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 17,
  },
  scaleRight: {
    alignItems: 'flex-end',
  },
});
