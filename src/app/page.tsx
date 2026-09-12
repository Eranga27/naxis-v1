import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Mission from "@/components/Mission";
import HomeIntro from "@/components/HomeIntro";

export default function Home() {
  return (
    <>
      <HomeIntro />
      <Nav />
      <main className="flex-1">
        <Hero />
        <Mission />
      </main>
    </>
  );
}
