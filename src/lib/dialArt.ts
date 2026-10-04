export type DialArt = ImageBitmap | HTMLImageElement;

/**
 * The whole wheel as drawn (public/images/wheel/original-*.webp), in two
 * steps: its bytes now, decoded later (decodeDialArt). Null where the
 * browser can't decode it off the main thread, or the fetch failed.
 */
export async function fetchDialArt(src: string): Promise<Blob | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    const response = await fetch(src);
    return response.ok ? await response.blob() : null;
  } catch {
    return null;
  }
}

/**
 * The artwork decoded off the main thread, to go up to the GPU as it is
 * (not flipped: the scene's shader reads it upside down). From an <img>,
 * the 4096 was decoded during the upload itself, ~220ms on the main
 * thread; asked to flip it, createImageBitmap does that part on the main
 * thread too (~70ms); and even unflipped, taking delivery of 64MB of
 * pixels costs it ~45ms on a tablet. So the hero decodes it in the
 * intro's quiet moment, with the rest of its setup. Without a blob, the
 * <img>.
 */
export async function decodeDialArt(blob: Blob | null, src: string): Promise<DialArt> {
  if (blob) {
    try {
      return await createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" });
    } catch {
      // fall through to the <img>
    }
  }
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}
