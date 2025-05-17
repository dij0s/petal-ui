export type Indicator = "great" | "ok" | "bad";

export const pelletConfig: Record<Indicator, { color: string; label: string }> =
  {
    great: {
      color: "var(--background-color-indicator-great)",
      label: "Keep being green!",
    },
    ok: {
      color: "var(--background-color-indicator-ok)",
      label: "Try a bit more.",
    },
    bad: {
      color: "var(--background-color-indicator-bad)",
      label: "You could make an effort...",
    },
  };
