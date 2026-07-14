import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToast } from "@/src/components/Toast";
import { MorseAudio, MorseAudioHandle } from "@/src/morse/MorseAudio";
import { MorseHeader } from "@/src/morse/MorseHeader";
import { SettingsSheet } from "@/src/morse/SettingsSheet";
import { useMorseReceiver } from "@/src/morse/useMorseReceiver";
import { SendOutputs, useMorseSender } from "@/src/morse/useMorseSender";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

export default function MorseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  // Shared controls (used by both receive + send).
  const [freq, setFreq] = useState(700);
  const [wpm, setWpm] = useState(20);
  const [outputs, setOutputs] = useState<SendOutputs>({ tone: true, light: false, vibe: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  const [camPerm, requestCamPerm] = useCameraPermissions();
  const audioRef = useRef<MorseAudioHandle | null>(null);

  const receiver = useMorseReceiver(freq, wpm);
  const sender = useMorseSender({
    freq,
    wpm,
    outputs,
    audioRef,
    setTorch: setTorchOn,
    camGranted: !!camPerm?.granted,
  });

  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [receiver.transcript]);

  const toggleOutput = async (key: keyof SendOutputs) => {
    Haptics.selectionAsync();
    if (key === "light" && !outputs.light && !camPerm?.granted) {
      const res = await requestCamPerm();
      if (!res.granted) {
        toast("Kamerazugriff für Licht nötig");
        return;
      }
    }
    setOutputs((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* ZONE 1: fixed header */}
        <MorseHeader
          title="Morsecode – Betrieb"
          listening={receiver.listening}
          onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          onToggleMic={receiver.toggle}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* ZONE 2: scrollable transcript (fills available space) */}
        <View style={styles.middle}>
          {receiver.status === "unavailable" && bannerVisible && (
            <View
              testID="receive-unavailable-notice"
              style={[styles.banner, { backgroundColor: colors.surfaceSecondary, borderColor: colors.warning }]}
            >
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.warning} />
              <Text numberOfLines={1} style={[styles.bannerText, { color: colors.onSurface }]}>
                Live-Dekodierung nur im veröffentlichten Build
              </Text>
              <Pressable testID="banner-dismiss-button" onPress={() => setBannerVisible(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={16} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
          )}

          {receiver.status === "denied" && (
            <View style={[styles.banner, { backgroundColor: colors.surfaceSecondary, borderColor: colors.error }]}>
              <MaterialCommunityIcons name="microphone-off" size={16} color={colors.error} />
              <Text numberOfLines={1} style={[styles.bannerText, { color: colors.onSurface }]}>
                Mikrofonzugriff verweigert
              </Text>
              <Pressable testID="mic-open-settings-button" onPress={() => Linking.openSettings()} hitSlop={8}>
                <Text style={[styles.bannerLink, { color: colors.brand }]}>Einstellungen</Text>
              </Pressable>
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.transContent}
            showsVerticalScrollIndicator={false}
          >
            {receiver.transcript.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="waveform" size={44} color={colors.onSurfaceMuted} />
                <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
                  {receiver.listening ? "Warte auf Morsetöne ..." : "Empfangene Zeichen erscheinen hier"}
                </Text>
              </View>
            ) : (
              <Text testID="receive-transcript" style={[styles.transcriptText, { color: colors.brand }]}>
                {receiver.transcript}
              </Text>
            )}
          </ScrollView>
        </View>

        {/* ZONE 3: fixed footer (stays above keyboard) */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surfaceSecondary,
              borderTopColor: colors.divider,
              paddingBottom: insets.bottom + spacing.sm,
            },
          ]}
        >
          <View style={styles.metaRow}>
            <Text testID="queue-count" style={[styles.queueText, { color: colors.onSurfaceMuted }]}>
              {sender.queueCount} in Warteschlange
            </Text>
            <Pressable testID="send-clear-button" onPress={sender.clear} hitSlop={8}>
              <Text style={[styles.resetLink, { color: colors.brand }]}>Reset</Text>
            </Pressable>
          </View>

          <Text testID="send-preview" numberOfLines={1} style={styles.preview}>
            {sender.fullText.length === 0 ? (
              <Text style={{ color: colors.onSurfaceMuted, fontFamily: monoFont }}>Sende-Vorschau …</Text>
            ) : (
              <>
                <Text style={{ color: colors.onSurfaceMuted, fontFamily: monoFont }}>{sender.sentText}</Text>
                {sender.onAir != null && (
                  <Text
                    style={{
                      color: colors.brand,
                      fontWeight: "800",
                      textDecorationLine: "underline",
                      fontFamily: monoFont,
                    }}
                  >
                    {sender.onAir}
                  </Text>
                )}
                <Text style={{ color: colors.onSurfaceMuted, opacity: 0.5, fontFamily: monoFont }}>
                  {sender.pending}
                </Text>
              </>
            )}
          </Text>

          <TextInput
            testID="send-text-input"
            value={sender.fullText}
            onChangeText={sender.onChangeText}
            placeholder="Text tippen …"
            placeholderTextColor={colors.onSurfaceMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.onSurface },
            ]}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Hidden hardware outputs for sending */}
      <MorseAudio ref={audioRef} />
      {camPerm?.granted && <CameraView style={styles.hiddenCam} facing="back" enableTorch={torchOn} />}

      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        freq={freq}
        wpm={wpm}
        setFreq={setFreq}
        setWpm={setWpm}
        outputs={outputs}
        onToggleOutput={toggleOutput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  hiddenCam: { width: 1, height: 1, position: "absolute", opacity: 0, top: -10, left: -10 },
  middle: { flex: 1, paddingHorizontal: spacing.lg },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  bannerText: { flex: 1, fontSize: fontSize.sm },
  bannerLink: { fontSize: fontSize.sm, fontWeight: "700" },
  transContent: { flexGrow: 1, paddingVertical: spacing.md },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.xxxl },
  emptyText: { fontSize: fontSize.base },
  transcriptText: { fontSize: fontSize.xxl, fontWeight: "700", letterSpacing: 2, lineHeight: 34, fontFamily: monoFont },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  queueText: { fontSize: fontSize.sm, fontWeight: "600" },
  resetLink: { fontSize: fontSize.sm, fontWeight: "700" },
  preview: { fontSize: fontSize.base, letterSpacing: 1, minHeight: 20 },
  input: {
    minHeight: 48,
    maxHeight: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.lg,
    marginTop: spacing.xs,
  },
});
