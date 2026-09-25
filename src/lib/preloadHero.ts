import { getImageProps } from "next/image";

const requested = new Set<string>();

/**
 * Starts loading the variant of a photo that a page hero will show (a
 * full-width next/image, sizes="100vw"), so that when a shared photo morphs
 * into that hero across a page transition, the hero's own image is already
 * there to take over — instead of the morph landing on a hero that is still
 * downloading. Called on intent: hover, focus, touch.
 */
export function preloadHero(src: string) {
  if (typeof window === "undefined" || requested.has(src)) return;
  requested.add(src);
  const { props } = getImageProps({ src, alt: "", fill: true, sizes: "100vw" });
  const img = new window.Image();
  if (props.sizes) img.sizes = props.sizes;
  if (props.srcSet) img.srcset = props.srcSet;
  else img.src = props.src;
}
