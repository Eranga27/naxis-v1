import ForgedWheelStage from "@/components/ForgedWheelStage";
import WheelHero from "@/components/WheelHero";

/**
 * The homepage hero, V2 hero B: the Giant Wheel forged in WebGL. The flat
 * wheel hero (V2 hero A, kept whole on the v2-hero-section branch) is its
 * stand-in without WebGL or under reduced motion.
 */
export default function ForgedWheelHero() {
  return <ForgedWheelStage fallback={<WheelHero />} />;
}
