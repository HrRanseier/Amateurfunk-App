import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius as rad, spacing } from "@/src/theme/tokens";
import { ScreenBg } from "@/src/components/ScreenBg";
import { centered, overlayChip } from "@/src/theme/layout";
import { useTheme } from "@/src/theme/useTheme";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
const RB_URL = "https://www.repeaterbook.com";

type Repeater = {
  id: string;
  state_id: string;
  country: string;
  countryCode: string;
  call: string;
  freq: number;
  band?: string;
  offsetDir: string;
  tone: string;
  location: string;
  modes: string;
  status: string;
  distanceKm?: number;
};

type BandInfo = { band: string; count: number };
type Coords = { lat: number; lon: number };
type LocErr = { msg: string; blocked: boolean };

function statusColor(status: string, colors: ReturnType<typeof useTheme>["colors"]) {
  if (status === "on-air") return colors.success;
  if (status === "off-air") return colors.error;
  return colors.warning;
}

export default function RepeaterSearchScreen() {
  const { colors, darkbg } = useTheme();
  const router = useRouter();

  // Text search + autocomplete
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<Repeater[]>([]);

  // Band filter
  const [bands, setBands] = useState<BandInfo[]>([]);
  const [selectedBands, setSelectedBands] = useState<string[]>([]);

  // Frequency filter
  const [freqText, setFreqText] = useState("");

  // Radius filter
  const [nearEnabled, setNearEnabled] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locLabel, setLocLabel] = useState("");
  const [radiusKm, setRadiusKm] = useState(30);
  const [locText, setLocText] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locErr, setLocErr] = useState<LocErr | null>(null);

  // Results
  const [results, setResults] = useState<Repeater[] | null>(null);
  const [count, setCount] = useState(0);
  const [pending, setPending] = useState(0);
  const [nearResult, setNearResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollTick, setPollTick] = useState(0);
  const pollRef = useRef({ key: "", n: 0 });
  const mounted = useRef(true);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Load available bands once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/api/repeater/bands`);
        if (res.ok) {
          const data = await res.json();
          setBands(data.bands ?? []);
        }
      } catch {
        /* ignore — chips just won't show */
      }
    })();
  }, []);

  // Live autocomplete (debounced)
  useEffect(() => {
    const q = text.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND}/api/repeater/suggest?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted.current) setSuggestions(data.results ?? []);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [text]);

  const freqNum = useMemo(() => {
    const raw = freqText.trim().replace(",", ".");
    const v = parseFloat(raw);
    return raw && isFinite(v) && v > 0 ? v : null;
  }, [freqText]);

  const baseKey = useMemo(
    () =>
      `${freqNum ?? ""}|${[...selectedBands].sort().join(",")}|${
        nearEnabled && coords ? `${coords.lat},${coords.lon}` : ""
      }|${radiusKm}`,
    [freqNum, selectedBands, nearEnabled, coords, radiusKm],
  );

  const hasCriteria = freqNum != null || selectedBands.length > 0 || (nearEnabled && coords != null);

  const openDetail = (r: Repeater) => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
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
    setText("");
    setSuggestions([]);
  };

  // Unified search (debounced), re-runs on criteria change or poll tick
  useEffect(() => {
    if (!hasCriteria) {
      setResults(null);
      setError(null);
      setPending(0);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (freqNum != null) params.set("freq", String(freqNum));
        if (selectedBands.length) params.set("bands", selectedBands.join(","));
        if (nearEnabled && coords) {
          params.set("near", `${coords.lat},${coords.lon}`);
          params.set("radius", String(radiusKm));
        }
        const res = await fetch(`${BACKEND}/api/repeater/search?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled || !mounted.current) return;
        setResults((data.results ?? []) as Repeater[]);
        setCount(data.count ?? 0);
        setPending(data.pendingCoords ?? 0);
        setNearResult(!!data.near);
        // Progressive coord backfill: poll while coords are still loading
        if (data.near && data.pendingCoords > 0) {
          if (pollRef.current.key !== baseKey) pollRef.current = { key: baseKey, n: 0 };
          if (pollRef.current.n < 12) {
            pollRef.current.n += 1;
            setTimeout(() => mounted.current && setPollTick((x) => x + 1), 4000);
          }
        }
      } catch {
        if (!cancelled && mounted.current)
          setError("Abfrage fehlgeschlagen. Bitte Internetverbindung prüfen und erneut versuchen.");
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey, pollTick, hasCriteria]);

  const toggleBand = (b: string) => {
    Haptics.selectionAsync();
    setSelectedBands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  };

  const toggleNear = (v: boolean) => {
    Haptics.selectionAsync();
    setNearEnabled(v);
    if (!v) setLocErr(null);
  };

  const useGps = async () => {
    Haptics.selectionAsync();
    setLocErr(null);
    setLocLoading(true);
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== "granted" && perm.canAskAgain) {
        perm = await Location.requestForegroundPermissionsAsync();
      }
      if (perm.status !== "granted") {
        setLocErr({
          msg: perm.canAskAgain
            ? "Kein Standortzugriff. Bitte erlauben oder unten den Ort manuell eingeben."
            : "Standortzugriff ist blockiert. Bitte in den Einstellungen erlauben – oder Ort manuell eingeben.",
          blocked: !perm.canAskAgain,
        });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setLocLabel("Mein Standort (GPS)");
    } catch {
      setLocErr({ msg: "Standort konnte nicht ermittelt werden. Bitte Ort manuell eingeben.", blocked: false });
    } finally {
      setLocLoading(false);
    }
  };

  const geocode = async () => {
    const q = locText.trim();
    if (!q) return;
    Keyboard.dismiss();
    setLocLoading(true);
    setLocErr(null);
    try {
      const res = await fetch(`${BACKEND}/api/repeater/geocode?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setCoords({ lat: d.lat, lon: d.lon });
      setLocLabel((d.display || q).split(",")[0]);
    } catch {
      setLocErr({ msg: "Ort nicht gefunden. Bitte anders schreiben.", blocked: false });
    } finally {
      setLocLoading(false);
    }
  };

  const showSuggest = text.trim().length > 0 && suggestions.length > 0;

  const renderResults = useCallback(() => {
    if (!hasCriteria) {
      return (
        <View style={styles.placeholderWrap}>
          <MaterialCommunityIcons name="tune-variant" size={40} color={colors.onSurfaceMuted} />
          <Text style={[styles.placeholderText, { color: colors.onSurfaceMuted }]}>
            Nach Ort/Rufzeichen suchen oder Band, Frequenz und Umkreis wählen.
          </Text>
        </View>
      );
    }
    return (
      <>
        {loading && results == null && (
          <View style={styles.statusWrap}>
            <ActivityIndicator color={colors.brand} />
            <Text style={[styles.statusText, { color: colors.onSurfaceMuted }]}>Suche läuft …</Text>
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
        {results != null && (
          <View testID="repeater-results" style={styles.list}>
            <View style={styles.countRow}>
              <Text testID="repeater-count" style={[styles.countText, { color: colors.onSurface }]}>
                {count} {count === 1 ? "Treffer" : "Treffer"}
                {nearResult ? ` · ≤ ${radiusKm} km` : ""}
              </Text>
              {loading ? <ActivityIndicator size="small" color={colors.brand} /> : null}
            </View>

            {nearResult && pending > 0 && (
              <View style={[styles.pendingBox, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="map-clock-outline" size={18} color={colors.brand} />
                <Text style={[styles.pendingText, { color: colors.onSurfaceSecondary }]}>
                  {pending} weitere Standorte werden geladen …
                </Text>
                <Pressable testID="repeater-refresh-button" onPress={() => setPollTick((x) => x + 1)} hitSlop={8}>
                  <Text style={[styles.refreshText, { color: colors.brand }]}>Aktualisieren</Text>
                </Pressable>
              </View>
            )}

            {count === 0 && !loading && (
              <View style={styles.statusWrap}>
                <MaterialCommunityIcons name="access-point-network-off" size={22} color={colors.onSurfaceMuted} />
                <Text testID="repeater-empty" style={[styles.statusText, { color: colors.onSurface }]}>
                  {nearResult
                    ? `Kein Repeater im Umkreis von ${radiusKm} km.`
                    : "Kein Repeater für diese Filter gefunden."}
                </Text>
              </View>
            )}

            {results.map((r) => (
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
                  {r.distanceKm != null ? (
                    <View style={[styles.distBadge, { backgroundColor: colors.brandPrimary }]}>
                      <MaterialCommunityIcons name="map-marker-distance" size={12} color={colors.onBrandPrimary} />
                      <Text style={[styles.distText, { color: colors.onBrandPrimary }]}>{r.distanceKm} km</Text>
                    </View>
                  ) : null}
                  <View style={[styles.countryBadge, { backgroundColor: colors.brandTertiary }]}>
                    <Text style={[styles.countryText, { color: colors.onBrandTertiary }]}>{r.countryCode}</Text>
                  </View>
                </View>
                <View style={styles.repFreqRow}>
                  <Text style={[styles.repFreq, { color: colors.brand }]}>{r.freq.toFixed(4).replace(".", ",")} MHz</Text>
                  {r.band ? <Text style={[styles.repBand, { color: colors.onSurfaceMuted }]}>{r.band}</Text> : null}
                  {r.offsetDir ? <Text style={[styles.repOffset, { color: colors.onSurfaceMuted }]}>Ablage {r.offsetDir}</Text> : null}
                </View>
                {r.location ? (
                  <View style={styles.repMetaRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.onSurfaceMuted} />
                    <Text style={[styles.repMeta, { color: colors.onSurfaceSecondary }]} numberOfLines={2}>
                      {r.location}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.tagRow}>
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
                </View>
              </Pressable>
            ))}

            {count > 0 && (
              <Pressable testID="repeater-attribution" onPress={() => Linking.openURL(RB_URL)} style={[styles.attrWrap, overlayChip(darkbg)]} hitSlop={8}>
                <Text style={[styles.attribution, { color: colors.onSurfaceMuted }]}>Daten: </Text>
                <Text style={[styles.attribution, styles.attrLink, { color: colors.brand }]}>RepeaterBook.com</Text>
              </Pressable>
            )}
          </View>
        )}
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCriteria, loading, error, results, count, pending, nearResult, radiusKm, colors]);

  return (
    <View style={styles.root}>
      <ScreenBg bg={3} />
      <ScreenHeader title="Repeater-Finder" onBack={back} />

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, centered]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        {/* Text search + autocomplete */}
        <View style={{ zIndex: 20 }}>
          <View style={[styles.searchField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.brand} />
            <TextInput
              testID="repeater-text-input"
              value={text}
              onChangeText={setText}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Ort oder Rufzeichen"
              placeholderTextColor={colors.onSurfaceMuted}
              style={[styles.searchInput, { color: colors.onSurface }]}
            />
            {text.length > 0 ? (
              <Pressable testID="repeater-text-clear" onPress={() => setText("")} hitSlop={10}>
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            ) : null}
          </View>
          {showSuggest && (
            <View
              testID="repeater-suggest"
              style={[styles.suggestBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
              {suggestions.slice(0, 8).map((s, i) => (
                <Pressable
                  key={`${s.state_id}-${s.id}-${i}`}
                  testID={`repeater-suggest-item-${s.id}`}
                  onPress={() => openDetail(s)}
                  style={({ pressed }) => [
                    styles.suggestRow,
                    { borderTopColor: colors.divider, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <MaterialCommunityIcons name="access-point" size={16} color={colors.brand} />
                  <Text style={[styles.suggestCall, { color: colors.onSurface }]}>{s.call}</Text>
                  <Text style={[styles.suggestLoc, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
                    {s.location}
                  </Text>
                  <Text style={[styles.suggestBand, { color: colors.brand }]}>{s.band || ""}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Radius filter */}
        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.brand} />
            <Text style={[styles.toggleLabel, { color: colors.onSurface }]}>Nur in meiner Nähe</Text>
            <Switch
              testID="repeater-radius-toggle"
              value={nearEnabled}
              onValueChange={toggleNear}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor={colors.surfaceSecondary}
            />
          </View>

          {nearEnabled && (
            <View style={styles.nearBody}>
              {coords ? (
                <>
                  <View style={styles.locActiveRow}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.brand} />
                    <Text testID="repeater-location-label" style={[styles.locActiveText, { color: colors.onSurface }]} numberOfLines={1}>
                      {locLabel}
                    </Text>
                    <Pressable testID="repeater-location-change" onPress={() => setCoords(null)} hitSlop={8}>
                      <Text style={[styles.changeText, { color: colors.brand }]}>ändern</Text>
                    </Pressable>
                  </View>
                  <View style={styles.sliderRow}>
                    <Text style={[styles.radiusValue, { color: colors.brand }]}>{radiusKm} km</Text>
                  </View>
                  <Slider
                    testID="repeater-radius-slider"
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={200}
                    step={1}
                    value={radiusKm}
                    onValueChange={setRadiusKm}
                    minimumTrackTintColor={colors.brandPrimary}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.brandPrimary}
                  />
                  <View style={styles.sliderScale}>
                    <Text style={[styles.scaleText, { color: colors.onSurfaceMuted }]}>1 km</Text>
                    <Text style={[styles.scaleText, { color: colors.onSurfaceMuted }]}>200 km</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.benefit, { color: colors.onSurfaceMuted }]}>
                    Zeigt Repeater in deiner Nähe. Dein Standort bleibt auf dem Gerät.
                  </Text>
                  <Pressable
                    testID="repeater-gps-button"
                    onPress={useGps}
                    disabled={locLoading}
                    style={({ pressed }) => [
                      styles.gpsBtn,
                      { backgroundColor: colors.brandPrimary, opacity: locLoading ? 0.6 : pressed ? 0.85 : 1 },
                    ]}
                  >
                    <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.onBrandPrimary} />
                    <Text style={[styles.gpsText, { color: colors.onBrandPrimary }]}>GPS-Standort verwenden</Text>
                  </Pressable>
                  <Text style={[styles.orText, { color: colors.onSurfaceMuted }]}>oder Ort manuell eingeben</Text>
                  <View style={styles.manualRow}>
                    <TextInput
                      testID="repeater-location-input"
                      value={locText}
                      onChangeText={setLocText}
                      onSubmitEditing={geocode}
                      autoCorrect={false}
                      returnKeyType="search"
                      placeholder="z. B. München"
                      placeholderTextColor={colors.onSurfaceMuted}
                      style={[styles.manualInput, { color: colors.onSurface, borderColor: colors.border }]}
                    />
                    <Pressable
                      testID="repeater-geocode-button"
                      onPress={geocode}
                      disabled={!locText.trim() || locLoading}
                      style={({ pressed }) => [
                        styles.manualBtn,
                        { backgroundColor: colors.brandTertiary, opacity: !locText.trim() || locLoading ? 0.5 : pressed ? 0.85 : 1 },
                      ]}
                    >
                      {locLoading ? (
                        <ActivityIndicator size="small" color={colors.onBrandTertiary} />
                      ) : (
                        <MaterialCommunityIcons name="magnify" size={18} color={colors.onBrandTertiary} />
                      )}
                    </Pressable>
                  </View>
                  {locErr && (
                    <View style={styles.locErrWrap}>
                      <Text style={[styles.locErrText, { color: colors.error }]}>{locErr.msg}</Text>
                      {locErr.blocked && Platform.OS !== "web" && (
                        <Pressable testID="repeater-open-settings" onPress={() => Linking.openSettings()} hitSlop={8}>
                          <Text style={[styles.settingsText, { color: colors.brand }]}>Einstellungen öffnen</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </View>

        {/* Band filter */}
        {bands.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceMuted }]}>BAND</Text>
            <View style={styles.chipRow}>
              {bands.map((b) => {
                const active = selectedBands.includes(b.band);
                return (
                  <Pressable
                    key={b.band}
                    testID={`repeater-band-${b.band}`}
                    onPress={() => toggleBand(b.band)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
                        borderColor: active ? colors.brandPrimary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: active ? colors.onBrandPrimary : colors.onSurface }]}>
                      {b.band}
                    </Text>
                    <Text style={[styles.chipCount, { color: active ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>
                      {b.count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Frequency filter */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurfaceMuted }]}>FREQUENZ</Text>
          <View style={[styles.searchField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="sine-wave" size={20} color={colors.brand} />
            <TextInput
              testID="repeater-freq-input"
              value={freqText}
              onChangeText={(t) => setFreqText(t.replace(/[^0-9.,]/g, ""))}
              keyboardType="decimal-pad"
              placeholder="z. B. 145,600"
              placeholderTextColor={colors.onSurfaceMuted}
              style={[styles.freqInput, { color: colors.onSurface }]}
            />
            <Text style={[styles.unit, { color: colors.brand }]}>MHz</Text>
            {freqText.length > 0 ? (
              <Pressable testID="repeater-freq-clear" onPress={() => setFreqText("")} hitSlop={10}>
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            ) : null}
          </View>
          <Text style={[styles.hint, overlayChip(darkbg), { color: colors.onSurfaceMuted }]}>Toleranz ±0,0125 MHz · Komma oder Punkt.</Text>
        </View>

        {/* Results */}
        {renderResults()}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },

  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: rad.lg,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: fontSize.lg, fontWeight: "600", paddingVertical: 0 },
  suggestBox: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    borderRadius: rad.md,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  suggestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  suggestCall: { fontSize: fontSize.base, fontWeight: "800", fontFamily: monoFont },
  suggestLoc: { flex: 1, fontSize: fontSize.base, fontWeight: "600" },
  suggestBand: { fontSize: fontSize.sm, fontWeight: "800" },

  card: { borderRadius: rad.lg, borderWidth: 1, padding: spacing.lg },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  toggleLabel: { flex: 1, fontSize: fontSize.lg, fontWeight: "700" },
  nearBody: { marginTop: spacing.md, gap: spacing.sm },
  benefit: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: "600" },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 48,
    borderRadius: rad.md,
  },
  gpsText: { fontSize: fontSize.base, fontWeight: "800" },
  orText: { fontSize: fontSize.sm, textAlign: "center", fontWeight: "600" },
  manualRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  manualInput: {
    flex: 1,
    height: 46,
    borderRadius: rad.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  manualBtn: { width: 48, height: 46, borderRadius: rad.md, alignItems: "center", justifyContent: "center" },
  locErrWrap: { gap: 4, marginTop: spacing.xs },
  locErrText: { fontSize: fontSize.sm, fontWeight: "600", lineHeight: 18 },
  settingsText: { fontSize: fontSize.base, fontWeight: "800" },
  locActiveRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  locActiveText: { flex: 1, fontSize: fontSize.base, fontWeight: "700" },
  changeText: { fontSize: fontSize.base, fontWeight: "700" },
  sliderRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xs },
  radiusValue: { fontSize: fontSize.xl, fontWeight: "800", fontFamily: monoFont },
  slider: { width: "100%", height: 36 },
  sliderScale: { flexDirection: "row", justifyContent: "space-between", marginTop: -spacing.xs },
  scaleText: { fontSize: fontSize.sm, fontWeight: "600" },

  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: "800", letterSpacing: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: rad.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.base, fontWeight: "800" },
  chipCount: { fontSize: fontSize.sm, fontWeight: "700" },

  freqInput: { flex: 1, minWidth: 0, fontSize: fontSize.lg, fontWeight: "700", fontFamily: monoFont, paddingVertical: 0 },
  unit: { fontSize: fontSize.base, fontWeight: "800" },
  hint: { fontSize: fontSize.sm, fontWeight: "600" },

  placeholderWrap: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxl },
  placeholderText: { fontSize: fontSize.base, fontWeight: "600", textAlign: "center", paddingHorizontal: spacing.xl, lineHeight: 20 },

  statusWrap: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  statusText: { flex: 1, fontSize: fontSize.base, fontWeight: "600", lineHeight: 20 },

  list: { gap: spacing.md },
  countRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  countText: { fontSize: fontSize.lg, fontWeight: "800" },
  pendingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: rad.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  pendingText: { flex: 1, fontSize: fontSize.sm, fontWeight: "600" },
  refreshText: { fontSize: fontSize.base, fontWeight: "800" },

  repCard: { borderRadius: rad.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  repTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusDot: { width: 12, height: 12, borderRadius: rad.pill },
  repCall: { flex: 1, fontSize: fontSize.lg, fontWeight: "800", fontFamily: monoFont },
  distBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: rad.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  distText: { fontSize: fontSize.sm, fontWeight: "800" },
  countryBadge: { borderRadius: rad.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  countryText: { fontSize: fontSize.sm, fontWeight: "800" },
  repFreqRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.md },
  repFreq: { fontSize: fontSize.xl, fontWeight: "800", fontFamily: monoFont },
  repBand: { fontSize: fontSize.base, fontWeight: "700" },
  repOffset: { fontSize: fontSize.base, fontWeight: "700" },
  repMetaRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs },
  repMeta: { flex: 1, fontSize: fontSize.base, fontWeight: "600", lineHeight: 18 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: rad.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: { fontSize: fontSize.sm, fontWeight: "700" },

  attrWrap: { flexDirection: "row", justifyContent: "center", alignItems: "center", alignSelf: "center", marginTop: spacing.sm },
  attribution: { fontSize: fontSize.sm, textAlign: "center" },
  attrLink: { fontWeight: "800", textDecorationLine: "underline" },
});
