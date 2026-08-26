import { useRef } from "react";
import AsciiBackground from "./AsciiBackground";
import CursorTrail from "./CursorTrail";

/**
 * AsiloBuildersHero
 * -----------------
 * Full-screen hero for the Asilo Builders community, matching the Figma hero
 * (text, layout and colors) laid over the interactive true-tone ASCII El Ávila
 * background. The ASCII canvas sits at z-0; a vignette (z-1) keeps the copy
 * legible; the header and upper-middle hero content sit at z-10. An ASCII
 * cursor trail (z-9999) follows the pointer over the hero.
 *
 * Colors come from the Figma "Blue Builder" scale; type from Doto (title) +
 * Google Sans Flex (everything else). Load the fonts once in your app head:
 *   <link href="https://fonts.googleapis.com/css2?family=Doto:wght@100..900&family=Google+Sans+Flex:wght@400..700&display=swap" rel="stylesheet">
 */

// ---- Figma "Blue Builder" tokens ----
const C = {
  blue50: "#FAFCFF", // title / on-dark text
  blue500: "#CEE2FF", // brand accent / primary button
  blue700: "#92A0B5", // paragraph / nav
  bg: "#0a0a0b",
};
const TITLE_FONT = '"Doto", system-ui, monospace';
const SANS = '"Google Sans Flex", system-ui, -apple-system, "Segoe UI", sans-serif';

const NAV = [
  { label: "Comunidad", href: "#comunidad" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Talent Network", href: "#talent" },
];

/** Outline smiley glyph used in the CTA + header buttons. */
function Smiley({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ width: "1.15em", height: "1.15em", flex: "none", verticalAlign: "middle" }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10.5" r="1.05" fill="currentColor" />
      <circle cx="15" cy="10.5" r="1.05" fill="currentColor" />
      <path
        d="M8.5 14.3c.95 1.15 2.1 1.7 3.5 1.7s2.55-.55 3.5-1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AsiloBuildersHero() {
  const heroRef = useRef(null);

  return (
    <div
      ref={heroRef}
      className="relative w-full overflow-hidden"
      style={{ minHeight: "100svh", background: C.bg, fontFamily: SANS }}
    >
      {/* z-0 — true-tone ASCII background (El Ávila photo). Omit src for the
          procedural skyline fallback. */}
      <AsciiBackground src="/8_avila.png" ink="#6f7075" blue={C.blue500} background={C.bg} />

      {/* ASCII cursor trail, scoped to the hero (z-9999, above everything) */}
      <CursorTrail boundsRef={heroRef} ink={C.blue500} />

      {/* z-1 — vignette so centered content stays legible */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 1,
          background:
            "radial-gradient(100% 72% at 50% 42%, rgba(10,10,11,.92) 0%, rgba(10,10,11,.6) 30%, rgba(10,10,11,.22) 62%, rgba(10,10,11,.4) 100%)",
        }}
      />

      {/* z-10 — foreground */}
      <div
        className="relative flex w-full flex-col"
        style={{ zIndex: 10, minHeight: "100svh" }}
      >
        {/* Header — container-large 1280 · page padding 64 */}
        <header
          className="mx-auto flex w-full items-center justify-between"
          style={{ maxWidth: 1280, padding: "22px clamp(20px,4vw,64px)" }}
        >
          <div
            style={{
              fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace',
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.blue50,
            }}
          >
            Asilo Builders
          </div>

          <nav className="hidden md:flex" style={{ gap: 34 }}>
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors"
                style={{
                  fontWeight: 500,
                  fontSize: 12,
                  lineHeight: "16px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: C.blue700,
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.blue50)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.blue700)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href="#unete"
            className="inline-flex items-center transition-colors"
            style={{
              gap: ".5em",
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: C.blue50,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,.22)",
              borderRadius: 12,
              padding: "10px 16px",
            }}
          >
            Únete <Smiley />
          </a>
        </header>

        {/* Hero content — upper-middle, matching Figma */}
        <main
          className="flex flex-1 flex-col items-center text-center"
          style={{
            justifyContent: "flex-start",
            padding: "clamp(72px,15vh,150px) clamp(20px,4vw,64px) 6rem",
          }}
        >
          <h1
            style={{
              fontFamily: TITLE_FONT,
              fontWeight: 500,
              fontSize: "clamp(2.4rem,5.4vw,64px)",
              lineHeight: 1.06,
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              color: C.blue50,
              maxWidth: "22ch",
              margin: 0,
            }}
          >
            La comunidad de
            <br />
            builders de Venezuela
          </h1>

          <h2
            style={{
              fontWeight: 400,
              fontSize: 16,
              lineHeight: "24px",
              letterSpacing: "-0.011em",
              color: C.blue700,
              maxWidth: 750,
              margin: "36px 0 0",
              textWrap: "balance",
            }}
          >
            Un espacio para developers, diseñadores y emprendedores que se conocen, se apoyan y
            construyen con IA juntos. Impulsado por Asilo Digital.
          </h2>

          <div
            className="flex flex-wrap items-center justify-center"
            style={{ gap: 16, marginTop: 44 }}
          >
            <a href="#unete" className="inline-flex items-center" style={btn(C.blue500, "#000A11")}>
              Únete a la comunidad <Smiley />
            </a>
            <a
              href="#proyectos"
              className="inline-flex items-center"
              style={btn("transparent", C.blue50, "rgba(255,255,255,.22)")}
            >
              Ver proyectos
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Shared button style — Label/Medium type, radius 12. */
function btn(background, color, borderColor = "transparent") {
  return {
    gap: ".5em",
    fontFamily: SANS,
    fontWeight: 500,
    fontSize: 16,
    lineHeight: "24px",
    letterSpacing: "-0.011em",
    textTransform: "uppercase",
    borderRadius: 12,
    padding: "14px 24px",
    textDecoration: "none",
    cursor: "pointer",
    border: "1px solid " + borderColor,
    background,
    color,
  };
}
