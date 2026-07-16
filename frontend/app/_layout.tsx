import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastProvider } from "@/src/components/Toast";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
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

  useEffect(() => {
    if ((loaded || error) && ready) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, ready]);

  // Gate the UI until BOTH icon fonts and the saved design choice are ready,
  // so the correct theme/background is applied before the first render.
  if ((!loaded && !error) || !ready) return null;

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
