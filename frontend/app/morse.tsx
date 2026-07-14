import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { ReceiveSection } from "@/src/morse/ReceiveSection";
import { SendSection } from "@/src/morse/SendSection";
import { spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

export default function MorseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  // Frequency & speed are shared: the decoder targets this frequency and seeds
  // its unit from WPM; the sender uses both for live transmission.
  const [freq, setFreq] = useState(700);
  const [wpm, setWpm] = useState(20);

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title="Morsecode – Betrieb"
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      />
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        <ReceiveSection freq={freq} wpm={wpm} />
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <SendSection freq={freq} wpm={wpm} setFreq={setFreq} setWpm={setWpm} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
});
