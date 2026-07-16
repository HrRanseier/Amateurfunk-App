import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
const RB_URL = "https://www.repeaterbook.com";

export type Repeater = {
  id: string;
  state_id: string;
  country: string;
  countryCode: string;
  call: string;
  freq: number;
  offsetDir: string;
  tone: string;
  location: string;
  modes: string;
  status: string;
};

const MODE_CHIPS = [
  { key: "fm", label: "FM", match: "fm" },
  { key: "dmr", label: "DMR", match: "dmr" },
  { key: "dstar", label: "D-STAR", match: "d-star" },
  { key: "c4fm", label: "C4FM", match: "fusion" },
] as const;

function statusColor(status: string, colors: ReturnType<typeof useTheme>["colors"]) {
  if (status === "on-air") return colors.success;
  if (status === "off-air") return colors.error;
  return colors.warning;
}

function statusLabel(status: string) {
  if (status === "on-air") return "aktiv";
  if (status === "off-air") return "außer Betrieb";
  return "unbekannt";
}

export default function RepeaterSearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Repeater[] | null>(null);
  const [query, setQuery] = useState<number | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const toggleChip = (key: string) => {
    Haptics.selectionAsync();
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const filtered = useMemo(() => {
    if (!results) return null;
    if (selected.length === 0) return results;
    const wanted = MODE_CHIPS.filter((c) => selected.includes(c.key)).map((c) => c.match);
    return results.filter((r) => {
      const m = r.modes.toLowerCase();
      return wanted.some((w) => m.includes(w));
    });
  }, [results, selected]);

  const search = async () => {
    const mhz = parseFloat(text.trim().replace(",", "."));
    if (!isFinite(mhz) || mhz <= 0) {
      setError("Bitte eine gültige Frequenz in MHz eingeben (z. B. 145.600).");
      setResults(null);
      return;
    }
    Keyboard.dismiss();
    Haptics.selectionAsync();
    setLoading(true);
    setError(null);
    setResults(null);
    setQuery(mhz);
    try {
      const res = await fetch(`${BACKEND}/api/repeater/search?freq=${mhz}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults((data.results ?? []) as Repeater[]);
    } catch {
      setError(
        "Abfrage fehlgeschlagen. Der Erstabruf kann bis zu 90 s dauern – bitte Internetverbindung prüfen und erneut versuchen.",
      );
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (r: Repeater) => {
    Haptics.selectionAsync();
    router.push({
      pathname: "/repeater/detail",
      params: {
        state_id: r.state_id,
        id: r.id,
        call: r.call,
        freq: String(r.freq),
        location: r.location,
        modes: r.modes,
        tone: r.tone,
        status: r.status,
        offsetDir: r.offsetDir,
        country: r.country,
        countryCode: r.countryCode,
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader title="Repeater-Finder" onBack={back} />

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="sine-wave" size={22} color={colors.brand} />
            <TextInput
              testID="repeater-freq-input"
              value={text}
              onChangeText={(t) => setText(t.replace(/[^0-9.,]/g, ""))}
              onSubmitEditing={search}
              keyboardType="decimal-pad"
              returnKeyType="search"
              placeholder="Frequenz eingeben"
              placeholderTextColor={colors.onSurfaceMuted}
              style={[styles.input, { color: colors.onSurface }]}
            />
            <Text style={[styles.unit, { color: colors.brand }]}>MHz</Text>
          </View>
          <Pressable
            testID="repeater-search-button"
            onPress={search}
            disabled={!text.trim() || loading}
            style={({ pressed }) => [
              styles.searchBtn,
              { backgroundColor: colors.brandPrimary, opacity: !text.trim() || loading ? 0.5 : pressed ? 0.85 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={colors.onBrandPrimary} />
            <Text style={[styles.searchText, { color: colors.onBrandPrimary }]}>Suchen</Text>
          </Pressable>
          <Text style={[styles.hint, { color: colors.onSurfaceMuted }]}>
            Suche in Deutschland, Österreich und der Schweiz · Toleranz ±0,0125 MHz.
          </Text>
        </View>

        {results != null && results.length > 0 && (
          <View style={styles.chipRow}>
            {MODE_CHIPS.map((c) => {
              const active = selected.includes(c.key);
              return (
                <Pressable
                  key={c.key}
                  testID={`repeater-chip-${c.key}`}
                  onPress={() => toggleChip(c.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
                      borderColor: active ? colors.brandPrimary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? colors.onBrandPrimary : colors.onSurface }]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {loading && (
          <View style={styles.statusWrap}>
            <ActivityIndicator color={colors.brand} />
            <Text style={[styles.statusText, { color: colors.onSurfaceMuted }]}>
              Suche läuft … (Erstabruf kann bis zu 90 s dauern)
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.statusWrap}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.error} />
            <Text testID="repeater-error" style={[styles.statusText, { color: colors.onSurface }]}>
              {error}
            </Text>
          </View>
        )}

        {!loading && results != null && results.length === 0 && (
          <View style={styles.statusWrap}>
            <MaterialCommunityIcons name="access-point-network-off" size={22} color={colors.onSurfaceMuted} />
            <Text testID="repeater-empty" style={[styles.statusText, { color: colors.onSurface }]}>
              Kein Repeater auf {query} MHz (±0,0125 MHz) gefunden.
            </Text>
          </View>
        )}

        {!loading && filtered != null && filtered.length === 0 && results && results.length > 0 && (
          <View style={styles.statusWrap}>
            <MaterialCommunityIcons name="filter-remove-outline" size={22} color={colors.onSurfaceMuted} />
            <Text style={[styles.statusText, { color: colors.onSurface }]}>
              Keine Treffer für die gewählten Betriebsarten.
            </Text>
          </View>
        )}

        {!loading && filtered != null && filtered.length > 0 && (
          <View testID="repeater-results" style={styles.list}>
            <Text style={[styles.countText, { color: colors.onSurfaceMuted }]}>
              {filtered.length} {filtered.length === 1 ? "Repeater" : "Repeater"} auf {query} MHz
            </Text>
            {filtered.map((r) => (
              <Pressable
                key={`${r.state_id}-${r.id}`}
                testID={`repeater-item-${r.id}`}
                onPress={() => openDetail(r)}
                style={({ pressed }) => [
                  styles.repCard,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={styles.repTop}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor(r.status, colors) }]} />
                  <Text style={[styles.repCall, { color: colors.onSurface }]} numberOfLines={1}>
                    {r.call || "—"}
                  </Text>
                  <View style={[styles.countryBadge, { backgroundColor: colors.brandTertiary }]}>
                    <Text style={[styles.countryText, { color: colors.onBrandTertiary }]}>{r.countryCode}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceMuted} />
                </View>

                <View style={styles.repFreqRow}>
                  <Text style={[styles.repFreq, { color: colors.brand }]}>
                    {r.freq.toFixed(4).replace(".", ",")} MHz
                  </Text>
                  {r.offsetDir ? (
                    <Text style={[styles.repOffset, { color: colors.onSurfaceMuted }]}>Ablage {r.offsetDir}</Text>
                  ) : null}
                </View>

                {r.location ? (
                  <View style={styles.repMetaRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.onSurfaceMuted} />
                    <Text style={[styles.repMeta, { color: colors.onSurfaceSecondary }]} numberOfLines={2}>
                      {r.location}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.badgeRow}>
                  {r.modes ? (
                    <View style={[styles.tag, { borderColor: colors.border }]}>
                      <Text style={[styles.tagText, { color: colors.onSurfaceSecondary }]}>{r.modes}</Text>
                    </View>
                  ) : null}
                  {r.tone ? (
                    <View style={[styles.tag, { borderColor: colors.border }]}>
                      <MaterialCommunityIcons name="tune-vertical" size={12} color={colors.onSurfaceMuted} />
                      <Text style={[styles.tagText, { color: colors.onSurfaceSecondary }]}>{r.tone}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.tag, { borderColor: colors.border }]}>
                    <Text style={[styles.tagText, { color: statusColor(r.status, colors) }]}>
                      {statusLabel(r.status)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}

            <Pressable
              testID="repeater-attribution"
              onPress={() => Linking.openURL(RB_URL)}
              style={styles.attrWrap}
              hitSlop={8}
            >
              <Text style={[styles.attribution, { color: colors.onSurfaceMuted }]}>Daten: </Text>
              <Text style={[styles.attribution, styles.attrLink, { color: colors.brand }]}>RepeaterBook.com</Text>
            </Pressable>
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

  card: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.md },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  input: {
    flex: 1,
    minWidth: 0,
    height: 48,
    fontSize: fontSize.xl,
    fontWeight: "700",
    fontFamily: monoFont,
    paddingVertical: 0,
  },
  unit: { fontSize: fontSize.lg, fontWeight: "800" },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 50,
    borderRadius: radius.md,
  },
  searchText: { fontSize: fontSize.lg, fontWeight: "800" },
  hint: { fontSize: fontSize.sm, lineHeight: 16, fontWeight: "600" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.base, fontWeight: "700" },

  statusWrap: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  statusText: { flex: 1, fontSize: fontSize.base, fontWeight: "600", lineHeight: 20 },

  list: { gap: spacing.md },
  countText: { fontSize: fontSize.sm, fontWeight: "700", marginBottom: spacing.xs },
  repCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  repTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusDot: { width: 12, height: 12, borderRadius: radius.pill },
  repCall: { flex: 1, fontSize: fontSize.lg, fontWeight: "800", fontFamily: monoFont },
  countryBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  countryText: { fontSize: fontSize.sm, fontWeight: "800" },
  repFreqRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.md },
  repFreq: { fontSize: fontSize.xl, fontWeight: "800", fontFamily: monoFont },
  repOffset: { fontSize: fontSize.base, fontWeight: "700" },
  repMetaRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs },
  repMeta: { flex: 1, fontSize: fontSize.base, fontWeight: "600", lineHeight: 18 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 2 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: { fontSize: fontSize.sm, fontWeight: "700" },

  attrWrap: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.sm },
  attribution: { fontSize: fontSize.sm, textAlign: "center" },
  attrLink: { fontWeight: "800", textDecorationLine: "underline" },
});
