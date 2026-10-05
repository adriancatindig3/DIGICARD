// Public card banners are 16:5. The saved cover is already that crop,
// so the bitmap is stretched to the frame instead of cropped again.
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
          style={{ objectFit: "fill" }}
        />
      ) : (
        children
      )}
    </div>
  );
}
