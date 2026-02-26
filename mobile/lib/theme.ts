export const colors = {
  bg: "#0f172a",
  bgCard: "#1e293b",
  bgInput: "#334155",
  border: "rgba(6, 182, 212, 0.2)",
  borderActive: "rgba(6, 182, 212, 0.5)",
  cyan: "#06b6d4",
  cyanDark: "#0e7490",
  white: "#ffffff",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  green: "#22c55e",
  red: "#ef4444",
  amber: "#f59e0b",
  purple: "#a855f7",
};

export const fonts = {
  regular: { fontSize: 14, color: colors.text },
  small: { fontSize: 12, color: colors.textMuted },
  heading: { fontSize: 22, fontWeight: "700" as const, color: colors.white },
  subheading: { fontSize: 16, fontWeight: "600" as const, color: colors.white },
};
