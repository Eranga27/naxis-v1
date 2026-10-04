export type DialArt = ImageBitmap | HTMLImageElement;

/**
 * The whole wheel as drawn (public/images/wheel/original-*.webp), decoded
 * off the main thread, to go up to the GPU as it is (not flipped: the
 * scene's shader reads it upside down). From an <img>, the 4096 was
 * decoded during the upload itself, ~220ms on the main thread, and asked
 * to flip it on the way, createImageBitmap does that part on the main
 * thread too (~70ms); either landed in the middle of the intro. Where the
 * browser can't decode it this way, the <img>.
 */
export async function loadDialArt(src: string): Promise<DialArt> {
  if (typeof createImageBitmap === "function") {
    try {
      const blob = await (await fetch(src)).blob();
      return await createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" });
    } catch {
      // fall through to the <img>
    }
  }
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  await image.decode?.().catch(() => {});
  return image;
}
