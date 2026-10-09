// Full-screen frame for /login and /register: a looping wordmark ribbon on top
// and one narrow centered form, like the Threads sign-in page. Colours come
// from the theme tokens, so light and dark both work.
import { BrandLogo } from "@/components/brand-logo";

export const authInputClass =
  "h-14 w-full rounded-2xl border border-line bg-card px-4 text-base outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const authButtonClass =
  "h-14 w-full rounded-2xl bg-accent text-base font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

function Ribbon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 320"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none absolute inset-x-0 top-0 h-[max(18rem,27vw)] w-full select-none"
    >
      <defs>
        <path
          id="matee-ribbon"
          d="M-60 60 C 120 -40, 260 170, 420 110 S 640 -30, 780 90 S 980 250, 1080 90 S 1220 20, 1280 140"
        />
        <path
          id="matee-ribbon-2"
          d="M-60 190 C 140 300, 300 90, 480 200 S 700 330, 860 200 S 1040 60, 1280 230"
        />
      </defs>
      <g fontWeight="800" fontSize="46" letterSpacing="3">
        <text fill="var(--brand)">
          <textPath href="#matee-ribbon">
            MATEE · มาตี้กัน · MATEE · มาตี้กัน · MATEE · มาตี้กัน · MATEE · มาตี้กัน ·
          </textPath>
        </text>
        <text fill="var(--muted)" opacity="0.7">
          <textPath href="#matee-ribbon-2">
            มาตี้กัน · MATEE · มาตี้กัน · MATEE · มาตี้กัน · MATEE · มาตี้กัน · MATEE ·
          </textPath>
        </text>
      </g>
    </svg>
  );
}

export function AuthShell({ title, children }) {
  return (
    <main className="relative flex min-h-screen w-full flex-1 flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-[max(16rem,24vw)]">
      <Ribbon />
      <section className="relative w-full max-w-[25.5rem]">
        <div className="mb-4 flex justify-center">
          <BrandLogo variant="icon" className="h-14 w-auto" priority />
        </div>
        <h1 className="mb-6 text-center text-base font-semibold">{title}</h1>
        {children}
      </section>
    </main>
  );
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-4 text-sm text-muted" role="separator">
      <span className="h-px flex-1 bg-line" />
      หรือ
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
