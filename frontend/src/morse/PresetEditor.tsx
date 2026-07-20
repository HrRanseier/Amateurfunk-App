import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { fontSize, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

// Modal dialog to edit (or create) the text of a preset block. Text may be any
// length; it is stored via the parent. Repeat setting is handled outside.
export function PresetEditor({
  visible,
  index,
  initialText,
  onSave,
  onClose,
}: {
  visible: boolean;
  index: number;
  initialText: string;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [value, setValue] = useState(initialText);

  useEffect(() => {
    if (visible) setValue(initialText);
  }, [visible, initialText]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.brand} />
              <Text style={[styles.title, { color: colors.onSurface }]}>Baustein {index + 1} bearbeiten</Text>
            </View>

            <TextInput
              testID="preset-editor-input"
              value={value}
              onChangeText={setValue}
              multiline
              autoFocus
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="Text eingeben, z. B. CQ CQ DE DJ1IR"
              placeholderTextColor={colors.onSurfaceMuted}
              style={[
                styles.input,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.onSurface },
              ]}
            />

            <View style={styles.row}>
              <Pressable
                testID="preset-editor-cancel"
                onPress={onClose}
                style={[styles.btn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              >
                <Text style={[styles.btnText, { color: colors.onSurface }]}>Abbrechen</Text>
              </Pressable>
              <Pressable
                testID="preset-editor-save"
                onPress={() => onSave(value)}
                style={[styles.btn, { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}
              >
                <Text style={[styles.btnText, { color: colors.onBrandPrimary }]}>Speichern</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: fontSize.lg, fontWeight: "800" },
  input: {
    minHeight: 96,
    maxHeight: 200,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.lg,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: spacing.sm },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontSize: fontSize.base, fontWeight: "800" },
});
