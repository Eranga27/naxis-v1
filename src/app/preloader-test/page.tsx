// TEMPORARY isolation harness for verifying the preloader on its own.
// Removed once the preloader is integrated into the homepage.
import Preloader from "@/components/Preloader";

export default function PreloaderTest() {
  return (
    <>
      <Preloader />
      <main className="flex min-h-screen items-center justify-center bg-ink px-6">
        <p className="font-headline text-[clamp(2rem,8vw,6rem)] uppercase text-cream">
          Page behind the veil
        </p>
      </main>
    </>
  );
}
