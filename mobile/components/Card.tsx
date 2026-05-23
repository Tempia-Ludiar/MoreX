import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/theme';

type Props = {
  children: ReactNode;
  accentColor?: string;
  style?: ViewStyle;
  padding?: number;
};

export function Card({ children, accentColor, style, padding = 18 }: Props) {
  return (
    <View style={[styles.card, style]}>
      {accentColor ? (
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={[styles.inner, { paddingLeft: accentColor ? padding + 4 : padding, paddingRight: padding, paddingVertical: padding }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  accentBar: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  inner: {
    flex: 1,
  },
});
