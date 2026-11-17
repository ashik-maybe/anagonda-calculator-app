# আনা-গন্ডা ক্যালকুলেটর (Ana-Gonda Calculator)

> ১০ আনা = কত শতাংশ? — উত্তর পকেটেই।

A Bengali land calculator for Bangladesh: exact-fraction shares in the 16-আনা system,
land measurement, multi-owner বণ্টন, বিপরীত decomposition, and an offline unit
encyclopedia — bn/en, dark mode, zero ads, zero network, zero accounts.

## Features

- **হিস্যা (Hisab)** — ana/gonda/kora/kranti/til shares as exact BigInt rationals; the
  deed-format result card shows the total as a fraction, never a rounded decimal.
- **বিপরীত (Reverse)** — total land → greedy 16-ana decomposition for the document.
- **বণ্টন (Split)** — multi-owner ledger with live share bars; Σ≠১৬ আনা blocks in red.
- **পরিমাপ (Measure)** — 7 shapes on a shared symbolic engine (exact √, π kept symbolic).
- **আরও (More)** — unit encyclopedia (cited, live custom কাঠা/বিঘা rates), খতিয়ান glossary
  with the দলিল symbol guide (⁄ ৵ ৶ ৷ ৸ ৴ …), licenses, about, settings, history.
- Custom কাঠা/বিঘা rates persisted on-device; settings (theme/locale/haptics) persisted.

Everything runs offline in the app binary. No ads, no tracking, no OTA, no permissions
beyond storage for your own history/rates/settings.

## Commands (bun)

```bash
bun install            # or: npm install
bun run start          # expo start (dev server)
bun run lint           # oxlint + WCAG contrast gate (scripts/contrast-check.mjs)
bun run format:check   # oxfmt --check
bunx tsc --noEmit      # typecheck
bun test               # 174 tests / 821 asserts incl. engine golden vectors
bunx expo-doctor       # dependency/config diagnostics
bunx expo prebuild --no-install
```

## Layout

```
src/app/            Expo Router routes (tabs: হোম · হিসাব · পরিমাপ · আরও + stack screens)
src/lib/            engines: fraction (BigInt rational) · units · share · shapes ·
                    decomposition · digits · i18n · storage · settings · haptics
src/data/           units.json (cited) · glossary.json · ofl.ts (verbatim license)
src/components/     TonalButton · InputCard · SegmentedControl · ResultCard · …
src/i18n/           bn.json · en.json (content lives here; bn mode = Bangla digits)
src/constants/      theme.ts (tokens + ThemePreference store)
assets/fonts/       Noto Sans Bengali · Noto Sans · Baloo Da 2 (SIL OFL — see LICENSES)
```

Rules: English identifiers; Bengali only in `src/i18n/*.json` + rendered UI; parsers accept
both digit sets; inline errors only (no alerts); 48dp touch targets; every `Pressable`
carries an accessibility role/label; token contrast ≥ 4.5:1 in both schemes (gated by
`scripts/contrast-check.mjs`).

## Privacy

Privacy policy (bilingual, hosted on GitHub Pages): https://ashik-maybe.github.io/anagonda-app-privacy/
Source: https://github.com/ashik-maybe/anagonda-app-privacy

## License

App code: MIT. Fonts: SIL Open Font License 1.1 (full text embedded in-app under
আরও → লাইসেন্স, verbatim in `src/data/ofl.ts`). Third-party licenses are listed on the
same screen; only actually-bundled dependencies are named.
