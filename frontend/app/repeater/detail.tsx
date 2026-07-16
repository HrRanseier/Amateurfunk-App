import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
const RB_URL = "https://www.repeaterbook.com";

type Detail = {
  lat?: number;
  lon?: number;
  call?: string;
  location?: string;
  countryCode?: string;
  downlink?: string;
  uplink?: string;
  offset?: string;
  bandwidth?: string;
  sponsor?: string;
  tone?: string;
};

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

export default function RepeaterDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const p = useLocalSearchParams<{
    state_id?: string;
    id?: string;
    call?: string;
    freq?: string;
    location?: string;
    modes?: string;
    tone?: string;
    status?: string;
    offsetDir?: string;
    country?: string;
    countryCode?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  const call = p.call || "—";
  const status = p.status || "unknown";
  const freqNum = p.freq ? parseFloat(p.freq) : NaN;

  const back = () => (router.canGoBack() ? router.back() : router.replace("/repeater"));

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BACKEND}/api/repeater/detail?state_id=${encodeURIComponent(p.state_id ?? "")}&id=${encodeURIComponent(
            p.id ?? "",
          )}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Detail;
        if (alive) setDetail(data);
      } catch {
        if (alive) setError("Details konnten nicht geladen werden.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [p.state_id, p.id]);

  const tone = p.tone || detail?.tone || "";
  const location = detail?.location || p.location || "";
  const lat = detail?.lat;
  const lon = detail?.lon;

  const openMaps = () => {
    if (lat == null || lon == null) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
  };

  const Row = ({ icon, label, value }: { icon: any; label: string; value?: string }) => {
    if (!value) return null;
    return (
      <View style={[styles.row, { borderTopColor: colors.divider }]}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.onSurfaceMuted} />
        <Text style={[styles.rowLabel, { color: colors.onSurfaceMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: colors.onSurface }]}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={`Repeater · ${call}`} onBack={back} />

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview */}
        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
          <View style={styles.headRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(status, colors) }]} />
            <Text style={[styles.call, { color: colors.onSurface }]} numberOfLines={1}>
              {call}
            </Text>
            <View style={[styles.countryBadge, { backgroundColor: colors.brandTertiary }]}>
              <Text style={[styles.countryText, { color: colors.onBrandTertiary }]}>{p.countryCode || p.country}</Text>
            </View>
          </View>
          {isFinite(freqNum) && (
            <Text style={[styles.bigFreq, { color: colors.brand }]}>{freqNum.toFixed(4).replace(".", ",")} MHz</Text>
          )}
          <Text style={[styles.statusPill, { color: statusColor(status, colors) }]}>Status: {statusLabel(status)}</Text>
        </View>

        {loading && (
          <View style={styles.statusWrap}>
            <ActivityIndicator color={colors.brand} />
            <Text style={[styles.statusText, { color: colors.onSurfaceMuted }]}>Details werden geladen …</Text>
          </View>
        )}

        {error && (
          <View style={styles.statusWrap}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.error} />
            <Text testID="repeater-detail-error" style={[styles.statusText, { color: colors.onSurface }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Frequency data */}
        <View testID="repeater-detail" style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.section, { color: colors.brand }]}>FREQUENZDATEN</Text>
          <Row icon="arrow-down-bold" label="Downlink (RX)" value={detail?.downlink ? `${detail.downlink} MHz` : undefined} />
          <Row icon="arrow-up-bold" label="Uplink (TX)" value={detail?.uplink ? `${detail.uplink} MHz` : undefined} />
          <Row icon="swap-vertical" label="Offset" value={detail?.offset ? `${detail.offset} MHz` : undefined} />
          <Row icon="arrow-expand-vertical" label="Ablage" value={p.offsetDir || undefined} />
          <Row icon="tune-vertical" label="Ton / CTCSS" value={tone || undefined} />
          <Row icon="arrow-left-right" label="Bandbreite" value={detail?.bandwidth || undefined} />
          <Row icon="access-point" label="Betriebsart" value={p.modes || undefined} />
        </View>

        {/* Location */}
        {(location || (lat != null && lon != null)) && (
          <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.section, { color: colors.brand }]}>STANDORT</Text>
            <Row icon="map-marker-outline" label="Standort" value={location || undefined} />
            {lat != null && lon != null && (
              <>
                <Row icon="crosshairs-gps" label="Koordinaten" value={`${lat.toFixed(5)}, ${lon.toFixed(5)}`} />
                <Pressable
                  testID="repeater-map-button"
                  onPress={openMaps}
                  style={({ pressed }) => [
                    styles.mapBtn,
                    { backgroundColor: colors.brandTertiary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <MaterialCommunityIcons name="map-search-outline" size={18} color={colors.onBrandTertiary} />
                  <Text style={[styles.mapBtnText, { color: colors.onBrandTertiary }]}>In Karte öffnen</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* Sponsor */}
        {detail?.sponsor ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.section, { color: colors.brand }]}>BETREIBER</Text>
            <Row icon="account-group-outline" label="Sponsor" value={detail.sponsor} />
          </View>
        ) : null}

        <Pressable
          testID="repeater-detail-attribution"
          onPress={() => Linking.openURL(RB_URL)}
          style={styles.attrWrap}
          hitSlop={8}
        >
          <Text style={[styles.attribution, { color: colors.onSurfaceMuted }]}>Daten: </Text>
          <Text style={[styles.attribution, styles.attrLink, { color: colors.brand }]}>RepeaterBook.com</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },

  card: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg },
  headRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusDot: { width: 14, height: 14, borderRadius: radius.pill },
  call: { flex: 1, fontSize: fontSize.xxl, fontWeight: "800", fontFamily: monoFont },
  countryBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  countryText: { fontSize: fontSize.base, fontWeight: "800" },
  bigFreq: { fontSize: fontSize.huge, fontWeight: "800", fontFamily: monoFont, marginTop: spacing.sm },
  statusPill: { fontSize: fontSize.base, fontWeight: "700", marginTop: spacing.xs },

  statusWrap: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.sm },
  statusText: { flex: 1, fontSize: fontSize.base, fontWeight: "600", lineHeight: 20 },

  section: { fontSize: fontSize.sm, fontWeight: "800", letterSpacing: 1, marginBottom: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: fontSize.base, fontWeight: "600", minWidth: 118 },
  rowValue: { flex: 1, textAlign: "right", fontSize: fontSize.base, fontWeight: "800", fontFamily: monoFont },

  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 46,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  mapBtnText: { fontSize: fontSize.base, fontWeight: "800" },

  attrWrap: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.sm },
  attribution: { fontSize: fontSize.sm, textAlign: "center" },
  attrLink: { fontWeight: "800", textDecorationLine: "underline" },
});
