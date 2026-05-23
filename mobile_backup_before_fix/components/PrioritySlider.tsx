import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@/constants/tokens';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

const clampPriority = (value: number) => Math.min(100, Math.max(1, Math.round(value)));

export function PrioritySlider({ value, onChange }: Props) {
  const [width, setWidth] = useState(1);

  const updateFromX = (x: number) => {
    const ratio = Math.min(1, Math.max(0, x / width));
    onChange(clampPriority(1 + ratio * 99));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => updateFromX(event.nativeEvent.locationX),
      onPanResponderMove: (event) => updateFromX(event.nativeEvent.locationX),
    }),
  ).current;

  const fillWidth = ((clampPriority(value) - 1) / 99) * width;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.label}>優先度</Text>
        <Text style={styles.value}>{clampPriority(value)}</Text>
      </View>
      <View
        style={styles.track}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={[styles.fill, { width: fillWidth }]} />
        <View style={[styles.thumb, { left: fillWidth }]} />
      </View>
      <View style={styles.scale}>
        <Text style={styles.scaleText}>1</Text>
        <Text style={styles.scaleText}>100</Text>
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
  value: {
    color: tokens.color.text,
    fontSize: 22,
    fontWeight: '900',
  },
  track: {
    backgroundColor: tokens.color.surfaceSoft,
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: tokens.color.black,
    height: '100%',
  },
  thumb: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.black,
    borderRadius: 999,
    borderWidth: 3,
    height: 26,
    marginLeft: -13,
    position: 'absolute',
    width: 26,
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
});
