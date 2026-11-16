import { Modal, Pressable, ScrollView } from "react-native";
import glossary from "../data/glossary.json";
import { useThemeColors, radius, spacing } from "../constants/theme";
import { t } from "../lib/i18n";
import { categoryLabelKey, type Term } from "../lib/terms";
import { BnText } from "./BnText";

export type TermSheetProps = { termId: string | null; onClose: () => void };

export function TermSheet({ termId, onClose }: TermSheetProps) {
  const { colors } = useThemeColors();
  const term = termId
    ? (glossary.terms.find((t) => t.id === termId) as Term | undefined)
    : undefined;
  const categoryLabel = term ? t(categoryLabelKey(term.category)) : "";
  const closeLabel = t("close");
  return (
    <Modal
      visible={termId !== null && !!term}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        style={{
          flex: 1,
          backgroundColor: colors.scrim,
          opacity: 0.92,
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable
          accessibilityRole="summary"
          onPress={() => {}}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            padding: spacing[4],
            gap: spacing[2],
            maxHeight: "70%",
          }}
        >
          {term ? (
            <ScrollView contentContainerStyle={{ gap: spacing[2] }}>
              <BnText variant="title" style={{ color: colors.onSurface }}>
                {term.term_bn}
              </BnText>
              <BnText variant="caption" style={{ color: colors.onSurfaceVariant }}>
                {term.term_en} · {term.code}
              </BnText>
              <BnText variant="caption" style={{ color: colors.primary }}>
                {categoryLabel}
              </BnText>
              {term.aliases && term.aliases.length > 0 ? (
                <BnText variant="caption" style={{ color: colors.onSurfaceVariant }}>
                  {t("glossary_aliases")}: {term.aliases.join(", ")}
                </BnText>
              ) : null}
              <BnText variant="body" style={{ color: colors.onSurface }}>
                {term.def_bn}
              </BnText>
              <BnText variant="caption" style={{ color: colors.onSurfaceVariant }}>
                {term.def_en}
              </BnText>
            </ScrollView>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={onClose}
            style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}
          >
            <BnText variant="label" style={{ color: colors.primary }}>
              {closeLabel}
            </BnText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
