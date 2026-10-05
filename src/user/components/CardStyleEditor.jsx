import { useRef, useState } from "react";
import {
  Layout1,
  Layout2,
  Layout3,
  Layout4,
  Layout5,
  Layout6,
  Layout7,
  Layout8,
  Layout9,
} from "../layouts";
import {
  CARD_FONTS,
  cardGradientCss,
  hexToHsv,
  hsvToHex,
} from "../utils/cardStyle";

const LAYOUTS = {
  1: Layout1,
  2: Layout2,
  3: Layout3,
  4: Layout4,
  5: Layout5,
  6: Layout6,
  7: Layout7,
  8: Layout8,
  9: Layout9,
};

function ColorSwatch({ label, color, active, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`h-11 w-11 shrink-0 rounded-full border-2 border-white shadow ${
        active ? "ring-2 ring-gray-900 ring-offset-2" : "ring-1 ring-gray-300"
      }`}
      style={{ backgroundColor: color || "#ffffff" }}
    />
  );
}

function ColorPicker({ color, onChange }) {
  const fieldRef = useRef(null);
  const hsv = hexToHsv(color || "#ffffff");
  const hueColor = hsvToHex(hsv.h, 1, 1);

  const update = (next) => {
    onChange(hsvToHex(next.h ?? hsv.h, next.s ?? hsv.s, next.v ?? hsv.v));
  };

  const pickField = (event) => {
    const rect = fieldRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    update({ s: x, v: 1 - y });
  };

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div
        ref={fieldRef}
        className="relative h-40 w-full touch-none overflow-hidden rounded-md"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pickField(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) pickField(event);
        }}
      >
        <span
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
        />
      </div>
      <input
        type="range"
        min="0"
        max="360"
        value={Math.round(hsv.h)}
        aria-label="Hue"
        onChange={(event) => update({ h: Number(event.target.value) })}
        className="hue-slider mt-3"
      />
    </div>
  );
}

export default function CardStyleEditor({
  userData,
  draft,
  onChange,
  onBack,
  onDone,
  saving,
}) {
  const [picker, setPicker] = useState(null);
  const Layout = LAYOUTS[userData?.selectedLayout] || Layout1;
  const previewData = {
    ...userData,
    cardStyles: {
      ...(userData?.cardStyles || {}),
      [String(userData?.selectedLayout || 1)]: draft,
    },
  };
  const openPicker = (target) => setPicker((current) => (current === target ? null : target));
  const pickerColor =
    picker === "end"
      ? draft.cardColorEnd
      : picker === "text"
        ? draft.cardTextColor || "#ffffff"
        : draft.cardColorStart;
  const changePicker = (color) => {
    if (picker === "end") onChange({ ...draft, cardColorEnd: color });
    else if (picker === "text") onChange({ ...draft, cardTextColor: color });
    else onChange({ ...draft, cardColorStart: color });
  };

  return (
    <div className="min-h-full bg-white text-gray-900">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-800 hover:bg-gray-100"
          aria-label="Back"
        >
          ‹
        </button>
        <h2 className="text-base font-semibold">Edit card</h2>
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving" : "Done"}
        </button>
      </div>

      <div className="mx-auto max-w-md px-4 py-5">
        <div className="overflow-hidden rounded-2xl shadow-md">
          <Layout userData={previewData} />
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold">Style</h3>

          <p className="mt-4 text-xs text-gray-500">Background</p>
          <div className="mt-2 flex items-center gap-3">
            <div
              className="h-11 min-w-0 flex-1 rounded-full border border-gray-200"
              style={{
                background: cardGradientCss(
                  draft.cardColorStart,
                  draft.cardColorEnd,
                  draft.cardGradientAngle,
                ),
              }}
            />
            <ColorSwatch
              label="First gradient color"
              color={draft.cardColorStart}
              active={picker === "start"}
              onClick={() => openPicker("start")}
            />
            <ColorSwatch
              label="Second gradient color"
              color={draft.cardColorEnd}
              active={picker === "end"}
              onClick={() => openPicker("end")}
            />
          </div>
          {picker === "start" || picker === "end" ? (
            <ColorPicker color={pickerColor} onChange={changePicker} />
          ) : null}

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-gray-500">Rotate gradient</p>
            <p className="text-xs font-medium text-gray-700">{draft.cardGradientAngle}°</p>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={draft.cardGradientAngle}
            aria-label="Rotate gradient"
            onChange={(event) =>
              onChange({
                ...draft,
                cardGradientAngle: Number(event.target.value),
              })
            }
            className="mt-2 w-full accent-gray-900"
          />

          <p className="mt-5 text-xs text-gray-500">Text</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm text-gray-600">Text color</span>
            <ColorSwatch
              label="Text color"
              color={draft.cardTextColor || "#ffffff"}
              active={picker === "text"}
              onClick={() => openPicker("text")}
            />
          </div>
          {picker === "text" ? (
            <ColorPicker color={pickerColor} onChange={changePicker} />
          ) : null}

          <p className="mt-5 text-xs text-gray-500">Font</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CARD_FONTS.map((font) => {
              const selected = draft.cardFont === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => onChange({ ...draft, cardFont: font.id })}
                  className={`rounded-full px-4 py-1.5 text-sm ${
                    selected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  {font.label}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-gray-400">
            This style stays on this card. The other cards keep their own look.
          </p>
        </div>
      </div>
    </div>
  );
}
