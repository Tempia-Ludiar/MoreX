import { Text, StyleSheet, View } from 'react-native';
import { tokens } from '@/constants/tokens';

type Props = {
  title: string;
  subtitle?: string;
};

const getHighlightColor = (title: string) => {
  if (title === 'Add') return 'rgba(37, 99, 235, 0.11)';
  if (title === 'Library') return 'rgba(217, 119, 6, 0.12)';
  if (title === 'MyTips') return 'rgba(5, 150, 105, 0.12)';
  if (title === 'Settings') return 'rgba(100, 116, 139, 0.12)';
  return 'rgba(37, 99, 235, 0.1)';
};

const getAccentColor = (title: string) => {
  if (title === 'Add') return 'rgba(37, 99, 235, 0.32)';
  if (title === 'Library') return 'rgba(217, 119, 6, 0.34)';
  if (title === 'MyTips') return 'rgba(5, 150, 105, 0.34)';
  if (title === 'Settings') return 'rgba(100, 116, 139, 0.34)';
  return 'rgba(37, 99, 235, 0.28)';
};

export function ScreenHeader({ title, subtitle }: Props) {
  const highlightColor = getHighlightColor(title);
  const accentColor = getAccentColor(title);
  return (
    <View style={styles.wrapper}>
      <View style={styles.titleWrap}>
        <View pointerEvents="none" style={[styles.paintBase, { backgroundColor: highlightColor }]} />
        <View pointerEvents="none" style={[styles.paintDropLeft, { backgroundColor: highlightColor }]} />
        <View pointerEvents="none" style={[styles.paintDropRight, { backgroundColor: highlightColor }]} />
        <View pointerEvents="none" style={[styles.thinAccent, { backgroundColor: accentColor }]} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  titleWrap: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  paintBase: {
    borderRadius: 18,
    bottom: 2,
    left: -4,
    opacity: 1,
    position: 'absolute',
    right: -10,
    top: 6,
    transform: [{ rotate: '-0.8deg' }],
  },
  paintDropLeft: {
    borderRadius: 999,
    bottom: 1,
    height: 14,
    left: 6,
    opacity: 0.46,
    position: 'absolute',
    width: 42,
  },
  paintDropRight: {
    borderRadius: 999,
    height: 20,
    opacity: 0.4,
    position: 'absolute',
    right: -2,
    top: 4,
    transform: [{ rotate: '4deg' }],
    width: 54,
  },
  thinAccent: {
    borderRadius: 999,
    bottom: 4,
    height: 2,
    left: 16,
    opacity: 0.75,
    position: 'absolute',
    right: 14,
  },
  title: {
    color: tokens.color.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: tokens.color.mutedText,
    fontSize: 14,
    lineHeight: 22,
  },
});
