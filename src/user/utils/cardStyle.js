export const CARD_GRADIENTS = [
  { id: "forest", colors: ["#1a2e1a", "#0f1f0f"] },
  { id: "navy", colors: ["#1e3a5f", "#0d1b2e"] },
  { id: "gold", colors: ["#c4a35a", "#8a6232"] },
  { id: "slate", colors: ["#9ca3af", "#4b5563"] },
];

export const CARD_FONTS = [
  { id: "Inter", label: "Inter", family: "Inter, sans-serif" },
  { id: "Poppins", label: "Poppins", family: "Poppins, sans-serif" },
  { id: "Montserrat", label: "Montserrat", family: "Montserrat, sans-serif" },
  { id: "Roboto", label: "Roboto", family: "Roboto, sans-serif" },
  { id: "Raleway", label: "Raleway", family: "Raleway, sans-serif" },
  { id: "Nunito", label: "Nunito", family: "Nunito, sans-serif" },
  { id: "Oswald", label: "Oswald", family: "Oswald, sans-serif" },
  {
    id: "Playfair",
    label: "Playfair",
    family: '"Playfair Display", Georgia, serif',
  },
  { id: "Lora", label: "Lora", family: "Lora, Georgia, serif" },
  { id: "Merriweather", label: "Merriweather", family: "Merriweather, Georgia, serif" },
  { id: "Cinzel", label: "Cinzel", family: "Cinzel, Georgia, serif" },
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
    cardTextColor: normalizeHex(account?.cardTextColor) || "",
  };
}

// Older saves stored one style on the account. Keep it on the layout that was
// selected, and leave every other layout on its built-in default.
export function foldLegacyCardStyle(account) {
  const cardStyles = { ...(account?.cardStyles || {}) };
  const key = String(account?.selectedLayout || 1);
  const legacy = cardStyleFromAccount(account);
  const hasLegacy = Boolean(legacy.cardColorStart || legacy.cardFont || legacy.cardTextColor);
  const migrated = hasLegacy && !cardStyles[key];
  if (migrated) cardStyles[key] = legacy;
  return { cardStyles, migrated };
}

export function rgbToHex(red, green, blue) {
  const channel = (value) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

export function hexToHsv(hex) {
  const color = normalizeHex(hex) || "#ffffff";
  const red = parseInt(color.slice(1, 3), 16) / 255;
  const green = parseInt(color.slice(3, 5), 16) / 255;
  const blue = parseInt(color.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { h: hue, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToHex(hue, saturation, value) {
  const channel = value * saturation;
  const mix = channel * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = value - channel;
  let red = 0;
  let green = 0;
  let blue = 0;
  if (hue < 60) [red, green, blue] = [channel, mix, 0];
  else if (hue < 120) [red, green, blue] = [mix, channel, 0];
  else if (hue < 180) [red, green, blue] = [0, channel, mix];
  else if (hue < 240) [red, green, blue] = [0, mix, channel];
  else if (hue < 300) [red, green, blue] = [mix, 0, channel];
  else [red, green, blue] = [channel, 0, mix];
  return rgbToHex((red + base) * 255, (green + base) * 255, (blue + base) * 255);
}

// A saved look belongs to one layout. Every other layout stays on its own default.
export function styleForLayout(userData, layoutId) {
  const key = String(layoutId);
  const saved = userData?.cardStyles?.[key];
  const legacy =
    !saved &&
    String(userData?.selectedLayout || "") === key &&
    (normalizeHex(userData?.cardColorStart) || userData?.cardGradient);
  const style = saved || (legacy
    ? {
        cardColorStart: userData.cardColorStart,
        cardColorEnd: userData.cardColorEnd,
        cardGradient: userData.cardGradient,
        cardGradientAngle: userData.cardGradientAngle,
        cardFont: userData.cardFont,
        cardTextColor: userData.cardTextColor,
      }
    : null);
  if (!style) {
    return {
      ...userData,
      cardColorStart: "",
      cardColorEnd: "",
      cardGradient: "",
      cardFont: "",
      cardTextColor: "",
    };
  }
  return {
    ...userData,
    cardColorStart: style.cardColorStart || "",
    cardColorEnd: style.cardColorEnd || "",
    cardGradient: style.cardGradient || "",
    cardGradientAngle: style.cardGradientAngle,
    cardFont: style.cardFont || "",
    cardTextColor: normalizeHex(style.cardTextColor) || "",
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
  const text = normalizeHex(style.cardTextColor);
  if (text) vars["--card-text"] = text;
  return vars;
}

export function cardFill(fallback) {
  return `var(--card-bg, ${fallback})`;
}

export function cardRootProps(userData, fallbackBackground, className = "") {
  return {
    className: `w-full ${className} ${hasCustomCardBackground(userData) ? "card-on-gradient" : ""} ${normalizeHex(userData?.cardTextColor) ? "card-text-color" : ""}`.trim(),
    style: {
      background: cardFill(fallbackBackground),
      fontFamily: "var(--card-font, Inter, sans-serif)",
      ...cardStyleVars(userData),
    },
  };
}
