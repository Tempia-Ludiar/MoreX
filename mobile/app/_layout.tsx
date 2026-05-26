import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { AuthGate } from '@/components/AuthGate';
import { Onboarding } from '@/components/Onboarding';
import { tokens } from '@/constants/tokens';

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }} />
          <Onboarding />
        </AuthGate>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.background,
    ...Platform.select({ web: { alignItems: 'center' as const } }),
  },
  container: {
    flex: 1,
    width: '100%',
    ...Platform.select({ web: { maxWidth: 480 } }),
  },
});
