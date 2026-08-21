import AsciiBackground from "./AsciiBackground";

/**
 * AsiloBuildersHero
 * -----------------
 * Full-screen hero for the Asilo Builders community. An interactive ASCII
 * canvas (El Ávila + Caracas skyline) sits at z-0; the header and centered
 * hero content sit at z-10 over a vignette that keeps the copy legible.
 *
 * To use a real photo instead of the procedural skyline, pass a src:
 *   <AsciiBackground src="/images/avila.jpg" />
 * The luminance mapping self-adjusts to photographs.
 */

const NAV = [
  { label: "Comunidad", href: "#comunidad" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Talent Network", href: "#talent" },
];

export default function AsiloBuildersHero() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0b]">
      {/* z-0 — ASCII background (El Ávila photo, inverted so it reads on a
          black sky). Omit src+invert to fall back to the procedural skyline. */}
      <AsciiBackground src="/3_avila.png" invert />

      {/* z-1 — vignette so centered content stays legible */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 1,
          background:
            "radial-gradient(100% 72% at 50% 42%, rgba(10,10,11,.92) 0%, rgba(10,10,11,.6) 30%, rgba(10,10,11,.22) 62%, rgba(10,10,11,.4) 100%)",
        }}
      />

      {/* z-10 — foreground */}
      <div className="relative z-10 flex min-h-screen w-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6">
          <div className="text-sm tracking-[0.14em] text-gray-400">
            <span className="font-bold text-white">ASILO</span> BUILDERS
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs uppercase tracking-[0.12em] text-gray-400 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href="#unete"
            className="rounded-md border border-white/20 px-4 py-2 text-sm tracking-wide text-white transition-colors hover:border-white/50 hover:bg-white/5"
          >
            ÚNETE ↗
          </a>
        </header>

        {/* Hero content */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl">
            La comunidad de
            <br />
            builders de Venezuela
          </h1>

          <h2 className="mt-6 max-w-3xl text-balance text-lg font-normal leading-relaxed text-gray-400 md:text-xl">
            Un espacio para developers, diseñadores y founders venezolanos que
            se conocen, se apoyan y construyen juntos. Impulsado por Asilo Digital
          </h2>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#unete"
              className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
            >
              Únete a la comunidad ↗
            </a>
            <a
              href="#proyectos"
              className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Ver proyectos
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
