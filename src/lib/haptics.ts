import * as Haptics from "expo-haptics";

let enabled = true;
/** Settings screen wires this; default on. */
export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}
export function hapticsEnabled(): boolean {
  return enabled;
}
const safe = (fn: () => Promise<void>): void => {
  if (!enabled) return;
  try {
    void fn().catch(() => {
      // haptics unavailable (web / simulator) — never crash the flow
    });
  } catch {
    // never crash the flow on haptics
  }
};
export const hapticTick = (): void => safe(() => Haptics.selectionAsync());
export const hapticSuccess = (): void =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const hapticWarning = (): void =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
export const hapticError = (): void =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
