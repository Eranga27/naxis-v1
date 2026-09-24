import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Mission from "@/components/Mission";
import AboutNaxis from "@/components/AboutNaxis";
import IdeasWearable from "@/components/IdeasWearable";
import Capabilities from "@/components/Capabilities";
import ProcessTimeline from "@/components/ProcessTimeline";
import GlobalNetwork from "@/components/GlobalNetwork";
import CinematicDivider from "@/components/CinematicDivider";
import ValueStrip from "@/components/ValueStrip";
import Moq from "@/components/Moq";
import ClosingCTA from "@/components/ClosingCTA";
import Footer from "@/components/Footer";
import HomeIntro from "@/components/HomeIntro";

export default function Home() {
  return (
    <>
      <HomeIntro />
      <Nav />
      <main className="flex-1">
        <Hero />
        <Mission />
        <AboutNaxis />
        <IdeasWearable />
        <Capabilities />
        <ProcessTimeline />
        <GlobalNetwork />
        <CinematicDivider />
        <ValueStrip />
        <Moq />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}

