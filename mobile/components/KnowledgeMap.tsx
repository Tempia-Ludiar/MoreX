import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { colors, radius, shadow } from '@/theme';

const PALETTE = [
  '#ff9050', '#a78bfa', '#34d399', '#fb7185',
  '#60a5fa', '#f59e0b', '#c084fc', '#2dd4bf',
];

export type KnowledgeCategory = {
  name: string;
  count: number;
  color: string;
};

export function hashColor(str: string): string {
  let h = 0;
  for (const c of str) h = c.charCodeAt(0) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function getPositions(count: number): { x: number; y: number }[] {
  const cx = 170, cy = 154;
  if (count === 0) return [];

  if (count <= 8) {
    const r = 110;
    return Array.from({ length: count }, (_, i) => ({
      x: cx + r * Math.cos((2 * Math.PI * i / count) - Math.PI / 2),
      y: cy + r * Math.sin((2 * Math.PI * i / count) - Math.PI / 2),
    }));
  }

  const inner = Math.min(7, Math.ceil(count / 2));
  const outer = count - inner;
  return [
    ...Array.from({ length: inner }, (_, i) => ({
      x: cx + 68 * Math.cos((2 * Math.PI * i / inner) - Math.PI / 2),
      y: cy + 68 * Math.sin((2 * Math.PI * i / inner) - Math.PI / 2),
    })),
    ...Array.from({ length: outer }, (_, i) => ({
      x: cx + 120 * Math.cos((2 * Math.PI * i / outer) - Math.PI / 2),
      y: cy + 120 * Math.sin((2 * Math.PI * i / outer) - Math.PI / 2),
    })),
  ];
}

function nodeRadius(count: number): number {
  return Math.max(16, Math.round(18 + Math.log2(count + 1) * 3));
}

type Props = {
  categories: KnowledgeCategory[];
  totalCount: number;
  weekCount: number;
  showPlusButton?: boolean;
  onCategoryPress: (name: string) => void;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle as any);
const AnimatedLine = Animated.createAnimatedComponent(Line as any);

export function KnowledgeMap({ categories, totalCount, weekCount, showPlusButton, onCategoryPress }: Props) {
  const [rotDeg, setRotDeg] = useState(0);
  const startTime = useRef(Date.now());
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const dashAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setRotDeg(((Date.now() - startTime.current) / 40000 * 360) % 360);
    }, 50);

    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(dashAnim, { toValue: -14, duration: 2000, useNativeDriver: false }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ]),
    ).start();

    return () => clearInterval(timer);
  }, []);

  const positions = useMemo(() => getPositions(categories.length), [categories.length]);

  const pulseR = (r: number) =>
    pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [r, r + 12] });
  const pulseOp = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <View style={styles.bgGlow1} />
      <View style={styles.bgGlow2} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.indicator}>
          <Animated.View style={[styles.dot, { opacity: blinkAnim }]} />
          <Text style={styles.indText}>KNOWLEDGE MAP</Text>
        </View>
        {showPlusButton ? (
          <TouchableOpacity style={styles.plusBtn} activeOpacity={0.8}>
            <Text style={styles.plusBtnText}>✦ Unlock Advanced Map</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.zoomRow}>
            <TouchableOpacity style={styles.zoomBtn}>
              <Text style={styles.zoomText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomBtn}>
              <Text style={styles.zoomText}>−</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* SVG map */}
      <Svg
        width="100%"
        height={310}
        viewBox="0 0 340 308"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Soft center glow */}
        <Circle cx={170} cy={154} r={90} fill="rgba(99,102,241,0.12)" />
        <Circle cx={170} cy={154} r={55} fill="rgba(99,102,241,0.08)" />

        {/* Connection lines */}
        {positions.map((p, i) => (
          <AnimatedLine
            key={`l${i}`}
            x1={170} y1={154}
            x2={p.x} y2={p.y}
            stroke={categories[i]?.color ?? colors.accent}
            strokeOpacity={0.55}
            strokeWidth={1}
            strokeDasharray="3 4"
            strokeDashoffset={dashAnim}
          />
        ))}

        {/* Pulse rings per category */}
        {positions.map((p, i) => {
          const cat = categories[i];
          if (!cat) return null;
          const r = nodeRadius(cat.count);
          return (
            <AnimatedCircle
              key={`pr${i}`}
              cx={p.x} cy={p.y}
              r={pulseR(r)}
              stroke={cat.color}
              strokeWidth={1}
              fill="none"
              opacity={pulseOp}
            />
          );
        })}

        {/* YOU center glow */}
        <Circle cx={170} cy={154} r={46} fill="rgba(255,255,255,0.06)" />

        {/* Rotating dashed ring */}
        <G transform={`rotate(${rotDeg} 170 154)`}>
          <Circle
            cx={170} cy={154} r={34}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
            strokeDasharray="1 3"
            fill="none"
          />
        </G>

        {/* YOU node */}
        <Circle cx={170} cy={154} r={28} fill="#1a1a2e" stroke="white" strokeWidth={1.5} />
        <SvgText
          x={170} y={150}
          textAnchor="middle"
          fontSize={9}
          fontWeight="bold"
          fill="white"
          letterSpacing={1}
        >
          YOU
        </SvgText>
        <SvgText
          x={170} y={163}
          textAnchor="middle"
          fontSize={7}
          fill="rgba(255,255,255,0.5)"
        >
          {totalCount} tips
        </SvgText>

        {/* Category nodes */}
        {positions.map((p, i) => {
          const cat = categories[i];
          if (!cat) return null;
          const r = nodeRadius(cat.count);
          const label = cat.name.length > 7 ? cat.name.slice(0, 6) + '…' : cat.name;
          return (
            <G key={`n${i}`} onPress={() => onCategoryPress(cat.name)}>
              <Circle cx={p.x} cy={p.y} r={r} fill="#1a1a2e" stroke={cat.color} strokeWidth={2} />
              <SvgText
                x={p.x} y={p.y - 1}
                textAnchor="middle"
                fontSize={8}
                fontWeight="bold"
                fill={cat.color}
              >
                {label}
              </SvgText>
              <SvgText
                x={p.x} y={p.y + 10}
                textAnchor="middle"
                fontSize={7}
                fill="rgba(255,255,255,0.5)"
              >
                {cat.count}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.hint}>tap node to expand</Text>
        {weekCount > 0 ? (
          <Text style={styles.weekCount}>+ {weekCount} this week</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d0d18',
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.card,
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 8,
  },
  bgGlow1: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderRadius: 200,
    height: 280,
    left: '50%',
    marginLeft: -140,
    marginTop: -100,
    position: 'absolute',
    top: '40%',
    width: 280,
  },
  bgGlow2: {
    backgroundColor: 'rgba(255,120,150,0.08)',
    borderRadius: 160,
    height: 200,
    position: 'absolute',
    right: -60,
    top: -40,
    width: 200,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  indicator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    backgroundColor: colors.green,
    borderRadius: 3,
    height: 6,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    width: 6,
  },
  indText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  zoomRow: {
    flexDirection: 'row',
    gap: 4,
  },
  plusBtn: {
    backgroundColor: 'rgba(255,200,50,0.12)',
    borderColor: 'rgba(255,200,50,0.3)',
    borderRadius: 10,
    borderWidth: 0.5,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  plusBtnText: {
    color: '#ffd555',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  zoomBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  zoomText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  hint: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  weekCount: {
    color: 'rgba(167,139,250,0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
});
