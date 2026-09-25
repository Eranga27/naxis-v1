import Hero from "@/components/Hero";
import Mission from "@/components/Mission";
import AboutNaxis from "@/components/AboutNaxis";
import IdeasWearable from "@/components/IdeasWearable";
import Capabilities from "@/components/Capabilities";
import ProcessTimeline from "@/components/ProcessTimeline";
import GlobalNetwork from "@/components/GlobalNetwork";
import CinematicDivider from "@/components/CinematicDivider";
import ServicesStack from "@/components/ServicesStack";
import GiantWheel from "@/components/GiantWheel";
import Moq from "@/components/Moq";
import ClosingCTA from "@/components/ClosingCTA";
import HomeIntro from "@/components/HomeIntro";
import PageShell from "@/components/PageShell";

export default function Home() {
  return (
    <>
      <HomeIntro />
      <PageShell>
        <Hero />
        <Mission />
        <AboutNaxis />
        {/* A mid-page interlude between what NAXIS makes and how —
            after the concrete proof, not before it. */}
        <Capabilities />
        <IdeasWearable />
        <ProcessTimeline />
        <ServicesStack />
        {/* What NAXIS does, then what it holds to: the client's wheel of
            values, whose centre is Australia — where the globe after it
            starts. */}
        <GiantWheel />
        <GlobalNetwork />
        <CinematicDivider />
        <Moq />
        <ClosingCTA />
      </PageShell>
    </>
  );
}

