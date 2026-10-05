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
  CARD_GRADIENTS,
  cardGradientCss,
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

export default function CardStyleEditor({
  userData,
  draft,
  onChange,
  onBack,
  onDone,
  saving,
}) {
  const Layout = LAYOUTS[userData?.selectedLayout] || Layout1;
  const previewData = { ...userData, ...draft };

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
          <Layout userData={previewData} onConnect={() => {}} />
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold">Style</h3>

          <p className="mt-4 text-xs text-gray-500">Background</p>
          <div className="mt-2 flex gap-3">
            {CARD_GRADIENTS.map((gradient) => {
              const selected = draft.cardGradient === gradient.id;
              return (
                <button
                  key={gradient.id}
                  type="button"
                  aria-label={`${gradient.id} gradient`}
                  aria-pressed={selected}
                  onClick={() => onChange({ ...draft, cardGradient: gradient.id })}
                  className={`h-11 w-11 rounded-full ${selected ? "ring-2 ring-gray-900 ring-offset-2" : ""}`}
                  style={{ background: cardGradientCss(gradient.id, draft.cardGradientAngle) }}
                />
              );
            })}
          </div>

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
                cardGradient: draft.cardGradient || "forest",
                cardGradientAngle: Number(event.target.value),
              })
            }
            className="mt-2 w-full accent-gray-900"
          />

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
                    selected
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  {font.label}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-gray-400">Changes show on this card only.</p>
        </div>
      </div>
    </div>
  );
}
