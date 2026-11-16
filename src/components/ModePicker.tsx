import { SegmentedControl } from "./SegmentedControl";
import { t } from "../lib/i18n";

export type HisabMethod = "glyph" | "chain" | "percent";

const METHODS: readonly HisabMethod[] = ["glyph", "chain", "percent"];

const METHOD_LABEL: Record<HisabMethod, string> = {
  glyph: "hisab_method_glyph",
  chain: "hisab_method_chain",
  percent: "hisab_method_percent",
};

type Props = {
  readonly value: HisabMethod;
  readonly onChange: (key: HisabMethod) => void;
};

export function ModePicker({ value, onChange }: Props) {
  return (
    <SegmentedControl
      accessibilityLabel={t("hisab_mode_method")}
      segments={METHODS.map((key) => ({ key, label: t(METHOD_LABEL[key]) }))}
      value={value}
      onChange={(key) => {
        const next = METHODS.find((m) => m === key);
        if (next) onChange(next);
      }}
    />
  );
}
