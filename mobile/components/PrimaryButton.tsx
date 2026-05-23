import { PropsWithChildren } from 'react';
import { Text, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { tokens } from '@/constants/tokens';

type Props = PropsWithChildren<TouchableOpacityProps> & {
  variant?: 'primary' | 'secondary' | 'danger';
};

export function PrimaryButton({ children, variant = 'primary', style, disabled, ...props }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.button, styles[variant], disabled && styles.disabled, style]}
      disabled={disabled}
      {...props}
    >
      <Text style={[styles.text, variant !== 'primary' && styles.secondaryText]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
  },
  primary: {
    backgroundColor: tokens.color.black,
  },
  secondary: {
    backgroundColor: tokens.color.surfaceSoft,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  danger: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    color: tokens.color.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryText: {
    color: tokens.color.text,
  },
});
