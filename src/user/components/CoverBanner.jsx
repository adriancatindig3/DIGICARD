// The card banner is 16:5. The photo keeps its own proportions inside
// that frame so a portrait is not squashed to fill the strip.
export const COVER_ASPECT = 16 / 5;

export default function CoverBanner({
  src,
  alt = "Cover",
  className = "",
  style,
  children,
}) {
  return (
    <div
      className={`relative w-full overflow-hidden aspect-[16/5] ${className}`}
      style={{ ...style, aspectRatio: "16 / 5" }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: "contain", objectPosition: "center" }}
        />
      ) : (
        children
      )}
    </div>
  );
}
