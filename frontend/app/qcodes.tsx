import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { QEntry, searchEntries } from "@/src/qcodes/data";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

type Filter = "all" | "qcode" | "abbr";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "qcode", label: "Q-Codes" },
  { id: "abbr", label: "Abkürzungen" },
];

export default function QCodesScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [examOnly, setExamOnly] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const data = useMemo(() => searchEntries(query, filter, examOnly), [query, filter, examOnly]);

  const setChip = (f: Filter) => {
    Haptics.selectionAsync();
    setFilter(f);
  };

  const renderItem = ({ item }: { item: QEntry }) => {
    const warn = !!item.warning;
    const borderColor = warn ? colors.error : colors.border;
    const typeLabel = item.type === "qcode" ? "Q-Code" : "Abkürzung";
    return (
      <View
        testID={`qcode-item-${item.code}`}
        style={[
          styles.card,
          {
            backgroundColor: warn ? (isDark ? "#2A1414" : "#FDECEA") : colors.surfaceSecondary,
            borderColor,
            borderWidth: warn ? 2 : 1,
          },
        ]}
      >
        <View style={styles.cardTop}>
          {warn ? <MaterialCommunityIcons name="alert" size={20} color={colors.error} /> : null}
          <Text style={[styles.code, { color: warn ? colors.error : colors.brand }]}>{item.code}</Text>
          <View style={styles.badges}>
            {item.exam ? (
              <View style={[styles.examBadge, { backgroundColor: colors.brandPrimary }]}>
                <Text style={[styles.examText, { color: colors.onBrandPrimary }]}>Prüfung</Text>
              </View>
            ) : null}
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: item.type === "qcode" ? colors.brandTertiary : colors.surfaceTertiary },
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  { color: item.type === "qcode" ? colors.onBrandTertiary : colors.onSurfaceSecondary },
                ]}
              >
                {typeLabel}
              </Text>
            </View>
          </View>
        </View>

        {item.question ? (
          <View style={styles.line}>
            <Text style={[styles.lineLabel, { color: colors.onSurfaceMuted }]}>Frage</Text>
            <Text style={[styles.lineText, { color: colors.onSurface }]}>{item.question}</Text>
          </View>
        ) : null}

        {item.statement ? (
          <View style={styles.line}>
            {item.type === "qcode" && item.question ? (
              <Text style={[styles.lineLabel, { color: colors.onSurfaceMuted }]}>Aussage</Text>
            ) : null}
            <Text style={[warn ? styles.warnText : styles.lineText, { color: warn ? colors.error : colors.onSurface }]}>
              {item.statement}
            </Text>
          </View>
        ) : null}

        {item.practice ? (
          <View style={[styles.hintRow, { borderTopColor: colors.divider }]}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={15} color={colors.warning} />
            <Text style={[styles.hintText, { color: colors.onSurfaceSecondary }]}>{item.practice}</Text>
          </View>
        ) : null}

        {item.mnemonic ? (
          <View style={styles.hintRow}>
            <MaterialCommunityIcons name="brain" size={15} color={colors.brand} />
            <Text style={[styles.hintText, { color: colors.onSurfaceSecondary }]}>Merkhilfe: {item.mnemonic}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader title="Q-Codes" onBack={back} />

      <View style={styles.controls}>
        <View style={[styles.searchField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.brand} />
          <TextInput
            testID="qcode-search-input"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Code oder Stichwort suchen…"
            placeholderTextColor={colors.onSurfaceMuted}
            style={[styles.searchInput, { color: colors.onSurface }]}
          />
          {query.length > 0 ? (
            <Pressable testID="qcode-search-clear" onPress={() => setQuery("")} hitSlop={10}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.onSurfaceMuted} />
            </Pressable>
          ) : null}
        </View>
        <Text style={[styles.hint, { color: colors.onSurfaceMuted }]}>
          Gezielt nach Code suchen (z. B. QRZ) oder mit Stichwort (z. B. Standort).
        </Text>

        <View style={styles.chipRow}>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                testID={`qcode-filter-${f.id}`}
                onPress={() => setChip(f.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
                    borderColor: active ? colors.brandPrimary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? colors.onBrandPrimary : colors.onSurface }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          testID="qcode-exam-toggle"
          onPress={() => {
            Haptics.selectionAsync();
            setExamOnly((v) => !v);
          }}
          style={styles.examRow}
        >
          <MaterialCommunityIcons name="school-outline" size={18} color={colors.onSurfaceMuted} />
          <Text style={[styles.examLabel, { color: colors.onSurface }]}>Nur prüfungsrelevante anzeigen</Text>
          <Switch
            value={examOnly}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              setExamOnly(v);
            }}
            trackColor={{ false: colors.border, true: colors.brandPrimary }}
            thumbColor={colors.surfaceSecondary}
          />
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text testID="qcode-count" style={[styles.count, { color: colors.onSurfaceMuted }]}>
            {data.length} {data.length === 1 ? "Eintrag" : "Einträge"}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="text-search" size={40} color={colors.onSurfaceMuted} />
            <Text testID="qcode-empty" style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
              Kein Eintrag gefunden.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  controls: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: fontSize.lg, fontWeight: "600", paddingVertical: 0 },
  hint: { fontSize: fontSize.sm, fontWeight: "600", lineHeight: 16 },
  chipRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  chip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSize.base, fontWeight: "800" },
  examRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  examLabel: { flex: 1, fontSize: fontSize.base, fontWeight: "600" },

  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.md },
  count: { fontSize: fontSize.sm, fontWeight: "700", marginBottom: spacing.xs },

  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  code: { flex: 1, fontSize: fontSize.xl, fontWeight: "800", fontFamily: monoFont, letterSpacing: 0.5 },
  badges: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  examBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  examText: { fontSize: fontSize.sm, fontWeight: "800" },
  typeBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  typeText: { fontSize: fontSize.sm, fontWeight: "800" },

  line: { gap: 1 },
  lineLabel: { fontSize: fontSize.sm, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  lineText: { fontSize: fontSize.base, fontWeight: "600", lineHeight: 20 },
  warnText: { fontSize: fontSize.base, fontWeight: "800", lineHeight: 20 },

  hintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 0,
  },
  hintText: { flex: 1, fontSize: fontSize.sm, fontWeight: "600", lineHeight: 18 },

  emptyWrap: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxl },
  emptyText: { fontSize: fontSize.base, fontWeight: "600" },
});
