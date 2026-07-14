import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontSize, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

type ToastFn = (message: string) => void;

const ToastContext = createContext<ToastFn>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished) setMessage(null);
      },
    );
  }, [opacity]);

  const show = useCallback<ToastFn>(
    (msg) => {
      setMessage(msg);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(hide, 2000);
    },
    [hide, opacity],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message !== null && (
        <Animated.View
          testID="app-toast"
          pointerEvents="none"
          style={[
            styles.toast,
            { bottom: insets.bottom + spacing.xxl, backgroundColor: colors.brandPrimary, opacity },
          ]}
        >
          <Text testID="app-toast-text" style={[styles.text, { color: colors.onBrandPrimary }]}>
            {message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  text: {
    fontSize: fontSize.base,
    fontWeight: "700",
    textAlign: "center",
  },
});
