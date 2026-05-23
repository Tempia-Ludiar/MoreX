import { Text, StyleSheet, View } from 'react-native';
import { tokens } from '@/constants/tokens';

type Props = {
  title: string;
  body?: string;
};

export function EmptyState({ title, body }: Props) {
  return (
    <View style={styles.empty}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  title: {
    color: tokens.color.text,
    fontSize: 16,
    fontWeight: '800',
  },
  body: {
    color: tokens.color.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },
});
