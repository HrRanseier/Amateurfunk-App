import { Stack } from "expo-router";
import { Asset } from "expo-asset";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { LogBox, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastProvider } from "@/src/components/Toast";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { BACKGROUNDS } from "@/src/theme/backgrounds";
import { DesignProvider, useDesign } from "@/src/theme/design";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

function RootInner() {
  const [loaded, error] = useIconFonts();
  const scheme = useColorScheme();
  const { mode, ready } = useDesign();
  const darkbg = mode === "darkbg";
  const dark = darkbg || scheme === "dark";

  // Preload & decode ALL 8 dark-background images into memory before the UI is
  // shown, so switching to "Dunkler Hintergrund" never pops-in a late image.
  // Done regardless of the currently active design mode.
  const [bgReady, setBgReady] = useState(false);
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setBgReady(true);
      }
    };
    Asset.loadAsync(Object.values(BACKGROUNDS)).catch(() => {}).finally(finish);
    // Safety net: never let a slow/stalled download block the splash forever
    // (e.g. on a poor mobile connection through the Expo Go tunnel).
    const t = setTimeout(finish, 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if ((loaded || error) && ready && bgReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, ready, bgReady]);

  // Gate the UI until icon fonts, the saved design choice AND all background
  // images are ready, so the correct theme/background is applied on the first
  // render without a decode delay.
  if ((!loaded && !error) || !ready || !bgReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ToastProvider>
            <StatusBar style={dark ? "light" : "dark"} />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: {
                  backgroundColor: dark ? "#121212" : "#F5F5F5",
                },
              }}
            />
          </ToastProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <DesignProvider>
      <RootInner />
    </DesignProvider>
  );
}
