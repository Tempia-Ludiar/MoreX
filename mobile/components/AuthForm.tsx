import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { colors, radius, spacing } from '@/theme';

type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

type Props = {
  compact?: boolean;
  initialMessage?: string;
  onSignedIn?: (email: string) => void;
};

export function AuthForm({
  compact = false,
  initialMessage = 'メールアドレスとパスワードでログインできます。',
  onSignedIn,
}: Props) {
  const [authEmail, setAuthEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authMessage, setAuthMessage] = useState(initialMessage);

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

    setAuthStatus('success');
    if (data.session) {
      const email = data.session.user.email ?? authEmail.trim();
      setAuthMessage(`${email} で登録してログインしました。`);
      onSignedIn?.(email);
      return;
    }

    setAuthMessage('登録しました。メール確認が有効な場合は、受信メールのリンクを開いてください。');
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

    const email = data.user.email ?? authEmail.trim();
    setAuthStatus('success');
    setAuthMessage(`${email} でログインしました。`);
    onSignedIn?.(email);
  };

  const isLoading = authStatus === 'loading';

  return (
    <View style={styles.form}>
      <Text style={[styles.message, authStatus === 'error' && styles.errorText]}>
        {authMessage}
      </Text>
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
      <View style={[styles.actions, compact && styles.compactActions]}>
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
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.sm },
  message: { color: colors.inkSub, fontSize: 12, lineHeight: 18 },
  errorText: { color: colors.danger },
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
  compactActions: { flexDirection: 'row' },
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
