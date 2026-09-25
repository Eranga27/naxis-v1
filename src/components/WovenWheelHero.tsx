import WovenWheelStage from "@/components/WovenWheelStage";
import WheelHero from "@/components/WheelHero";

/**
 * The homepage hero, V2 hero C: the Giant Wheel woven from points of
 * light. The flat wheel hero (V2 hero A) is its stand-in without WebGL or
 * under reduced motion.
 */
export default function WovenWheelHero() {
  return <WovenWheelStage fallback={<WheelHero />} />;
}
