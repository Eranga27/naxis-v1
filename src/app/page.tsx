import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Mission from "@/components/Mission";
import Capabilities from "@/components/Capabilities";
import GlobalNetwork from "@/components/GlobalNetwork";
import CinematicDivider from "@/components/CinematicDivider";
import ValueStrip from "@/components/ValueStrip";
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
        <Capabilities />
        <GlobalNetwork />
        <CinematicDivider />
        <ValueStrip />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
