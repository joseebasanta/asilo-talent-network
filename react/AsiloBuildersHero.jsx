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
  blue500: "#CEE2FF", // brand accent / primary button / outlined buttons
  blue700: "#92A0B5", // paragraph / nav
  blue800: "#717C8C", // header bottom stroke
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

/** Pixel smile (pixelarticons) used in the CTA + header buttons. Inherits the
 *  button's text color via `currentColor`. */
function Smiley({ className = "" }) {
  return (
    <svg
      viewBox="0 0 17 17"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ width: "1.15em", height: "1.15em", flex: "none", verticalAlign: "middle" }}
    >
      <path
        d="M4.8 13.1H13.2V14.5H4.8V13.1ZM4.8 0.5H13.2V1.9H4.8V0.5ZM13.2 1.9H14.6V3.3H13.2V1.9ZM3.4 1.9H4.8V3.3H3.4V1.9ZM3.4 11.7H4.8V13.1H3.4V11.7ZM13.2 11.7H14.6V13.1H13.2V11.7ZM2 3.3H3.4V11.7H2V3.3ZM14.6 3.3H16V11.7H14.6V3.3ZM5.5 8.2H6.9V9.6H5.5V8.2ZM6.9 9.6H11.1V11H6.9V9.6ZM11.1 8.2H12.5V9.6H11.1V8.2ZM6.2 4.7H7.6V6.1H6.2V4.7ZM10.4 4.7H11.8V6.1H10.4V4.7Z"
        fill="currentColor"
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
        {/* Header — full-width bar with a bottom stroke; content capped at 1280 */}
        <header className="w-full" style={{ borderBottom: `0.5px solid ${C.blue800}` }}>
        <div
          className="mx-auto flex w-full items-center justify-between"
          style={{ maxWidth: 1280, padding: "22px clamp(20px,4vw,64px)" }}
        >
          {/* Uploaded pixel wordmark (Blue Builder palette). Put the SVG in
              your app's public folder; rename the space out of the filename. */}
          <a href="#" aria-label="Asilo Builders" className="inline-flex items-center">
            <img
              src="/logo-asilo-builders.svg"
              alt="Asilo Builders"
              style={{ height: 20, width: "auto", display: "block" }}
            />
          </a>

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

          {/* Header button — Figma: 1px blue-500 border + text, radius 8, 4/16 */}
          <a
            href="#unete"
            className="inline-flex items-center transition-colors"
            style={{
              gap: 8,
              fontWeight: 500,
              fontSize: 16,
              lineHeight: "24px",
              letterSpacing: "-0.011em",
              textTransform: "uppercase",
              color: C.blue500,
              textDecoration: "none",
              border: `1px solid ${C.blue500}`,
              borderRadius: 8,
              padding: "4px 16px",
            }}
          >
            Únete <Smiley />
          </a>
        </div>
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
              // H1 Title — Black. Doto's weight axis has default = max = 900, and
              // Chrome's font-weight→axis mapping flattens that to a thin instance,
              // so drive the weight through the variation axis directly instead.
              fontVariationSettings: '"wght" 900',
              fontSize: "clamp(2.4rem,5.4vw,64px)",
              lineHeight: 1.0,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: C.blue500,
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
              margin: "24px 0 0", // title → paragraph: 24px
              textWrap: "balance",
            }}
          >
            Un espacio para developers, diseñadores y emprendedores que se conocen, se apoyan y
            construyen con IA juntos. Impulsado por Asilo Digital.
          </h2>

          <div
            className="flex flex-wrap items-center justify-center"
            style={{ gap: 16, marginTop: 32 }} // paragraph → buttons: 32px
          >
            <a href="#unete" className="inline-flex items-center" style={btn(C.blue500, "#000A11")}>
              Únete a la comunidad <Smiley />
            </a>
            <a
              href="#proyectos"
              className="inline-flex items-center"
              style={btn("transparent", C.blue500, C.blue500)}
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
    borderRadius: 8,
    padding: "12px 24px",
    textDecoration: "none",
    cursor: "pointer",
    border: "1px solid " + borderColor,
    background,
    color,
  };
}
