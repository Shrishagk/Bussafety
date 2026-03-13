/**
 * SafeRide AI — Design Tokens
 * Single source of truth for all colors, spacing, typography.
 * Import as: import { tokens } from '@/theme/tokens'
 */
export const tokens = {
  // ── Brand colours ──────────────────────────────────────────────────────────
  colors: {
    primary:        "#1A56DB",   // SafeRide blue
    primaryLight:   "#EBF5FF",
    primaryDark:    "#1E429F",

    secondary:      "#7E3AF2",   // AI/ML purple accent

    // Risk palette (green → yellow → orange → red)
    riskLow:        "#0E9F6E",   // green
    riskMedium:     "#D97706",   // amber
    riskHigh:       "#E3702E",   // orange-red
    riskCritical:   "#E02424",   // red

    // Backgrounds
    bg:             "#F9FAFB",
    bgCard:         "#FFFFFF",
    bgDark:         "#111827",
    bgModal:        "rgba(0,0,0,0.55)",

    // Text
    textPrimary:    "#111827",
    textSecondary:  "#6B7280",
    textInverse:    "#FFFFFF",
    textMuted:      "#9CA3AF",

    // Borders / dividers
    border:         "#E5E7EB",
    divider:        "#F3F4F6",

    // Status
    success:        "#057A55",
    warning:        "#B45309",
    error:          "#C81E1E",
    info:           "#1C64F2",

    // Map overlay
    heatHigh:       "rgba(220,38,38,0.45)",
    heatMed:        "rgba(245,158,11,0.35)",
    heatLow:        "rgba(16,185,129,0.25)",
  },

  // ── Spacing ────────────────────────────────────────────────────────────────
  spacing: {
    xs:   4,
    sm:   8,
    md:   16,
    lg:   24,
    xl:   32,
    xxl:  48,
  },

  // ── Border radii ───────────────────────────────────────────────────────────
  radii: {
    sm:   6,
    md:   12,
    lg:   20,
    pill: 999,
  },

  // ── Typography ─────────────────────────────────────────────────────────────
  fonts: {
    regular: "System",
    bold:    "System",
  },
  fontSizes: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   18,
    xl:   22,
    xxl:  28,
    hero: 34,
  },
  fontWeights: {
    regular:  "400" as const,
    medium:   "500" as const,
    semibold: "600" as const,
    bold:     "700" as const,
    heavy:    "800" as const,
  },

  // ── Shadows ────────────────────────────────────────────────────────────────
  shadows: {
    sm: {
      shadowColor:   "#000",
      shadowOffset:  { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius:  2,
      elevation:     2,
    },
    md: {
      shadowColor:   "#000",
      shadowOffset:  { width: 0, height: 3 },
      shadowOpacity: 0.10,
      shadowRadius:  6,
      elevation:     4,
    },
    lg: {
      shadowColor:   "#000",
      shadowOffset:  { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius:  12,
      elevation:     8,
    },
  },

  // ── Z-index ────────────────────────────────────────────────────────────────
  zIndex: {
    base:    0,
    card:    10,
    overlay: 100,
    modal:   200,
    toast:   300,
  },
};

// ── Risk-level helpers ────────────────────────────────────────────────────────
export type RiskLevel = "low" | "medium" | "high" | "critical";

export function riskColor(level: RiskLevel): string {
  return {
    low:      tokens.colors.riskLow,
    medium:   tokens.colors.riskMedium,
    high:     tokens.colors.riskHigh,
    critical: tokens.colors.riskCritical,
  }[level] ?? tokens.colors.riskLow;
}

export function riskLabel(score: number): RiskLevel {
  if (score < 0.3) return "low";
  if (score < 0.6) return "medium";
  if (score < 0.8) return "high";
  return "critical";
}

export function riskEmoji(level: RiskLevel): string {
  return { low: "🟢", medium: "🟡", high: "🟠", critical: "🔴" }[level];
}
