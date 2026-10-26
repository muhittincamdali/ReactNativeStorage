import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  type ScrollViewInstance,
  Settings,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { isStorageError } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, Card, Row, styles as shared } from './src/components';
import { palettes } from './src/palette';
import { PressCounter, pressCount } from './src/QuickStart';
import {
  ThemeChoice,
  apiToken,
  createToken,
  draft,
  launches,
  profile,
  reportedErrors,
  storedProfileVersion,
  theme,
} from './src/storage';

const THEMES = ThemeChoice.options;

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function mask(secret: string | undefined): string {
  return secret === undefined ? 'none' : `${secret.slice(0, 4)}${'•'.repeat(8)}`;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StorageDemo />
    </SafeAreaProvider>
  );
}

function StorageDemo() {
  const systemScheme = useColorScheme();
  const [themeChoice, setThemeChoice] = useStorageItem(theme);
  const [launchCount] = useStorageItem(launches);
  const [note, setNote, noteState] = useStorageItem(draft);
  const [person] = useStorageItem(profile);
  const [token, , tokenState] = useStorageItem(apiToken);
  const [lastError, setLastError] = useState('none');
  const now = useNow(1000);

  useEffect(() => {
    void launches.set((count) => count + 1);
  }, []);

  const scheme = themeChoice === 'system' ? (systemScheme ?? 'light') : themeChoice;
  const colors = palettes[scheme === 'dark' ? 'dark' : 'light'];
  const secondsLeft =
    noteState.expiresAt === undefined
      ? undefined
      : Math.max(0, Math.ceil((noteState.expiresAt - now) / 1000));

  const writeInvalidTheme = () => {
    theme.set('purple' as ThemeChoice).catch((error: unknown) => {
      setLastError(isStorageError(error) ? `${error.code}: ${error.message}` : 'unexpected error');
    });
  };

  // `-demoActions "press,theme=dark,draft=Buy milk"` (and `-demoScroll end`) at launch (iOS reads launch arguments into
  // Settings) runs the same code as the buttons, so scripts/e2e-ios.sh can drive the app on a
  // simulator without touching the screen.
  const scroll = useRef<ScrollViewInstance>(null);
  const actions = useRef<Record<string, (value: string) => Promise<unknown>>>({});
  actions.current = {
    press: () => pressCount.set((n) => n + 1),
    theme: async (value) => {
      const choice = ThemeChoice.safeParse(value);
      if (choice.success) await setThemeChoice(choice.data);
    },
    'invalid-theme': async () => writeInvalidTheme(),
    draft: (value) => setNote(value),
    'create-token': () => createToken(),
    'delete-token': () => tokenState.remove(),
  };
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const script: unknown = Settings.get('demoActions');
    const scrollToEnd = Settings.get('demoScroll') === 'end';
    void (async () => {
      const steps = typeof script === 'string' ? script.split(',') : [];
      for (const step of steps) {
        const [name = '', value = ''] = step.split('=');
        try {
          await actions.current[name.trim()]?.(value);
        } catch (error) {
          setLastError(isStorageError(error) ? `${error.code}: ${error.message}` : String(error));
        }
      }
      if (scrollToEnd) setTimeout(() => scroll.current?.scrollToEnd({ animated: false }), 500);
    })();
  }, []);

  return (
    <SafeAreaView style={[layout.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView ref={scroll} contentContainerStyle={layout.content}>
        <Text style={[layout.heading, { color: colors.text }]}>Storage Demo</Text>
        <Text style={[layout.lead, { color: colors.muted }]}>
          Every value on this screen is read from and written to device storage.
        </Text>

        <Card
          title="Quick start"
          caption="The README example: a counter kept in MMKV."
          colors={colors}
        >
          <PressCounter />
        </Card>

        <Card title="Theme" caption="A Zod enum in MMKV. The screen follows it." colors={colors}>
          <View style={shared.buttons}>
            {THEMES.map((choice) => (
              <ActionButton
                key={choice}
                title={choice}
                selected={choice === themeChoice}
                colors={colors}
                onPress={() => void setThemeChoice(choice)}
              />
            ))}
          </View>
          <ActionButton
            title="Write an invalid theme"
            selected={false}
            colors={colors}
            onPress={writeInvalidTheme}
          />
          <Row label="Last error" value={lastError} colors={colors} />
        </Card>

        <Card
          title="Launches"
          caption="Incremented with an updater every time the app starts."
          colors={colors}
        >
          <Row label="App launches" value={String(launchCount)} colors={colors} />
        </Card>

        <Card
          title="Draft"
          caption="Kept for five minutes after the last edit (TTL)."
          colors={colors}
        >
          <TextInput
            accessibilityLabel="Draft note"
            value={note}
            onChangeText={(text) => void setNote(text)}
            placeholder="Type a note"
            placeholderTextColor={colors.muted}
            style={[
              shared.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />
          <Row
            label="Expires in"
            value={secondsLeft === undefined ? 'not saved' : `${secondsLeft} s`}
            colors={colors}
          />
        </Card>

        <Card
          title="Profile"
          caption="Version 2 of the schema, migrated from version 1 on read."
          colors={colors}
        >
          <Row label="First name" value={person.first} colors={colors} />
          <Row label="Last name" value={person.last} colors={colors} />
          <Row label="Stored schema version" value={storedProfileVersion()} colors={colors} />
        </Card>

        <Card
          title="API token"
          caption="Created once with expo-crypto and kept in SecureStore."
          colors={colors}
        >
          <Row
            label="Token"
            value={tokenState.status === 'loading' ? 'loading' : mask(token)}
            colors={colors}
          />
          <View style={shared.buttons}>
            <ActionButton title="Create token" colors={colors} onPress={() => void createToken()} />
            <ActionButton
              title="Delete"
              selected={false}
              colors={colors}
              onPress={() => void tokenState.remove()}
            />
          </View>
        </Card>

        <Card
          title="Reported errors"
          caption="Unreadable data reaches onError, not the console."
          colors={colors}
        >
          <Row label="Count" value={String(reportedErrors.length)} colors={colors} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const layout = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  heading: { fontSize: 30, fontWeight: '700', marginTop: 8 },
  lead: { fontSize: 15, lineHeight: 21 },
});
