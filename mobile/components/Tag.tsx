import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius } from '@/theme';

type TagColor = 'pink' | 'orange' | 'yellow' | 'green' | 'purple' | 'accent' | 'neutral' | 'dark';

const colorMap: Record<TagColor, { bg: string; text: string }> = {
  pink: { bg: colors.pinkSoft, text: colors.pink },
  orange: { bg: colors.orangeSoft, text: colors.orange },
  yellow: { bg: colors.yellowSoft, text: colors.yellow },
  green: { bg: colors.greenSoft, text: colors.green },
  purple: { bg: colors.purpleSoft, text: colors.purple },
  accent: { bg: colors.accentSoft, text: colors.accentDeep },
  neutral: { bg: '#f0f0f5', text: colors.inkSub },
  dark: { bg: colors.ink, text: '#ffffff' },
};

type Props = {
  label: string;
  color?: TagColor;
  active?: boolean;
  onPress?: () => void;
  small?: boolean;
};

export function Tag({ label, color = 'neutral', active = false, onPress, small = false }: Props) {
  const scheme = active ? colorMap.dark : colorMap[color];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
      style={[
        styles.tag,
        small && styles.small,
        { backgroundColor: scheme.bg },
      ]}
    >
      <Text style={[styles.text, small && styles.smallText, { color: scheme.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  small: {
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
});
