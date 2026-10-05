export const CARD_GRADIENTS = [
  { id: "forest", colors: ["#1a2e1a", "#0f1f0f"] },
  { id: "navy", colors: ["#1e3a5f", "#0d1b2e"] },
  { id: "gold", colors: ["#c4a35a", "#8a6232"] },
  { id: "slate", colors: ["#9ca3af", "#4b5563"] },
];

export const CARD_FONTS = [
  { id: "Inter", label: "Inter", family: "Inter, sans-serif" },
  {
    id: "Playfair",
    label: "Playfair",
    family: '"Playfair Display", Georgia, serif',
  },
  { id: "Poppins", label: "Poppins", family: "Poppins, sans-serif" },
];

export const DEFAULT_CARD_STYLE = {
  cardColorStart: "#1a2e1a",
  cardColorEnd: "#0f1f0f",
  cardGradientAngle: 135,
  cardFont: "Inter",
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function normalizeHex(value) {
  const color = String(value || "").trim();
  return HEX_COLOR.test(color) ? color.toLowerCase() : "";
}

export function clampGradientAngle(angle) {
  const value = Number(angle);
  if (!Number.isFinite(value)) return 135;
  return Math.max(0, Math.min(360, Math.round(value)));
}

export function cardGradientCss(start, end, angle = 135) {
  const safeStart = normalizeHex(start) || DEFAULT_CARD_STYLE.cardColorStart;
  const safeEnd = normalizeHex(end) || DEFAULT_CARD_STYLE.cardColorEnd;
  const safeAngle = clampGradientAngle(angle);
  return `linear-gradient(${safeAngle}deg, ${safeStart} 0%, ${safeEnd} 100%)`;
}

export function resolveCardColors(style) {
  const start = normalizeHex(style?.cardColorStart);
  const end = normalizeHex(style?.cardColorEnd);
  if (start && end) return [start, end];
  const preset = CARD_GRADIENTS.find((item) => item.id === style?.cardGradient);
  if (preset) return preset.colors.map((color) => color.toLowerCase());
  return null;
}

export function hasCustomCardBackground(style) {
  return resolveCardColors(style) !== null;
}

export function cardFontFamily(fontId) {
  return (CARD_FONTS.find((item) => item.id === fontId) || CARD_FONTS[0]).family;
}

export function cardStyleFromAccount(account) {
  const colors = resolveCardColors(account);
  return {
    cardColorStart: colors?.[0] || "",
    cardColorEnd: colors?.[1] || "",
    cardGradientAngle: clampGradientAngle(account?.cardGradientAngle ?? 135),
    cardFont: CARD_FONTS.some((item) => item.id === account?.cardFont)
      ? account.cardFont
      : "",
  };
}

export function cardStyleVars(style) {
  if (!style) return {};
  const vars = {};
  const colors = resolveCardColors(style);
  if (colors) {
    vars["--card-bg"] = cardGradientCss(
      colors[0],
      colors[1],
      style.cardGradientAngle,
    );
  }
  if (style.cardFont) {
    vars["--card-font"] = cardFontFamily(style.cardFont);
  }
  return vars;
}

export function cardFill(fallback) {
  return `var(--card-bg, ${fallback})`;
}

export function cardRootProps(userData, fallbackBackground, className = "") {
  return {
    className: `w-full ${className} ${hasCustomCardBackground(userData) ? "card-on-gradient" : ""}`.trim(),
    style: {
      background: cardFill(fallbackBackground),
      fontFamily: "var(--card-font, Inter, sans-serif)",
      ...cardStyleVars(userData),
    },
  };
}
