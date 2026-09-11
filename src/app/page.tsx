import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Mission from "@/components/Mission";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Mission />
      </main>
    </>
  );
}
