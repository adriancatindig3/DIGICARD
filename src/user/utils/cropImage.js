export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

// `aspect` locks the saved bitmap to the cover frame (16:5). The source
// rectangle is still the region the user positioned.
export const getCroppedImg = async (imageSrc, pixelCrop, aspect) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const outWidth = Math.max(1, Math.round(pixelCrop.width));
  const outHeight = Math.max(
    1,
    Math.round(aspect ? outWidth / aspect : pixelCrop.height),
  );
  canvas.width = outWidth;
  canvas.height = outHeight;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outWidth,
    outHeight,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not crop image"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.95);
  });
};
