import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

type Freq = { name: string; value: string; valueMHz: number; primary: boolean };
type Airport = { name: string; icao?: string; iata?: string; country?: string; frequencies: Freq[]; matched?: Freq[] };
type Tab = "airport" | "frequency";

export default function FlugfunkScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("airport");

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Airport[] | null>(null);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/bandplan"));

  const switchTab = (t: Tab) => {
    Haptics.selectionAsync();
    setTab(t);
    setText("");
    setResults(null);
    setError(null);
  };

  const search = async () => {
    const q = text.trim();
    if (!q) return;
    Keyboard.dismiss();
    Haptics.selectionAsync();
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      let url: string;
      if (tab === "airport") {
        url = `${BACKEND}/api/flugfunk/airports?search=${encodeURIComponent(q)}`;
      } else {
        const mhz = parseFloat(q.replace(",", "."));
        if (!isFinite(mhz) || mhz <= 0) {
          setError("Bitte eine gültige Frequenz eingeben.");
          setLoading(false);
          return;
        }
        url = `${BACKEND}/api/flugfunk/frequency?mhz=${mhz}&country=DE`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(tab === "airport" ? data.airports ?? [] : data.matches ?? []);
    } catch {
      setError("Abfrage fehlgeschlagen. Bitte Internetverbindung prüfen und erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader title="Bandplan · Flugfunk" onBack={back} />

      <View style={[styles.segment, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        {([
          { id: "airport", label: "Flughafen → Freq." },
          { id: "frequency", label: "Freq. → Flughafen" },
        ] as { id: Tab; label: string }[]).map((t) => {
          const active = tab === t.id;
          return (
            <Pressable key={t.id} testID={`ff-tab-${t.id}`} onPress={() => switchTab(t.id)} style={[styles.segBtn, active && { backgroundColor: colors.brandPrimary }]}>
              <Text style={[styles.segText, { color: active ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
          <View style={styles.inputRow}>
            <TextInput
              testID="ff-input"
              value={text}
              onChangeText={(t) => setText(tab === "frequency" ? t.replace(/[^0-9.,]/g, "") : t)}
              onSubmitEditing={search}
              autoCapitalize={tab === "airport" ? "characters" : "none"}
              autoCorrect={false}
              keyboardType={tab === "frequency" ? "decimal-pad" : "default"}
              returnKeyType="search"
              placeholder={tab === "airport" ? "z. B. München oder EDDM" : "z. B. 118.705"}
              placeholderTextColor={colors.onSurfaceMuted}
              style={[styles.input, { color: colors.onSurface }]}
            />
            {tab === "frequency" ? <Text style={[styles.unit, { color: colors.brand }]}>MHz</Text> : null}
          </View>
          <Pressable
            testID="ff-search-button"
            onPress={search}
            disabled={!text.trim() || loading}
            style={({ pressed }) => [styles.searchBtn, { backgroundColor: colors.brandPrimary, opacity: !text.trim() || loading ? 0.5 : pressed ? 0.85 : 1 }]}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={colors.onBrandPrimary} />
            <Text style={[styles.searchText, { color: colors.onBrandPrimary }]}>Suchen</Text>
          </Pressable>
          {tab === "airport" && (
            <Text style={[styles.umlautHint, { color: colors.onSurfaceMuted }]}>
              Umlaute bitte umschreiben: ü = ue, ä = ae, ö = oe.
            </Text>
          )}
        </View>

        {loading && (
          <View style={styles.statusWrap}>
            <ActivityIndicator color={colors.brand} />
            <Text style={[styles.statusText, { color: colors.onSurfaceMuted }]}>Suche läuft …</Text>
          </View>
        )}

        {error && (
          <View style={styles.statusWrap}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.error} />
            <Text testID="ff-error" style={[styles.statusText, { color: colors.onSurface }]}>{error}</Text>
          </View>
        )}

        {!loading && results != null && results.length === 0 && (
          <View style={styles.statusWrap}>
            <MaterialCommunityIcons name="airplane-off" size={22} color={colors.onSurfaceMuted} />
            <Text testID="ff-empty" style={[styles.statusText, { color: colors.onSurface }]}>Kein Treffer gefunden.</Text>
          </View>
        )}

        {!loading && results != null && results.length > 0 && (
          <View testID="ff-results" style={styles.list}>
            {results.map((a, i) => {
              const freqs = tab === "frequency" && a.matched ? a.matched : a.frequencies;
              return (
                <View key={`${a.icao ?? a.name}-${i}`} style={[styles.airportCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <View style={styles.airportTop}>
                    <MaterialCommunityIcons name="airport" size={20} color={colors.brand} />
                    <Text style={[styles.airportName, { color: colors.onSurface }]}>{a.name}</Text>
                    {a.icao ? (
                      <View style={[styles.codeBadge, { backgroundColor: colors.brandTertiary }]}>
                        <Text style={[styles.codeText, { color: colors.onBrandTertiary }]}>{a.icao}</Text>
                      </View>
                    ) : null}
                  </View>
                  {freqs.length === 0 ? (
                    <Text style={[styles.freqNone, { color: colors.onSurfaceMuted }]}>Keine Frequenzen verfügbar.</Text>
                  ) : (
                    freqs.map((f, j) => (
                      <View key={j} style={[styles.freqRow, { borderTopColor: colors.divider }]}>
                        <Text style={[styles.freqName, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
                          {f.name}
                          {f.primary ? " ★" : ""}
                        </Text>
                        <Text style={[styles.freqVal, { color: colors.onSurface }]}>{f.value} MHz</Text>
                      </View>
                    ))
                  )}
                </View>
              );
            })}

            <View style={styles.signWrap}>
              <Image
                source={require("../../assets/images/no-transmit.png")}
                style={styles.signImage}
                resizeMode="contain"
                accessibilityLabel="Senden verboten, nur Empfang!"
              />
            </View>
            <Text style={[styles.attribution, { color: colors.onSurfaceMuted }]}>Daten: OpenAIP (openaip.net)</Text>
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },

  segment: { flexDirection: "row", marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radius.md, borderWidth: 1, padding: 4, gap: 4 },
  segBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  segText: { fontSize: fontSize.base, fontWeight: "700" },

  card: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.md },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  input: { flex: 1, minWidth: 0, height: 48, fontSize: fontSize.xl, fontWeight: "700", fontFamily: monoFont, paddingVertical: 0 },
  unit: { fontSize: fontSize.lg, fontWeight: "800" },
  searchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, height: 50, borderRadius: radius.md },
  searchText: { fontSize: fontSize.lg, fontWeight: "800" },
  umlautHint: { fontSize: fontSize.sm, lineHeight: 16, fontWeight: "600" },

  statusWrap: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  statusText: { flex: 1, fontSize: fontSize.base, fontWeight: "600", lineHeight: 20 },

  list: { gap: spacing.md },
  airportCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg },
  airportTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  airportName: { flex: 1, fontSize: fontSize.lg, fontWeight: "800" },
  codeBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  codeText: { fontSize: fontSize.sm, fontWeight: "800", fontFamily: monoFont },
  freqNone: { fontSize: fontSize.base, fontStyle: "italic" },
  freqRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  freqName: { flex: 1, fontSize: fontSize.base, fontWeight: "600" },
  freqVal: { fontSize: fontSize.base, fontWeight: "800", fontFamily: monoFont },

  signWrap: { alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderRadius: radius.lg, borderWidth: 1, borderColor: "#E0E0E0", padding: spacing.md },
  signImage: { width: 240, height: 240 },
  attribution: { fontSize: fontSize.sm, textAlign: "center", marginTop: spacing.xs },
});
