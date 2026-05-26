import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { AuthForm } from '@/components/AuthForm';
import { supabase } from '@/lib/supabaseClient';
import { colors, radius, shadow, spacing } from '@/theme';

type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export function SupabaseAuthCard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authMessage, setAuthMessage] = useState('メールアドレスとパスワードでログインできます。');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user.email) {
        setAuthMessage(`${data.session.user.email} でログイン中です。`);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user.email) {
        setAuthStatus('success');
        setAuthMessage(`${nextSession.user.email} でログイン中です。`);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setAuthStatus('loading');
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthStatus('error');
      setAuthMessage(error.message);
      return;
    }

    setSession(null);
    setAuthStatus('idle');
    setAuthMessage('ログアウトしました。');
  };

  const isLoading = authStatus === 'loading';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.statusDot, session ? styles.successDot : styles.idleDot]} />
        <View style={styles.headerCopy}>
          <Text style={styles.title}>アカウント</Text>
          <Text style={[styles.message, authStatus === 'error' && styles.errorText]}>
            {authMessage}
          </Text>
        </View>
      </View>

      {session ? (
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isLoading}
          onPress={signOut}
          style={[styles.secondaryButton, isLoading && styles.disabled]}
        >
          <Text style={styles.secondaryButtonText}>{isLoading ? '処理中...' : 'ログアウト'}</Text>
        </TouchableOpacity>
      ) : (
        <AuthForm
          compact
          initialMessage={authMessage}
          onSignedIn={(email) => {
            setAuthStatus('success');
            setAuthMessage(`${email} でログイン中です。`);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.card,
  },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  statusDot: {
    borderRadius: radius.pill,
    height: 10,
    width: 10,
  },
  idleDot: { backgroundColor: colors.inkMuted },
  successDot: { backgroundColor: colors.green },
  headerCopy: { flex: 1, gap: 4 },
  title: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  message: { color: colors.inkSub, fontSize: 12, lineHeight: 18 },
  errorText: { color: colors.danger },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryButtonText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.55 },
});
