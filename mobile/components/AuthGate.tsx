import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { AuthForm } from '@/components/AuthForm';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { colors, radius, shadow, spacing } from '@/theme';

type Props = {
  children: ReactNode;
};

export function AuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!session) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.brandBlock}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.title}>MoreX</Text>
          <Text style={styles.subtitle}>保存で終わらせない。Tipsを実行に変える。</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ログイン</Text>
          {!isSupabaseConfigured ? (
            <Text style={styles.errorText}>
              Supabaseの環境変数が未設定です。VercelのEnvironment Variablesに2つの値を追加して再デプロイしてください。
            </Text>
          ) : null}
          <AuthForm
            initialMessage="初回は新規登録してください。次回からはログイン状態が保存されます。"
          />
        </View>
      </ScrollView>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
  screen: { backgroundColor: colors.bg, flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    width: '100%',
    ...Platform.select({ web: { maxWidth: 480, alignSelf: 'center' as const } }),
  },
  brandBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoBox: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  logoText: { color: '#ffffff', fontSize: 24, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800' },
  subtitle: { color: colors.inkSub, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    gap: spacing.md,
    padding: spacing.xl,
    ...shadow.card,
  },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18 },
});
