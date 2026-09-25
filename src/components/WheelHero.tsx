import WheelHeroStage from "@/components/WheelHeroStage";
import { DISC_BOX, WHEEL_RADII, WHEEL_RIM_WIDTH, WHEEL_VIEW, WheelDisc, WheelRims, WheelRing } from "@/components/wheel/WheelLayers";

// Where things sit, as a share of the wheel's square: its outer edge,
// and the middle of each lettered band (where the ignition spark runs).
const pct = (r: number) => `${(r / (WHEEL_VIEW * 2)) * 100}%`;
const EDGE = WHEEL_RADII[0] + WHEEL_RIM_WIDTH / 2 + 6;
const BANDS = {
  values: (WHEEL_RADII[0] + WHEEL_RADII[1]) / 2,
  motto: (WHEEL_RADII[1] + WHEEL_RADII[2]) / 2,
  name: (WHEEL_RADII[2] + WHEEL_RADII[3]) / 2,
};
const LAYER = "absolute inset-0 h-full w-full";

// Each ring turns forever at its own pace, alternating direction, like
// the bezels of a watch: slow enough to read, never quite still.
const SPIN = {
  values: { "--spin": "150s" },
  motto: { "--spin": "210s", "--spin-dir": "reverse" },
  name: { "--spin": "110s" },
  disc: { "--spin": "260s", "--spin-dir": "reverse" },
  rays: { "--spin": "320s", "--spin-dir": "reverse" },
  sheen: { "--spin": "26s" },
} as Record<string, React.CSSProperties>;

/** A ring's ignition spark: a point of light on an arm, at the band's radius. */
function Spark({ ring }: { ring: keyof typeof BANDS }) {
  return (
    <div data-spark={ring} className="pointer-events-none absolute inset-0 opacity-0">
      <span
        className="absolute left-1/2 h-[3.2%] w-[3.2%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          top: `calc(50% - ${pct(BANDS[ring])})`,
          background: "radial-gradient(circle, #fffbe9 0%, #ffd98a 35%, rgba(255,201,74,0) 70%)",
          boxShadow: "0 0 24px 8px rgba(255,214,120,0.55)",
        }}
      />
    </div>
  );
}

/**
 * The homepage hero (V2): the client's Giant Wheel, alone on a dark stage
 * and always turning. Its layers are drawn here, on the server; the
 * stage around them — camera, light, dust and motion — is
 * WheelHeroStage.
 */
export default function WheelHero() {
  const plateInset = `calc(50% - ${pct(EDGE)})`;
  const art = (
    <>
      {/* Light behind the wheel: slow rays, and a breathing glow. */}
      <div data-layer="rays" className="absolute -inset-[42%]">
        <div
          className="wheel-spin h-full w-full rounded-full"
          style={{
            ...SPIN.rays,
            background:
              "repeating-conic-gradient(from 0deg, rgba(255,214,140,0.14) 0deg 0.7deg, transparent 0.7deg 5.3deg)",
            maskImage: "radial-gradient(closest-side, transparent 48%, #000 57%, rgba(0,0,0,0.35) 76%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(closest-side, transparent 48%, #000 57%, rgba(0,0,0,0.35) 76%, transparent 100%)",
          }}
        />
      </div>
      <div data-layer="aura" className="absolute -inset-[22%]">
        <div
          className="wheel-breathe h-full w-full rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,201,74,0.3) 0%, rgba(255,170,60,0.13) 52%, rgba(47,208,138,0.06) 74%, transparent 100%)",
          }}
        />
      </div>

      {/* The wheel's body: a dark medallion the rings are set into. */}
      <div
        data-layer="plate"
        className="absolute rounded-full"
        style={{
          inset: plateInset,
          background: "radial-gradient(circle at 50% 38%, #2a1e12 0%, #150f09 62%, #0b0806 100%)",
          boxShadow:
            "0 70px 140px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(247,220,151,0.16), inset 0 2px 0 rgba(255,235,190,0.08), inset 0 -40px 90px rgba(0,0,0,0.55)",
        }}
      />

      <div data-layer="rims" className="absolute inset-0">
        <WheelRims tone="dark" className={LAYER} />
      </div>
      <div data-ring="values" className="absolute inset-0">
        <div className="wheel-spin h-full w-full" style={SPIN.values}>
          <WheelRing ring="values" tone="dark" className={LAYER} />
        </div>
      </div>
      <div data-ring="motto" className="absolute inset-0">
        <div className="wheel-spin h-full w-full" style={SPIN.motto}>
          <WheelRing ring="motto" tone="dark" className={LAYER} />
        </div>
      </div>
      <div data-ring="name" className="absolute inset-0">
        <div className="wheel-spin h-full w-full" style={SPIN.name}>
          <WheelRing ring="name" tone="dark" className={LAYER} />
        </div>
      </div>
      <div data-ring="disc" className="absolute" style={DISC_BOX}>
        <div className="wheel-spin relative h-full w-full" style={SPIN.disc}>
          <WheelDisc tone="dark" sizes="(min-width: 768px) 42vmin, 45vw" priority />
        </div>
      </div>

      {/* A slow sweep of light round the rings, as over a polished dial. */}
      <div data-layer="sheen" className="pointer-events-none absolute" style={{ inset: plateInset }}>
        <div
          className="wheel-spin h-full w-full rounded-full"
          style={{
            ...SPIN.sheen,
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(255,236,190,0.16) 28deg, transparent 62deg, transparent 180deg, rgba(255,236,190,0.08) 212deg, transparent 240deg)",
            maskImage: "radial-gradient(closest-side, transparent 44%, #000 47%)",
            WebkitMaskImage: "radial-gradient(closest-side, transparent 44%, #000 47%)",
          }}
        />
      </div>

      <Spark ring="name" />
      <Spark ring="motto" />
      <Spark ring="values" />
    </>
  );
  return <WheelHeroStage art={art} />;
}
