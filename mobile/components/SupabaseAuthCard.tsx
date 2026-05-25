import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { colors, radius, shadow, spacing } from '@/theme';

type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export function SupabaseAuthCard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const validateAuthInput = () => {
    if (!authEmail.trim() || !password) {
      setAuthStatus('error');
      setAuthMessage('メールアドレスとパスワードを入力してください。');
      return false;
    }

    if (password.length < 6) {
      setAuthStatus('error');
      setAuthMessage('パスワードは6文字以上で入力してください。');
      return false;
    }

    return true;
  };

  const signUp = async () => {
    if (!validateAuthInput()) return;

    setAuthStatus('loading');
    const { data, error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password,
    });

    if (error) {
      setAuthStatus('error');
      setAuthMessage(error.message);
      return;
    }

    setSession(data.session);
    setAuthStatus('success');
    setAuthMessage(
      data.session
        ? `${data.session.user.email ?? authEmail.trim()} で登録してログインしました。`
        : '登録しました。メール確認が有効な場合は、受信メールのリンクを開いてください。',
    );
  };

  const signIn = async () => {
    if (!validateAuthInput()) return;

    setAuthStatus('loading');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password,
    });

    if (error) {
      setAuthStatus('error');
      setAuthMessage(error.message);
      return;
    }

    setSession(data.session);
    setAuthStatus('success');
    setAuthMessage(`${data.user.email ?? authEmail.trim()} でログインしました。`);
  };

  const signOut = async () => {
    setAuthStatus('loading');
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthStatus('error');
      setAuthMessage(error.message);
      return;
    }

    setSession(null);
    setPassword('');
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
        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setAuthEmail}
            placeholder="メールアドレス"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            textContentType="emailAddress"
            value={authEmail}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setPassword}
            placeholder="パスワード"
            placeholderTextColor={colors.inkMuted}
            secureTextEntry
            style={styles.input}
            textContentType="password"
            value={password}
          />
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.82}
              disabled={isLoading}
              onPress={signIn}
              style={[styles.primaryButton, isLoading && styles.disabled]}
            >
              <Text style={styles.primaryButtonText}>{isLoading ? '処理中...' : 'ログイン'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.82}
              disabled={isLoading}
              onPress={signUp}
              style={[styles.secondaryButton, isLoading && styles.disabled]}
            >
              <Text style={styles.secondaryButtonText}>新規登録</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  form: { gap: spacing.sm },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 13,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
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
