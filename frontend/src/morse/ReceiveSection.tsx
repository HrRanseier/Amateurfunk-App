import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMorseReceiver } from "@/src/morse/useMorseReceiver";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

export function ReceiveSection({ freq, wpm }: { freq: number; wpm: number }) {
  const { colors } = useTheme();
  const { status, listening, calibrating, level, transcript, toggle, clear } = useMorseReceiver(freq, wpm);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [transcript]);

  const unavailable = status === "unavailable";
  const denied = status === "denied";

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Empfang</Text>
      <Text style={[styles.hint, { color: colors.onSurfaceMuted }]}>
        Mikrofon dekodiert Morsetöne live
      </Text>

      <View style={styles.controlRow}>
        <Pressable
          testID="mic-toggle-button"
          onPress={toggle}
          style={[
            styles.micBtn,
            {
              backgroundColor: listening ? colors.brandPrimary : colors.surfaceSecondary,
              borderColor: listening ? colors.brandPrimary : colors.borderStrong,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={listening ? "microphone" : "microphone-outline"}
            size={30}
            color={listening ? colors.onBrandPrimary : colors.brand}
          />
        </Pressable>

        <View style={styles.levelWrap}>
          <Text testID="receive-status" style={[styles.levelLabel, { color: colors.onSurfaceMuted }]}>
            {calibrating
              ? "Kalibriere Grundrauschen ..."
              : listening
                ? "Zuhören ..."
                : "Bereit"}
          </Text>
          <View style={[styles.levelTrack, { backgroundColor: colors.surfaceTertiary }]}>
            <View
              testID="mic-level-bar"
              style={[
                styles.levelFill,
                { width: `${Math.round(level * 100)}%`, backgroundColor: colors.brand },
              ]}
            />
          </View>
        </View>

        <Pressable testID="receive-clear-button" onPress={clear} hitSlop={8}>
          <Text style={[styles.clearText, { color: colors.brand }]}>Leeren</Text>
        </Pressable>
      </View>

      {unavailable && (
        <View
          testID="receive-unavailable-notice"
          style={[styles.notice, { backgroundColor: colors.surfaceSecondary, borderColor: colors.warning }]}
        >
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.warning} />
          <Text style={[styles.noticeText, { color: colors.onSurface }]}>
            Live-Dekodierung nur im veröffentlichten Build verfügbar (nicht in der Vorschau / Expo Go).
          </Text>
        </View>
      )}

      {denied && (
        <View style={[styles.notice, { backgroundColor: colors.surfaceSecondary, borderColor: colors.error }]}>
          <Text style={[styles.noticeText, { color: colors.onSurface }]}>
            Mikrofonzugriff verweigert. Bitte in den Einstellungen aktivieren.
          </Text>
          <Pressable
            testID="mic-open-settings-button"
            onPress={() => Linking.openSettings()}
            style={[styles.settingsBtn, { backgroundColor: colors.brandPrimary }]}
          >
            <Text style={[styles.settingsBtnText, { color: colors.onBrandPrimary }]}>
              Einstellungen öffnen
            </Text>
          </Pressable>
        </View>
      )}

      <Text style={[styles.transLabel, { color: colors.onSurfaceMuted }]}>TRANSKRIPT</Text>
      <View style={[styles.transcriptBox, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.transContent}>
          <Text testID="receive-transcript" style={[styles.transcriptText, { color: colors.brand }]}>
            {transcript || (listening ? "…" : "—")}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: "800" },
  hint: { fontSize: fontSize.sm },
  controlRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.xs },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  levelWrap: { flex: 1, gap: spacing.xs },
  levelLabel: { fontSize: fontSize.sm, fontWeight: "600" },
  levelTrack: { height: 12, borderRadius: radius.pill, overflow: "hidden" },
  levelFill: { height: "100%", borderRadius: radius.pill },
  clearText: { fontSize: fontSize.sm, fontWeight: "700" },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.sm,
    flexWrap: "wrap",
  },
  noticeText: { flex: 1, fontSize: fontSize.sm, lineHeight: 18, minWidth: 200 },
  settingsBtn: { borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: "center" },
  settingsBtnText: { fontSize: fontSize.sm, fontWeight: "700" },
  transLabel: { fontSize: fontSize.sm, fontWeight: "700", letterSpacing: 1, marginTop: spacing.sm },
  transcriptBox: {
    height: 110,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  transContent: { flexGrow: 1 },
  transcriptText: { fontSize: fontSize.xl, fontWeight: "700", letterSpacing: 1, fontFamily: monoFont },
});
