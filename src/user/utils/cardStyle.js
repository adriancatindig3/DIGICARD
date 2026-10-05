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
  cardGradient: "forest",
  cardGradientAngle: 135,
  cardFont: "Inter",
};

export function clampGradientAngle(angle) {
  const value = Number(angle);
  if (!Number.isFinite(value)) return 135;
  return Math.max(0, Math.min(360, Math.round(value)));
}

export function cardGradientCss(gradientId, angle = 135) {
  const gradient =
    CARD_GRADIENTS.find((item) => item.id === gradientId) || CARD_GRADIENTS[0];
  const safeAngle = clampGradientAngle(angle);
  return `linear-gradient(${safeAngle}deg, ${gradient.colors[0]} 0%, ${gradient.colors[1]} 100%)`;
}

export function cardFontFamily(fontId) {
  return (CARD_FONTS.find((item) => item.id === fontId) || CARD_FONTS[0]).family;
}

export function cardStyleFromAccount(account) {
  return {
    cardGradient: CARD_GRADIENTS.some((item) => item.id === account?.cardGradient)
      ? account.cardGradient
      : "",
    cardGradientAngle: clampGradientAngle(account?.cardGradientAngle ?? 135),
    cardFont: CARD_FONTS.some((item) => item.id === account?.cardFont)
      ? account.cardFont
      : "",
  };
}

export function cardStyleVars(style) {
  if (!style) return {};
  const vars = {};
  if (style.cardGradient) {
    vars["--card-bg"] = cardGradientCss(
      style.cardGradient,
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
    className: `w-full ${className} ${userData?.cardGradient ? "card-on-gradient" : ""}`.trim(),
    style: {
      background: cardFill(fallbackBackground),
      fontFamily: "var(--card-font, Inter, sans-serif)",
      ...cardStyleVars(userData),
    },
  };
}
