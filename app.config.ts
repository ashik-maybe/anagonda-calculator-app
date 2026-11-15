import { withDangerousMod, withInfoPlist, type ConfigPlugin } from "expo/config-plugins";
import fs from "node:fs";
import path from "node:path";

type Localizations = Record<string, string>;

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Per-locale on-device app label.
 * Android: res/values-<locale>/strings.xml app_name.
 * iOS: <locale>.lproj/InfoPlist.strings CFBundleDisplayName + LSHasLocalizedDisplayName.
 */
const withLocalizedAppName: ConfigPlugin<{
  localizations: Localizations;
}> = (config, { localizations }) => {
  config = withInfoPlist(config, (c) => {
    const infoPlist = (c.modResults.infoPlist ?? {}) as Record<string, unknown>;
    infoPlist.LSHasLocalizedDisplayName = true;
    c.modResults.infoPlist = infoPlist as typeof c.modResults.infoPlist;
    return c;
  });
  config = withDangerousMod(config, [
    "ios",
    (c) => {
      for (const [locale, name] of Object.entries(localizations)) {
        const dir = path.join(c.modRequest.projectRoot, "ios", `${locale}.lproj`);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, "InfoPlist.strings"),
          `"CFBundleDisplayName" = "${name}";\n`,
          "utf8",
        );
      }
      return c;
    },
  ]);
  config = withDangerousMod(config, [
    "android",
    (c) => {
      for (const [locale, name] of Object.entries(localizations)) {
        const dir = path.join(
          c.modRequest.projectRoot,
          "android",
          "app",
          "src",
          "main",
          "res",
          `values-${locale}`,
        );
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, "strings.xml"),
          `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <string name="app_name">${escapeXml(name)}</string>\n</resources>\n`,
          "utf8",
        );
      }
      return c;
    },
  ]);
  return config;
};

export default {
  expo: {
    name: "Ana Gonda Calculator",
    slug: "anagonda-calculator",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "anagondacalculator",
    userInterfaceStyle: "automatic",
    backgroundColor: "#1E6B3C",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anagonda.calculator",
      icon: "./assets/expo.icon",
    },
    android: {
      package: "com.anagonda.calculator",
      adaptiveIcon: {
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
        backgroundColor: "#1E6B3C",
      },
      predictiveBackGestureEnabled: true,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#1E6B3C",
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      ],
      [
        withLocalizedAppName,
        {
          localizations: {
            en: "Ana Gonda Calculator",
            bn: "আনা গন্ডা ক্যালকুলেটর",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
