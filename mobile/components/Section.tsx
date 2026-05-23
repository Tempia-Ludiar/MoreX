import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '@/constants/tokens';

type Props = PropsWithChildren<{
  title?: string;
  action?: React.ReactNode;
}>;

export function Section({ title, action, children }: Props) {
  return (
    <View style={styles.section}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: tokens.color.text,
    fontSize: 17,
    fontWeight: '800',
  },
});
