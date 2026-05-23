import { Text, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { tokens } from '@/constants/tokens';

type Props = TextInputProps & {
  label: string;
};

export function TextInputField({ label, style, multiline, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={tokens.color.mutedText}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.spacing.xs,
  },
  label: {
    color: tokens.color.text,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    color: tokens.color.text,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
});
