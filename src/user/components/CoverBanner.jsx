// The card banner is 16:5. Cover fills that frame edge to edge
// without stretching the photo.
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
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      ) : (
        children
      )}
    </div>
  );
}
