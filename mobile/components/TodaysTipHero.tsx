import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { radius, shadow, spacing } from '@/theme';
import { Tip } from '@/types/tip';

type Props = {
  tip: Tip;
};

export function TodaysTipHero({ tip }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => router.push(`/tips/${tip.id}`)}
    >
      <LinearGradient
        colors={['#1a1a2e', '#241b40']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.glowBlob} />

        <Text style={styles.eyebrow}>★  今日のTip · 優先度1位</Text>

        <Text style={styles.title} numberOfLines={2}>
          {tip.title || '無題のTips'}
        </Text>

        {tip.memo || tip.content ? (
          <Text style={styles.preview} numberOfLines={2}>
            {tip.memo || tip.content}
          </Text>
        ) : null}

        <View style={styles.footer}>
          {tip.category ? (
            <View style={styles.catPill}>
              <Text style={styles.catText}>{tip.category}</Text>
            </View>
          ) : null}
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>実行する →</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
    ...shadow.button,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  glowBlob: {
    position: 'absolute',
    right: -32,
    top: -32,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(234,88,12,0.22)',
  },
  eyebrow: {
    color: '#fb923c',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 24,
    marginTop: 2,
  },
  preview: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  catPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  catText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  ctaButton: {
    backgroundColor: '#fb923c',
    borderRadius: radius.pill,
    marginLeft: 'auto',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
