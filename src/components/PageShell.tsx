import { ViewTransition, type ReactNode } from "react";
import Footer from "@/components/Footer";

/**
 * Wraps a page's content and footer. The header lives in the root layout
 * and persists across navigations; everything in here is what changes, so
 * it carries the page transition: the outgoing page settles back while the
 * incoming one is wiped up over it, led by a gold -> emerald edge (see the
 * .page-enter / .page-exit view-transition rules in globals.css).
 *
 * This has to sit in each page, not the layout — a layout persists across
 * navigations, so its enter/exit would never fire.
 */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div className="flex flex-1 flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ViewTransition>
  );
}
