export const ads = {
  enabled: process.env.EXPO_PUBLIC_ADS_ENABLED === "1",
  loadBanner(): void {},
  showInterstitial(): void {},
} as const;
