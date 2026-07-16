import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const RED = "#D32F2F";
const BLACK = "#1A1A1A";
const WHITE = "#FFFFFF";

/**
 * Vektor-Nachbau des Warnschilds „Senden verboten, nur Empfang!".
 * Komplett aus RN-Views, Vektor-Icons und Text aufgebaut – scharf bei
 * jeder Größe, kein Raster-Asset (ersetzt das ~1,1 MB PNG).
 */
export function NoTransmitSign({ size = 240 }: { size?: number }) {
  const s = size;
  const ring = Math.max(4, s * 0.04);
  const iconR = s * 0.14;
  const iconT = s * 0.15;
  const iconW = s * 0.085;
  const arrow = s * 0.085;
  const title = s * 0.088;
  const caption = s * 0.05;
  const prohSize = s * 0.24;

  return (
    <View
      accessibilityLabel="Senden verboten, nur Empfang! Auf dieser Frequenz ist nur Empfang erlaubt."
      style={[
        styles.ring,
        { width: s, height: s, borderRadius: s / 2, borderWidth: ring, paddingHorizontal: s * 0.03 },
      ]}
    >
      {/* Obere Illustration: verbotener Sender | Empfang vom Turm */}
      <View style={[styles.row, { marginBottom: s * 0.015 }]}>
        {/* Links: Senden verboten */}
        <View style={{ width: s * 0.3, height: prohSize * 1.05, alignItems: "center", justifyContent: "center" }}>
          <MaterialCommunityIcons name="radio-handheld" size={iconR} color={BLACK} />
          <View
            style={{
              position: "absolute",
              width: prohSize,
              height: prohSize,
              borderRadius: prohSize / 2,
              borderWidth: s * 0.022,
              borderColor: RED,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: prohSize,
              height: s * 0.022,
              backgroundColor: RED,
              transform: [{ rotate: "-45deg" }],
            }}
          />
        </View>

        {/* Trenner */}
        <View style={{ width: Math.max(1, s * 0.008), height: prohSize, backgroundColor: BLACK, marginHorizontal: s * 0.015 }} />

        {/* Rechts: Empfang */}
        <View style={styles.rowCenter}>
          <MaterialCommunityIcons name="radio-handheld" size={iconR} color={BLACK} />
          <MaterialCommunityIcons name="arrow-left-bold" size={arrow} color={BLACK} style={{ marginHorizontal: s * 0.005 }} />
          <MaterialCommunityIcons name="access-point" size={iconW} color={BLACK} />
          <MaterialCommunityIcons name="radio-tower" size={iconT} color={BLACK} />
        </View>
      </View>

      {/* Titel */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.title, { color: RED, fontSize: title, lineHeight: title * 1.08 }]}
      >
        Senden verboten,
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.title, { color: BLACK, fontSize: title, lineHeight: title * 1.08 }]}
      >
        nur Empfang!
      </Text>

      {/* Trennlinie */}
      <View style={{ width: s * 0.6, height: Math.max(1, s * 0.008), backgroundColor: BLACK, marginVertical: s * 0.03 }} />

      {/* Bildunterschrift */}
      <View style={styles.rowCenter}>
        <MaterialCommunityIcons name="check-circle" size={s * 0.06} color={BLACK} style={{ marginRight: s * 0.02 }} />
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          style={[styles.caption, { color: BLACK, fontSize: caption, maxWidth: s * 0.66 }]}
        >
          Auf dieser Frequenz ist nur Empfang erlaubt.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderColor: RED, backgroundColor: WHITE, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  rowCenter: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  title: { fontWeight: "900", textAlign: "center", letterSpacing: -0.3 },
  caption: { fontWeight: "700", lineHeight: 14 },
});
