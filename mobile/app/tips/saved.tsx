import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, shadow, spacing } from '@/theme';

export default function TipSavedScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return (
    <View style={styles.screen}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>✓</Text>
      </View>
      <Text style={styles.title}>保存しました</Text>
      <Text style={styles.body}>TipsをLibraryへ追加しました。あとでTodoから見返して、実行に移せます。</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)')} activeOpacity={0.82}>
        <Text style={styles.primaryButtonText}>他のTipsを追加する</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/(tabs)/board')} activeOpacity={0.82}>
        <Text style={styles.secondaryButtonText}>Libraryへ進む</Text>
      </TouchableOpacity>
      {id ? (
        <TouchableOpacity style={styles.linkButton} onPress={() => router.replace(`/tips/${id}`)} activeOpacity={0.72}>
          <Text style={styles.linkText}>保存したTipsを見る</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', backgroundColor: colors.bg, flex: 1, justifyContent: 'center', padding: spacing.xl },
  iconCircle: { alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: 36, height: 72, justifyContent: 'center', marginBottom: spacing.lg, width: 72 },
  icon: { color: colors.green, fontSize: 34, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', marginBottom: spacing.sm },
  body: { color: colors.inkSub, fontSize: 14, lineHeight: 22, marginBottom: spacing.xl, maxWidth: 340, textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.lg, paddingVertical: 16, width: '100%', ...shadow.button },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.bgElevated, borderColor: colors.ink, borderRadius: radius.lg, borderWidth: 1.5, marginTop: spacing.md, paddingVertical: 15, width: '100%' },
  secondaryButtonText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  linkButton: { marginTop: spacing.lg, padding: spacing.sm },
  linkText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
});
