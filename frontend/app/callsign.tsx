import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { WebView } from "react-native-webview";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

type CallData = {
  name?: string;
  qth?: string;
  country?: string;
  grid?: string;
  cq?: string;
  itu?: string;
};

type Status = "idle" | "loading" | "ok" | "notfound" | "error" | "fallback" | "webnotice";

const ROWS: { key: keyof CallData; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }[] = [
  { key: "name", label: "Name", icon: "account-outline" },
  { key: "qth", label: "Ort / QTH", icon: "map-marker-outline" },
  { key: "country", label: "Land", icon: "flag-outline" },
  { key: "grid", label: "Grid-Locator", icon: "grid" },
  { key: "cq", label: "CQ-Zone", icon: "earth" },
  { key: "itu", label: "ITU-Zone", icon: "radio-tower" },
];

// Injected into the hidden WebView after the HamQTH page loads. Detects the
// "not found" notice, otherwise reads the fixed <td class="infoDesc"> label/value
// pairs and reports back ONLY the six wanted fields (address/date/activity/social
// rows are never mapped). Any failure -> {status:'empty'} so RN can fall back.
const EXTRACT_JS = `
(function(){
  function send(o){ try{ window.ReactNativeWebView.postMessage(JSON.stringify(o)); }catch(e){} }
  try {
    var txt = document.body ? (document.body.innerText || document.body.textContent || '') : '';
    if (txt.indexOf('Callsign not found in the database') !== -1){ send({status:'notfound'}); return; }
    var cells = document.querySelectorAll('td.infoDesc');
    var r = {};
    for (var i=0;i<cells.length;i++){
      var label = (cells[i].textContent||'').replace(/[\\s:\\u00a0]+/g,' ').trim().toLowerCase();
      var vtd = cells[i].nextElementSibling;
      var val = vtd ? (vtd.textContent||'').replace(/\\s+/g,' ').trim() : '';
      if (!val) continue;
      if (label.indexOf('name')===0 && !r.name) r.name=val;
      else if (label.indexOf('qth')===0 && !r.qth) r.qth=val;
      else if (label.indexOf('country')===0 && !r.country) r.country=val;
      else if (label.indexOf('grid')===0 && !r.grid) r.grid=val;
      else if (label.indexOf('cq')===0 && !r.cq) r.cq=val;
      else if (label.indexOf('itu')===0 && !r.itu) r.itu=val;
    }
    if (r.name||r.qth||r.country||r.grid||r.cq||r.itu) send({status:'ok', data:r});
    else send({status:'empty'});
  } catch(e){ send({status:'empty'}); }
})();
true;
`;

// Fallback: keep the WebView visible but isolate the base info block (#callInfo),
// drop the address column (2nd .col-sm-3), and strip navigation, ads and footer.
const FALLBACK_JS = `
(function(){
  try{
    var ci = document.getElementById('callInfo');
    var style = document.createElement('style');
    style.innerHTML = 'body{margin:0!important;padding:12px!important;font-family:-apple-system,Roboto,sans-serif;background:#fff;color:#111;}'
      + 'table{width:100%!important;border-collapse:collapse;} td{padding:3px 6px!important;} a{color:#2E7D32;}'
      + '.navbar,nav,ins,.adsbygoogle,footer,script{display:none!important;}';
    if (document.head) document.head.appendChild(style);
    if (ci && document.body){
      var cols = ci.querySelectorAll('.col-sm-3');
      if (cols.length >= 2 && cols[1]) cols[1].style.display='none';
      document.body.innerHTML='';
      document.body.appendChild(style);
      document.body.appendChild(ci);
    }
  }catch(e){}
})();
true;
`;

export default function CallsignScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<CallData | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isWeb = Platform.OS === "web";
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => clearTimer, []);

  const runSearch = useCallback(() => {
    const call = input.trim();
    if (!call) return;
    Keyboard.dismiss();
    Haptics.selectionAsync();
    setData(null);
    setQuery(call);
    clearTimer();
    if (isWeb) {
      setStatus("webnotice");
      return;
    }
    setStatus("loading");
    setReloadKey((k) => k + 1);
    // Safety net: if the page never reports back, switch to the visible fallback.
    timerRef.current = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "fallback" : s));
      setReloadKey((k) => k + 1);
    }, 12000);
  }, [input, isWeb]);

  const onMessage = (raw: string) => {
    let msg: { status: string; data?: CallData } | null = null;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (!msg) return;
    clearTimer();
    if (msg.status === "ok" && msg.data) {
      setData(msg.data);
      setStatus("ok");
    } else if (msg.status === "notfound") {
      setStatus("notfound");
    } else {
      // empty / error -> show the visible cleaned-up fallback view instead
      setStatus("fallback");
      setReloadKey((k) => k + 1);
    }
  };

  const uri = query ? `https://www.hamqth.com/${query.toLowerCase()}` : undefined;
  const showWebView = !isWeb && !!uri && (status === "loading" || status === "fallback");

  const renderResult = () => {
    if (status === "idle") {
      return (
        <View style={styles.statusWrap}>
          <MaterialCommunityIcons name="card-account-details-outline" size={26} color={colors.onSurfaceMuted} />
          <Text style={[styles.statusText, { color: colors.onSurfaceMuted }]}>
            Rufzeichen eingeben und suchen
          </Text>
        </View>
      );
    }
    if (status === "webnotice") {
      return (
        <View style={styles.statusWrap}>
          <MaterialCommunityIcons name="information-outline" size={26} color={colors.warning} />
          <Text testID="callsign-web-notice" style={[styles.statusText, { color: colors.onSurface }]}>
            Die Live-Suche funktioniert nur in der mobilen App (Expo Go / veröffentlichter Build), nicht in der Web-Vorschau.
          </Text>
        </View>
      );
    }
    if (status === "loading") {
      return (
        <View style={styles.statusWrap}>
          <ActivityIndicator color={colors.brand} />
          <Text style={[styles.statusText, { color: colors.onSurfaceMuted }]}>Suche läuft …</Text>
        </View>
      );
    }
    if (status === "notfound") {
      return (
        <View style={styles.statusWrap}>
          <MaterialCommunityIcons name="account-question-outline" size={26} color={colors.warning} />
          <Text testID="callsign-notfound" style={[styles.statusText, { color: colors.onSurface }]}>
            Rufzeichen nicht gefunden
          </Text>
        </View>
      );
    }
    if (status === "error") {
      return (
        <View style={styles.statusWrap}>
          <MaterialCommunityIcons name="alert-circle-outline" size={26} color={colors.error} />
          <Text style={[styles.statusText, { color: colors.onSurface }]}>
            Verbindungsfehler. Bitte erneut versuchen.
          </Text>
        </View>
      );
    }
    if (status === "ok" && data) {
      return (
        <View testID="callsign-result" style={styles.rows}>
          <Text style={[styles.resultCall, { color: colors.brand }]}>{query}</Text>
          {ROWS.map((row) => {
            const value = data[row.key];
            if (!value) return null;
            return (
              <View key={row.key} testID={`callsign-row-${row.key}`} style={[styles.row, { borderBottomColor: colors.divider }]}>
                <MaterialCommunityIcons name={row.icon} size={18} color={colors.onSurfaceMuted} style={styles.rowIcon} />
                <Text style={[styles.rowLabel, { color: colors.onSurfaceMuted }]}>{row.label}</Text>
                <Text
                  style={[
                    styles.rowValue,
                    { color: colors.onSurface },
                    (row.key === "grid" || row.key === "cq" || row.key === "itu") && styles.rowValueMono,
                  ]}
                >
                  {value}
                </Text>
              </View>
            );
          })}
          <Text style={[styles.source, { color: colors.onSurfaceMuted }]}>Quelle: hamqth.com</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title="Rufzeichen"
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      />

      {status === "fallback" ? (
        <View style={styles.flex}>
          <View style={[styles.fallbackBar, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border }]}>
            <MaterialCommunityIcons name="web" size={18} color={colors.onSurfaceMuted} />
            <Text style={[styles.fallbackText, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
              Vereinfachte Webansicht · {query}
            </Text>
            <Pressable testID="callsign-fallback-close" onPress={() => setStatus("idle")} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={22} color={colors.onSurface} />
            </Pressable>
          </View>
          {showWebView && (
            <WebView
              key={reloadKey}
              testID="callsign-webview-visible"
              source={{ uri }}
              originWhitelist={["*"]}
              javaScriptEnabled
              injectedJavaScript={FALLBACK_JS}
              style={styles.flex}
              onError={() => setStatus("error")}
            />
          )}
        </View>
      ) : (
        <KeyboardAwareScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bottomOffset={spacing.xl}
        >
          {/* Search input */}
          <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="card-account-details-outline" size={24} color={colors.onSurfaceMuted} />
              <TextInput
                testID="callsign-input"
                value={input}
                onChangeText={(t) => setInput(t.toUpperCase().replace(/[^A-Z0-9/]/g, ""))}
                onSubmitEditing={runSearch}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                placeholder="z. B. DL5XYZ"
                placeholderTextColor={colors.onSurfaceMuted}
                style={[styles.input, { color: colors.onSurface }]}
              />
            </View>
            <Pressable
              testID="callsign-search-button"
              onPress={runSearch}
              disabled={!input.trim()}
              style={({ pressed }) => [
                styles.searchBtn,
                {
                  backgroundColor: colors.brandPrimary,
                  opacity: !input.trim() ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons name="magnify" size={20} color={colors.onBrandPrimary} />
              <Text style={[styles.searchText, { color: colors.onBrandPrimary }]}>Suchen</Text>
            </Pressable>
          </View>

          {/* Result / status */}
          <View style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            {renderResult()}
          </View>

          {/* Hidden extraction WebView (native only) */}
          {showWebView && (
            <View style={styles.hidden} pointerEvents="none">
              <WebView
                key={reloadKey}
                testID="callsign-webview-hidden"
                source={{ uri }}
                originWhitelist={["*"]}
                javaScriptEnabled
                injectedJavaScript={EXTRACT_JS}
                onMessage={(e) => onMessage(e.nativeEvent.data)}
                onError={() => setStatus("error")}
              />
            </View>
          )}
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },

  card: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.md },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  input: { flex: 1, height: 48, fontSize: fontSize.xxl, fontWeight: "700", fontFamily: monoFont, paddingVertical: 0 },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 50,
    borderRadius: radius.md,
  },
  searchText: { fontSize: fontSize.lg, fontWeight: "800" },

  resultCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, minHeight: 90, justifyContent: "center" },
  statusWrap: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.xs },
  statusText: { flex: 1, fontSize: fontSize.base, fontWeight: "600", lineHeight: 20 },

  rows: { gap: 0 },
  resultCall: { fontSize: fontSize.huge, fontWeight: "800", fontFamily: monoFont, marginBottom: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { width: 20 },
  rowLabel: { width: 110, fontSize: fontSize.sm, fontWeight: "600" },
  rowValue: { flex: 1, fontSize: fontSize.lg, fontWeight: "700", textAlign: "right" },
  rowValueMono: { fontFamily: monoFont },
  source: { fontSize: fontSize.sm, marginTop: spacing.md, textAlign: "right" },

  fallbackBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  fallbackText: { flex: 1, fontSize: fontSize.base, fontWeight: "600" },

  hidden: { width: 1, height: 1, position: "absolute", opacity: 0, top: -10, left: -10 },
});
