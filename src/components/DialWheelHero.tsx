import DialWheelStage from "@/components/DialWheelStage";
import DialStill from "@/components/DialStill";

/**
 * The homepage hero, V2 hero D: the Giant Wheel close up, a medallion on
 * a dark table with its rings turning past. Its still close-up stands in
 * without WebGL 2 or under reduced motion.
 */
export default function DialWheelHero() {
  return <DialWheelStage fallback={<DialStill />} />;
}
