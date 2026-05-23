import { useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { router } from 'expo-router';
import { CategoryChip } from '@/components/CategoryChip';
import { StatusChip } from '@/components/StatusChip';
import { TimingChip } from '@/components/TimingChip';
import { clampPriority, getPriorityMeta } from '@/constants/priority';
import { tokens } from '@/constants/tokens';
import { Tip } from '@/types/tip';

type Props = {
  tip: Tip;
  compact?: boolean;
  onMarkDone?: (tip: Tip) => Promise<void> | void;
  showDoneAction?: boolean;
  showNewBadge?: boolean;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

export function TipCard({ tip, compact, onMarkDone, showDoneAction, showNewBadge }: Props) {
  const checkScale = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [markingDone, setMarkingDone] = useState(false);
  const preview = tip.memo || tip.content || 'スクリーンショットだけで保存されています';
  const canMarkDone = showDoneAction && tip.status !== 'done' && !markingDone;
  const priorityMeta = getPriorityMeta(tip.priority);
  const priority = clampPriority(tip.priority);

  const markDone = () => {
    if (!canMarkDone) return;
    setMarkingDone(true);
    Vibration.vibrate(10);
    Animated.parallel([
      Animated.sequence([
        Animated.spring(checkScale, { toValue: 1.2, friction: 5, tension: 140, useNativeDriver: true }),
        Animated.spring(checkScale, { toValue: 1, friction: 6, tension: 130, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(flashOpacity, { toValue: 0.3, duration: 60, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(120),
        Animated.timing(translateY, { toValue: -14, duration: 220, useNativeDriver: true }),
      ]),
    ]).start(async () => {
      await onMarkDone?.(tip);
      setMarkingDone(false);
      checkScale.setValue(0);
      translateY.setValue(0);
    });
  };

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <TouchableOpacity
        activeOpacity={0.84}
        style={[
          styles.card,
          {
            backgroundColor: priorityMeta.cardBackground,
            borderColor: priorityMeta.cardBorder,
            shadowOpacity: priorityMeta.shadowOpacity,
            elevation: priorityMeta.elevation,
          },
          compact && styles.compact,
        ]}
        onPress={() => router.push(`/tips/${tip.id}`)}
      >
        <View style={[styles.priorityLine, { backgroundColor: priorityMeta.color, width: priorityMeta.lineWidth }]} />
        {priorityMeta.topBand ? <View style={[styles.priorityTopBand, { backgroundColor: priorityMeta.color }]} /> : null}
        <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flashOpacity }]} />
        {showNewBadge ? <Text style={styles.newBadge}>NEW</Text> : null}
        {tip.imageUri ? <Image source={{ uri: tip.imageUri }} style={styles.image} /> : null}
        <View style={styles.metaRow}>
          <CategoryChip category={tip.category} />
          <StatusChip status={tip.status} />
          {tip.scheduledDate ? <TimingChip scheduledDate={tip.scheduledDate} /> : null}
          <Text style={[styles.priority, { backgroundColor: priorityMeta.background, borderColor: priorityMeta.border, color: priorityMeta.color }]}>P{priority}</Text>
          <Text style={[styles.priorityLabel, { color: priorityMeta.color }]}>{priorityMeta.label}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{tip.title || '無題のTips'}</Text>
        <Text style={styles.preview} numberOfLines={compact ? 2 : 4}>{preview}</Text>
        <View style={styles.footer}>
          <Text style={styles.date}>{formatDate(tip.createdAt)} に保存</Text>
          {showDoneAction && tip.status !== 'done' ? (
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.doneButton}
              onPress={(event) => {
                event.stopPropagation();
                markDone();
              }}
              disabled={!canMarkDone}
            >
              <Animated.Text style={[styles.doneCheck, { transform: [{ scale: checkScale }] }]}>✓</Animated.Text>
              <Text style={styles.doneText}>実行済み</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    ...tokens.shadow.card,
    overflow: 'hidden',
  },
  priorityLine: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  priorityTopBand: {
    height: 4,
    left: 0,
    opacity: 0.9,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  compact: {
    shadowOpacity: 0,
    elevation: 0,
  },
  image: {
    backgroundColor: tokens.color.surfaceSoft,
    borderRadius: tokens.radius.md,
    height: 150,
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  title: {
    color: tokens.color.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  preview: {
    color: tokens.color.text,
    fontSize: 14,
    lineHeight: 21,
  },
  memo: {
    color: tokens.color.mutedText,
    fontSize: 13,
    lineHeight: 19,
  },
  date: {
    color: tokens.color.mutedText,
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    justifyContent: 'space-between',
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: tokens.color.successSoft,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 7,
  },
  doneCheck: {
    color: tokens.color.success,
    fontSize: 14,
    fontWeight: '900',
  },
  doneText: {
    color: tokens.color.success,
    fontSize: 12,
    fontWeight: '900',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.color.success,
  },
  newBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    color: tokens.color.accentDark,
    fontSize: 10,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: 'absolute',
    right: tokens.spacing.md,
    top: tokens.spacing.md,
    zIndex: 2,
  },
  priority: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderRadius: 999,
    color: tokens.color.text,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 5,
  },
  priorityLabel: {
    backgroundColor: 'transparent',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 2,
    paddingVertical: 5,
  },
});
