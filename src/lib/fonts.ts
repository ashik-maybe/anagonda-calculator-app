import { useFonts } from "expo-font";
export const fontFamilies = {
  bengali: "NotoSansBengali",
  latin: "NotoSans",
  display: "BalooDa2",
} as const;
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    NotoSansBengali: require("../../assets/fonts/NotoSansBengali[wght].ttf"),
    NotoSans: require("../../assets/fonts/NotoSans[wght].ttf"),
    BalooDa2: require("../../assets/fonts/BalooDa2[wght].ttf"),
  });
  return loaded;
}
