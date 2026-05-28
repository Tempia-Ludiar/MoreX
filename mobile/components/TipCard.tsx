import { useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View, Vibration } from 'react-native';
import { router } from 'expo-router';
import { clampPriority, getPriorityMeta } from '@/constants/priority';
import { colors, radius, shadow, spacing } from '@/theme';
import { Tip } from '@/types/tip';

type Props = {
  tip: Tip;
  showCheckbox?: boolean;
  onStatusToggle?: (tip: Tip) => Promise<void> | void;
};

function StatusBadge({ status }: { status: Tip['status'] }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    todo:  { bg: '#eef0ff', text: '#4f46e5', label: '未実行' },
    doing: { bg: '#eef0ff', text: '#4f46e5', label: '未実行' },
    done:  { bg: '#e6f9f0', text: '#0a8c5a', label: '実行済み' },
    trash: { bg: '#f5f5f7', text: '#6b6b80', label: '不要' },
  };
  const s = map[status] ?? map.todo;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

function Checkbox({ status, onPress }: { status: Tip['status']; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 70, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
    ]).start();
    Vibration.vibrate(8);
    onPress();
  };

  const isDone = status === 'done';
  const isTrash = status === 'trash';

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.cbTouch}>
      <Animated.View
        style={[
          styles.cbCircle,
          isDone && styles.cbDone,
          isTrash && styles.cbTrash,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {isDone && <Text style={styles.cbCheck}>✓</Text>}
        {isTrash && <Text style={styles.cbX}>✕</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
}

export function TipCard({ tip, showCheckbox, onStatusToggle }: Props) {
  const priority = clampPriority(tip.priority);
  const meta = getPriorityMeta(priority);
  const preview = tip.memo || tip.content || 'スクリーンショットで保存';

  const borderColor =
    priority >= 90 ? colors.pink :
    priority >= 75 ? colors.orange :
    priority >= 50 ? '#f0c95f' : colors.border;

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      style={[styles.card, { borderLeftColor: borderColor }]}
      onPress={() => router.push(`/tips/${tip.id}`)}
    >
      {showCheckbox && onStatusToggle ? (
        <Checkbox status={tip.status} onPress={() => {
          const next = tip.status === 'done' ? 'todo' : 'done';
          onStatusToggle({ ...tip, status: next });
        }} />
      ) : null}

      {tip.imageUri ? (
        <Image source={{ uri: tip.imageUri }} style={styles.thumbnail} />
      ) : null}

      {/* Only category + status — no date/priority number noise */}
      <View style={[styles.badgeRow, showCheckbox && styles.badgeRowWithCb]}>
        {tip.category ? (
          <View style={styles.catBadge}>
            <Text style={styles.catText}>{tip.category}</Text>
          </View>
        ) : null}
        <StatusBadge status={tip.status} />
      </View>

      <Text style={styles.title} numberOfLines={2}>{tip.title || '無題のTips'}</Text>
      <Text style={styles.preview} numberOfLines={2}>{preview}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    padding: 16,
    paddingLeft: 18,
    gap: spacing.sm,
    ...shadow.card,
  },
  thumbnail: {
    backgroundColor: colors.border,
    borderRadius: radius.md,
    height: 118,
    marginBottom: 2,
    width: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  badgeRowWithCb: { paddingRight: 40 },
  catBadge: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  catText: { color: '#ffffff', fontSize: 10, fontWeight: '600' },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  preview: {
    color: colors.inkSub,
    fontSize: 12,
    lineHeight: 18,
  },
  cbTouch: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
    padding: 4,
  },
  cbCircle: {
    alignItems: 'center',
    borderColor: 'rgba(20,20,40,0.15)',
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
    backgroundColor: '#ffffff',
  },
  cbDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  cbTrash: { backgroundColor: '#e0e0e0', borderColor: '#c0c0c0' },
  cbCheck: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  cbX: { color: '#6b6b80', fontSize: 13, fontWeight: '700' },
});
