import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
};

export function ScreenHeader({ title, subtitle, meta }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
    marginBottom: 2,
  },
  subtitle: {
    color: colors.inkSub,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 2,
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '500',
  },
});
