import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Palette } from './palette';

export function Card({
  title,
  caption,
  colors,
  children,
}: {
  title: string;
  caption: string;
  colors: Palette;
  children: ReactNode;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.caption, { color: colors.muted }]}>{caption}</Text>
      {children}
    </View>
  );
}

export function Row({ label, value, colors }: { label: string; value: string; colors: Palette }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function ActionButton({
  title,
  onPress,
  colors,
  selected = true,
}: {
  title: string;
  onPress: () => void;
  colors: Palette;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.button,
        selected
          ? { backgroundColor: colors.accent, borderColor: colors.accent }
          : { backgroundColor: colors.chip, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.buttonText, { color: selected ? colors.accentText : colors.chipText }]}>
        {title}
      </Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  title: { fontSize: 17, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 15 },
  value: { fontSize: 15, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  buttons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  button: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  buttonText: { fontSize: 15, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
});
