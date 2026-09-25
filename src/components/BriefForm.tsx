"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import gsap from "gsap";
import { CONTACT } from "@/lib/contact";
import { MOQ } from "@/content/moq";
import {
  EMPTY_ENQUIRY,
  STAGES,
  STEP_FIELDS,
  TIMINGS,
  enquiryEmailText,
  enquirySubject,
  fieldErrors,
  quantityLabel,
  timingLabel,
  type Enquiry,
  type FieldErrors,
  type Stage,
  type Timing,
} from "@/lib/enquiry";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

// The client's own brief, from their MOQ copy: "Tell us what you want to
// create, how many you need, and where you want to go with your idea."
const STEPS = [
  { label: "Create", question: "What do you want to create?" },
  { label: "How many", question: "How many do you need?" },
  { label: "Where next", question: "Where do you want to go with your idea?" },
  { label: "You", question: "Who should we talk to?" },
];
const REVIEW = STEPS.length;

// Long answers are shortened in the read-back sentence (sent in full).
const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

type Status = "editing" | "sending" | "sent" | "fallback";

const inputClass =
  "w-full border-b border-cream/25 bg-transparent py-3 font-body text-base text-cream placeholder:text-cream/30 transition-colors focus:border-gold focus:outline-none md:text-lg";
const labelClass =
  "mb-1 block font-body text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-cream/55";

/**
 * The Start a Project brief: four short questions, one at a time, then the
 * answers read back as a sentence before sending. Only the first question
 * and a name and email are required; everything else can be left for the
 * conversation. Steps swap with a short rise; under reduced motion they
 * simply swap. Focus moves to each new question for keyboard and screen
 * reader users.
 */
export default function BriefForm() {
  const [data, setData] = useState<Enquiry>(EMPTY_ENQUIRY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("editing");
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const changed = useRef(false);

  const set = <K extends keyof Enquiry>(key: K, value: Enquiry[K]) => {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  // Swap panels: the current one lifts away, then the next rises in (see
  // the layout effect below) and takes focus.
  const show = (update: () => void) => {
    changed.current = true;
    const panel = panelRef.current;
    if (!panel || prefersReducedMotion()) {
      update();
      return;
    }
    gsap.to(panel, { opacity: 0, y: -14, duration: 0.22, ease: "power2.in", onComplete: update });
  };

  useIsomorphicLayoutEffect(() => {
    if (!changed.current) return;
    const panel = panelRef.current;
    if (panel && !prefersReducedMotion()) {
      gsap.fromTo(panel, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" });
    }
    // Bring the question into view if the previous step left it above the
    // screen (long steps on phones), then hand it focus.
    if (panel && panel.getBoundingClientRect().top < 96) {
      window.scrollTo({ top: window.scrollY + panel.getBoundingClientRect().top - 120 });
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step, status]);

  const focusField = (field: keyof Enquiry) =>
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[name="${field}"]`)?.focus()
    );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === "sending") return;

    if (step < REVIEW) {
      const stepErrors = fieldErrors(data, STEP_FIELDS[step]);
      const first = Object.keys(stepErrors)[0] as keyof Enquiry | undefined;
      if (first) {
        setErrors(stepErrors);
        focusField(first);
        return;
      }
      show(() => setStep(step + 1));
      return;
    }

    const allErrors = fieldErrors(data);
    const first = Object.keys(allErrors)[0] as keyof Enquiry | undefined;
    if (first) {
      setErrors(allErrors);
      show(() => setStep(STEP_FIELDS.findIndex((fields) => fields.includes(first))));
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        show(() => setStatus("sent"));
        return;
      }
    } catch {
      // network failure: fall through to the email fallback
    }
    show(() => setStatus("fallback"));
  };

  const mailto = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
    enquirySubject(data)
  )}&body=${encodeURIComponent(enquiryEmailText(data))}`;

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(enquiryEmailText(data));
      setCopied(true);
    } catch {
      // clipboard unavailable — the email button still works
    }
  };

  const error = (field: keyof Enquiry) =>
    errors[field] ? (
      <p id={`${field}-error`} className="mt-2 font-body text-sm text-gold">
        {errors[field]}
      </p>
    ) : null;

  const invalid = (field: keyof Enquiry) =>
    errors[field]
      ? { "aria-invalid": true, "aria-describedby": `${field}-error` }
      : {};

  const heading = (text: ReactNode) => (
    <h3
      ref={headingRef}
      tabIndex={-1}
      className="mb-8 max-w-2xl font-serif text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.1] tracking-[-0.02em] text-cream focus:outline-none md:mb-10"
    >
      {text}
    </h3>
  );

  const chips = <T extends string>(
    name: keyof Enquiry,
    options: Record<T, string>,
    value: string,
    onPick: (value: T | "") => void
  ) => (
    <div className="flex flex-wrap gap-3">
      {(Object.entries(options) as Array<[T, string]>).map(([key, label]) => (
        <label key={key} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={key}
            checked={value === key}
            // A second click on the chosen option clears it — these
            // answers are optional.
            onChange={() => onPick(key)}
            onClick={() => value === key && onPick("")}
            className="peer sr-only"
          />
          <span className="inline-flex rounded-full border border-cream/25 px-5 py-2.5 font-body text-sm text-cream/80 transition-colors peer-checked:border-gold peer-checked:bg-gold peer-checked:text-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold hover:border-cream/60">
            {label}
          </span>
        </label>
      ))}
    </div>
  );

  let panel: ReactNode;
  if (status === "sent") {
    panel = (
      <div>
        {heading(<>Thank you{data.name ? `, ${data.name.trim().split(" ")[0]}` : ""}.</>)}
        <p className="max-w-2xl font-serif text-xl leading-relaxed text-cream/80 md:text-2xl">
          {MOQ.body[2]}
        </p>
      </div>
    );
  } else if (status === "fallback") {
    panel = (
      <div>
        {heading("One more step.")}
        <p className="mb-8 max-w-2xl font-body text-base leading-relaxed text-cream/70 md:text-lg">
          We couldn&apos;t send your brief from the website just now. It&apos;s
          all written out below — send it from your own email app, or copy it.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href={mailto}
            className="inline-flex items-center gap-3 rounded-full bg-gold px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-gold-light"
          >
            Email the brief →
          </a>
          <button
            type="button"
            onClick={copyBrief}
            className="inline-flex items-center gap-3 rounded-full border border-cream/25 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:border-cream/60"
          >
            {copied ? "Copied" : "Copy the brief"}
          </button>
        </div>
        <pre className="mt-8 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-cream/10 bg-cream/[0.04] p-5 font-body text-sm leading-relaxed text-cream/70">
          {enquiryEmailText(data)}
        </pre>
      </div>
    );
  } else if (step === 0) {
    panel = (
      <div>
        {heading(STEPS[0].question)}
        <label className={labelClass} htmlFor="brief-product">
          Your product, in a sentence or two
        </label>
        <textarea
          id="brief-product"
          name="product"
          rows={3}
          value={data.product}
          onChange={(e) => set("product", e.target.value)}
          placeholder="e.g. a capsule of heavyweight tees and hoodies for our brand launch"
          className={`${inputClass} resize-y`}
          {...invalid("product")}
        />
        {error("product")}
        <p className={`${labelClass} mt-10 mb-4`}>Where are you at? (optional)</p>
        {chips("stage", STAGES, data.stage, (v) => set("stage", v as Stage | ""))}
      </div>
    );
  } else if (step === 1) {
    panel = (
      <div>
        {heading(STEPS[1].question)}
        <label className={labelClass} htmlFor="brief-quantity">
          Roughly how many units (optional)
        </label>
        <input
          id="brief-quantity"
          name="quantity"
          inputMode="numeric"
          autoComplete="off"
          value={data.quantity}
          disabled={data.quantityUnsure}
          onChange={(e) => set("quantity", e.target.value)}
          placeholder="e.g. 300"
          className={`${inputClass} max-w-xs disabled:opacity-40`}
          {...invalid("quantity")}
        />
        {error("quantity")}
        <label className="mt-6 flex w-fit cursor-pointer items-center gap-3 font-body text-sm text-cream/75">
          <input
            type="checkbox"
            name="quantityUnsure"
            checked={data.quantityUnsure}
            onChange={(e) => set("quantityUnsure", e.target.checked)}
            className="h-4 w-4 accent-[var(--color-gold)]"
          />
          Not sure yet
        </label>
        {/* The client's MOQ promise, right where the question is asked */}
        <p className="mt-10 max-w-xl border-l border-gold/50 pl-5 font-serif text-lg italic leading-snug text-cream/70">
          {MOQ.body[1]}
        </p>
      </div>
    );
  } else if (step === 2) {
    panel = (
      <div>
        {heading(STEPS[2].question)}
        <p className={`${labelClass} mb-4`}>When would you like it? (optional)</p>
        {chips("timing", TIMINGS, data.timing, (v) => set("timing", v as Timing | ""))}
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="brief-market">
              Where will it be sold? (optional)
            </label>
            <input
              id="brief-market"
              name="market"
              value={data.market}
              onChange={(e) => set("market", e.target.value)}
              placeholder="e.g. online in Australia, a few stockists"
              className={inputClass}
              {...invalid("market")}
            />
            {error("market")}
          </div>
          <div>
            <label className={labelClass} htmlFor="brief-notes">
              Anything else? (optional)
            </label>
            <textarea
              id="brief-notes"
              name="notes"
              rows={2}
              value={data.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Fabrics, trims, certifications, budget…"
              className={`${inputClass} resize-y`}
              {...invalid("notes")}
            />
            {error("notes")}
          </div>
        </div>
      </div>
    );
  } else if (step === 3) {
    const field = (
      name: "name" | "email" | "company" | "phone" | "country",
      label: string,
      props: Record<string, string | boolean> = {}
    ) => (
      <div>
        <label className={labelClass} htmlFor={`brief-${name}`}>
          {label}
        </label>
        <input
          id={`brief-${name}`}
          name={name}
          value={data[name]}
          onChange={(e) => set(name, e.target.value)}
          className={inputClass}
          {...props}
          {...invalid(name)}
        />
        {error(name)}
      </div>
    );
    panel = (
      <div>
        {heading(STEPS[3].question)}
        <div className="grid gap-8 md:grid-cols-2">
          {field("name", "Your name", { autoComplete: "name", required: true })}
          {field("email", "Email", { type: "email", autoComplete: "email", required: true })}
          {field("company", "Brand or company (optional)", { autoComplete: "organization" })}
          {field("phone", "Phone (optional)", { type: "tel", autoComplete: "tel" })}
          {field("country", "Country (optional)", { autoComplete: "country-name" })}
        </div>
      </div>
    );
  } else {
    const answer = (text: string) => <span className="text-gold">{text}</span>;
    panel = (
      <div>
        {heading("Here's your brief.")}
        <p className="max-w-3xl font-serif text-[clamp(1.35rem,2.6vw,2.1rem)] leading-snug text-cream/85">
          You&apos;d like to create {answer(clip(data.product.trim(), 140))}
          {data.stage ? <> ({answer(STAGES[data.stage].toLowerCase())})</> : null}
          {" — "}
          {answer(quantityLabel(data))}, {answer(timingLabel(data).toLowerCase())}
          {data.market ? <>, sold {answer(data.market.trim())}</> : null}. We&apos;ll
          reply to {answer(data.name.trim())} at {answer(data.email.trim())}.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="mr-2 font-body text-xs uppercase tracking-[0.25em] text-cream/45">
            Change
          </span>
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => show(() => setStep(i))}
              className="rounded-full border border-cream/20 px-4 py-1.5 font-body text-xs text-cream/75 transition-colors hover:border-gold hover:text-gold"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const finished = status === "sent" || status === "fallback";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Project brief"
      className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16"
    >
      {/* Progress: one mark per question plus the read-back. Earlier
          questions can be revisited; later ones open in order. */}
      <ol aria-label="Brief progress" className="flex gap-3 lg:flex-col lg:gap-5">
        {[...STEPS, { label: "Review", question: "" }].map((s, i) => {
          const state = finished || i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={s.label} aria-current={state === "current" ? "step" : undefined}>
              <button
                type="button"
                disabled={finished || i >= step}
                onClick={() => show(() => setStep(i))}
                className="group flex items-center gap-3 text-left disabled:cursor-default"
              >
                <span
                  aria-hidden="true"
                  className={`block h-3 w-[3px] rounded-full transition-[background-color,scale] duration-300 ${
                    state === "current"
                      ? "scale-y-[1.8] bg-gold"
                      : state === "done"
                        ? "bg-emerald-bright"
                        : "bg-cream/25"
                  }`}
                />
                <span
                  className={`font-body text-[0.7rem] font-semibold tabular-nums tracking-[0.2em] ${
                    state === "current" ? "text-gold" : "text-cream/45"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`hidden font-body text-xs font-semibold uppercase tracking-[0.25em] lg:inline ${
                    state === "current" ? "text-cream" : "text-cream/45 group-enabled:group-hover:text-cream/80"
                  }`}
                >
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div>
        <p aria-live="polite" className="sr-only">
          {finished
            ? status === "sent"
              ? "Brief sent."
              : "Your brief couldn't be sent from the website."
            : step < REVIEW
              ? `Question ${step + 1} of ${STEPS.length}: ${STEPS[step].question}`
              : "Review your brief."}
        </p>

        <div ref={panelRef}>{panel}</div>

        {/* Honeypot: off-screen and skipped by keyboard and screen readers */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={data.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </label>
        </div>

        {!finished && (
          <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-cream/10 pt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={() => show(() => setStep(step - 1))}
                className="rounded-full border border-cream/25 px-6 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:border-cream/60"
              >
                ← Back
              </button>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-full bg-gold px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-gold-light disabled:opacity-60"
            >
              {step < REVIEW - 1
                ? "Next →"
                : step === REVIEW - 1
                  ? "Review brief →"
                  : status === "sending"
                    ? "Sending…"
                    : "Send brief →"}
            </button>
            <span className="font-body text-xs text-cream/40">
              {step < REVIEW ? `Question ${step + 1} of ${STEPS.length}` : "Nearly there"}
            </span>
          </div>
        )}
      </div>
    </form>
  );
}
