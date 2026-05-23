import { Text, StyleSheet, View } from 'react-native';
import { tokens } from '@/constants/tokens';

type Props = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
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
    lineHeight: 21,
  },
});
