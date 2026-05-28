import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Session } from '@supabase/supabase-js';
import { AuthForm } from '@/components/AuthForm';
import { supabase } from '@/lib/supabaseClient';
import { colors, radius, shadow, spacing } from '@/theme';

type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export function SupabaseAuthCard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [signOutError, setSignOutError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) setAuthStatus('success');
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setAuthStatus('loading');
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthStatus('error');
      setSignOutError(error.message);
      return;
    }
    setSession(null);
    setAuthStatus('idle');
    setSignOutError('');
  };

  const isLoading = authStatus === 'loading';

  if (session) {
    return (
      <>
        <LinearGradient
          colors={['#1a1a2e', '#241b40']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          <View style={styles.glowBlob} />
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {session.user.email?.[0]?.toUpperCase() ?? 'M'}
            </Text>
          </View>
          <View style={styles.accountInfo}>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusLabel}>ログイン中</Text>
            </View>
            <Text style={styles.emailText} numberOfLines={1}>
              {session.user.email}
            </Text>
            <Text style={styles.planText}>Free プラン</Text>
          </View>
        </LinearGradient>

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isLoading}
          onPress={signOut}
          style={[styles.logoutButton, isLoading && styles.disabled]}
        >
          <Text style={styles.logoutText}>{isLoading ? '処理中...' : 'ログアウト'}</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <View style={styles.loginCard}>
      {authStatus === 'error' && signOutError ? (
        <Text style={styles.errorText}>{signOutError}</Text>
      ) : null}
      <AuthForm
        compact
        initialMessage="メールアドレスとパスワードでログイン・新規登録できます。"
        onSignedIn={() => {
          setAuthStatus('success');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Logged-in gradient card
  gradientCard: {
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
    ...shadow.button,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  glowBlob: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99,102,241,0.25)',
  },
  avatarBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  accountInfo: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  statusDot: {
    backgroundColor: '#34d399',
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '700',
  },
  emailText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  planText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
  },

  // Logout button
  logoutButton: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  logoutText: {
    color: colors.inkSub,
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: { opacity: 0.55 },

  // Not logged in
  loginCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.card,
  },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18 },
});
