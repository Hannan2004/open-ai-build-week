"use client";

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CONSOLE_LINES = [
  { room: "Kitchen", text: "Oat milk added — grouped with Thu store run", who: "Agent" },
  { room: "Hallway closet", text: "Recycling assigned to Alex before pickup", who: "Agent" },
  { room: "Utility room", text: "Internet bill due Friday — flagged 3 days out", who: "Agent" },
  { room: "Wall calendar", text: "Dentist + game night overlap — moved dentist", who: "Agent" },
];

const DOMAINS = [
  {
    icon: CheckSquare,
    room: "Hallway closet",
    title: "Chores",
    detail:
      "Recurring and one-off chores get an owner and a due day automatically, rotated so the same person isn't always on dishes.",
    accent: "#5FBFA0",
  },
  {
    icon: ShoppingCart,
    room: "Kitchen",
    title: "Groceries",
    detail:
      "Anyone can drop an item in. The agent groups them by the next planned store run instead of scattering them across five texts.",
    accent: "#E3A857",
  },
  {
    icon: Receipt,
    room: "Utility room",
    title: "Bills",
    detail:
      "Shared bills surface before they're overdue, with who owes what, so nothing quietly slips a due date.",
    accent: "#D97B6B",
  },
  {
    icon: CalendarDays,
    room: "Wall calendar",
    title: "Calendar",
    detail:
      "One household calendar the agent actually reads — it catches overlaps between people before they become a scramble.",
    accent: "#7FA8E3",
  },
];

const FLOW_STEPS = [
  {
    step: "01",
    title: "Capture",
    detail: "A chore, item, bill, or event lands in the household from any person, any time.",
  },
  {
    step: "02",
    title: "Route",
    detail: "The agent decides who it belongs to and when it's due — based on load, not luck.",
  },
  {
    step: "03",
    title: "Resolve",
    detail: "Nudges go to the one person who owns it. Everyone else's inbox stays quiet.",
  },
];

// ---------------------------------------------------------------------------
// Small hooks
// ---------------------------------------------------------------------------

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero console (signature element)
// ---------------------------------------------------------------------------

function HeroConsole() {
  const [active, setActive] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const line = CONSOLE_LINES[active].text;
    let i = 0;
    const typing = setInterval(() => {
      i += 1;
      setCharCount(i);
      if (i >= line.length) clearInterval(typing);
    }, 22);

    const advance = setTimeout(() => {
      setActive((a) => (a + 1) % CONSOLE_LINES.length);
    }, 3600);

    return () => {
      clearInterval(typing);
      clearTimeout(advance);
    };
  }, [active]);

  return (
    <div
      className="relative border border-[#232838] bg-[#12161F] p-5 sm:p-6"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* faint blueprint linework */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
        viewBox="0 0 400 320"
        fill="none"
      >
        <rect x="10" y="10" width="380" height="300" stroke="#E3A857" strokeWidth="1" />
        <line x1="150" y1="10" x2="150" y2="150" stroke="#E3A857" strokeWidth="1" />
        <line x1="10" y1="150" x2="150" y2="150" stroke="#E3A857" strokeWidth="1" />
        <line x1="150" y1="150" x2="400" y2="150" stroke="#E3A857" strokeWidth="1" />
        <line x1="260" y1="150" x2="260" y2="310" stroke="#E3A857" strokeWidth="1" />
        <path d="M150 150 A 30 30 0 0 1 180 120" stroke="#E3A857" strokeWidth="1" />
      </svg>

      <div className="relative flex items-start justify-between border-b border-[#232838] pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8B92A6]">This week at home</p>
          <p className="mt-1.5 text-lg font-medium text-[#EDEEF2]">Everything has an owner</p>
        </div>
        <span className="relative flex size-2">
          <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E3A857] opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-[#E3A857]" />
        </span>
      </div>

      <div className="relative divide-y divide-[#1C2130]">
        {DOMAINS.map((d) => (
          <div key={d.title} className="flex gap-3 py-3.5">
            <d.icon className="mt-0.5 size-4 shrink-0" style={{ color: d.accent }} aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-[#EDEEF2]">{d.title}</p>
              <p className="mt-0.5 text-xs text-[#8B92A6]">{d.room}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-5 border border-[#232838] bg-[#0B0E14] p-4">
        <p
          className="text-[11px] uppercase tracking-[0.16em] text-[#5FBFA0]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Agent · {CONSOLE_LINES[active].room}
        </p>
        <p className="mt-2 min-h-[2.5rem] text-sm leading-6 text-[#EDEEF2]" style={{ fontFamily: "var(--font-mono)" }}>
          {CONSOLE_LINES[active].text.slice(0, charCount)}
          <span className="motion-safe:animate-pulse text-[#E3A857]">▍</span>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [glow, setGlow] = useState({ x: 50, y: 20 });

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <main
      onMouseMove={(e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        setGlow({ x, y });
      }}
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#0B0E14] text-[#EDEEF2]`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* ambient lamplight glow following cursor, desktop only */}
      <div
        className="pointer-events-none fixed inset-0 hidden motion-safe:sm:block"
        style={{
          background: `radial-gradient(600px circle at ${glow.x}% ${glow.y}%, rgba(227,168,87,0.06), transparent 60%)`,
        }}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Nav */}
      {/* ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-[#1C2130]/80 bg-[#0B0E14]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-[#E3A857]" aria-hidden="true" />
            <span className="text-sm font-medium tracking-tight">Household Ops Agent</span>
          </div>
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-[#8B92A6] transition-colors hover:text-[#EDEEF2]">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-sm border border-[#232838] bg-[#12161F] px-3.5 py-1.5 text-sm font-medium text-[#EDEEF2] transition-colors hover:border-[#E3A857]/50 hover:bg-[#171C28]">
                Create household
              </button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Hero */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p
              className="text-xs uppercase tracking-[0.2em] text-[#E3A857]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Shared household coordination
            </p>
            <h1
              className="mt-5 max-w-xl text-[2.75rem] font-medium italic leading-[1.08] sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Every task in the house has somewhere to go.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#8B92A6]">
              Chores, groceries, bills, and the calendar — one quiet place to keep them, and an
              agent that notices what needs attention before anyone has to ask.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <SignUpButton mode="modal">
                <button className="group inline-flex items-center gap-2 bg-[#E3A857] px-5 py-3 text-sm font-semibold text-[#0B0E14] transition-transform hover:-translate-y-0.5">
                  Create your household
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-[#8B92A6] underline-offset-4 transition-colors hover:text-[#EDEEF2] hover:underline">
                  I already have one — sign in
                </button>
              </SignInButton>
            </div>
          </div>

          <Reveal>
            <HeroConsole />
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Flow */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-[#1C2130] bg-[#0B0E14]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8B92A6]" style={{ fontFamily: "var(--font-mono)" }}>
              How it actually works
            </p>
            <h2
              className="mt-3 max-w-lg text-3xl font-medium italic leading-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Not a to-do list. A loop that closes itself.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-px overflow-hidden border border-[#1C2130] sm:grid-cols-3">
            {FLOW_STEPS.map((s, i) => (
              <Reveal key={s.step} delay={i * 120}>
                <div className="h-full bg-[#0B0E14] p-6 sm:p-7">
                  <span
                    className="text-sm text-[#5FBFA0]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {s.step}
                  </span>
                  <h3 className="mt-4 text-xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
                    {s.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-[#8B92A6]">{s.detail}</p>
                  {i < FLOW_STEPS.length - 1 && (
                    <ChevronRight
                      className="mt-4 size-4 text-[#232838] sm:hidden"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Domains */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-[#1C2130]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8B92A6]" style={{ fontFamily: "var(--font-mono)" }}>
              Around the house
            </p>
            <h2
              className="mt-3 max-w-lg text-3xl font-medium italic leading-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Four rooms, one owner list.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {DOMAINS.map((d, i) => (
              <Reveal key={d.title} delay={i * 90}>
                <div
                  className="group relative h-full overflow-hidden border border-[#1C2130] bg-[#12161F] p-6 transition-colors hover:border-[#232838]"
                >
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
                    style={{ background: d.accent }}
                  />
                  <div className="relative flex items-center gap-3">
                    <d.icon className="size-5" style={{ color: d.accent }} aria-hidden="true" />
                    <span
                      className="text-[11px] uppercase tracking-[0.14em] text-[#8B92A6]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {d.room}
                    </span>
                  </div>
                  <h3 className="relative mt-4 text-xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
                    {d.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-6 text-[#8B92A6]">{d.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Before / after */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-[#1C2130] bg-[#0B0E14]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8B92A6]" style={{ fontFamily: "var(--font-mono)" }}>
              The difference
            </p>
            <h2
              className="mt-3 max-w-lg text-3xl font-medium italic leading-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Same house. Fewer group chats.
            </h2>
          </Reveal>

          <div className="mt-12 grid overflow-hidden border border-[#1C2130] sm:grid-cols-2">
            <Reveal className="border-b border-[#1C2130] p-7 sm:border-b-0 sm:border-r sm:p-9">
              <p
                className="text-[11px] uppercase tracking-[0.16em] text-[#8B92A6]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Without
              </p>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-[#8B92A6]">
                <li>Whoever notices the bill first pays it, or nobody does.</li>
                <li>Chores default to whoever feels guiltiest that week.</li>
                <li>Two calendars, three group chats, one missed dentist appointment.</li>
                <li>Grocery lists live in someone&apos;s head until they forget.</li>
              </ul>
            </Reveal>
            <Reveal delay={120} className="p-7 sm:p-9">
              <p
                className="text-[11px] uppercase tracking-[0.16em] text-[#5FBFA0]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                With the agent
              </p>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-[#EDEEF2]">
                <li>Bills are flagged with an owner before the due date, not after.</li>
                <li>Chores rotate on their own — the agent tracks who did what last.</li>
                <li>One calendar the agent reads, so conflicts get caught early.</li>
                <li>Anyone adds a grocery item; it&apos;s grouped by the next store run.</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-[#1C2130]">
        <div className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8">
          <Reveal>
            <h2
              className="mx-auto max-w-2xl text-3xl font-medium italic leading-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Set up the household once. Let it run itself.
            </h2>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-2 bg-[#E3A857] px-6 py-3.5 text-sm font-semibold text-[#0B0E14] transition-transform hover:-translate-y-0.5">
                  Create your household
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </SignUpButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Footer */}
      {/* ---------------------------------------------------------------- */}
      <footer className="border-t border-[#1C2130]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-[#8B92A6] sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <Bot className="size-4" aria-hidden="true" />
            <span>Household Ops Agent</span>
          </div>
          <span>Built for households of any size.</span>
        </div>
      </footer>
    </main>
  );
}
