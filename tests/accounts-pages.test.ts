import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import CrearCuenta from "../src/pages/crear-cuenta.astro";
import Entrar from "../src/pages/entrar.astro";
import Verificar from "../src/pages/verificar.astro";
import Recuperar from "../src/pages/recuperar.astro";
import Onboarding from "../src/pages/onboarding.astro";
import MisProyectos from "../src/pages/mis-proyectos.astro";
import Perfil from "../src/pages/perfil.astro";
import ProjectPage from "../src/pages/proyectos/[slug].astro";
import Feed from "../src/pages/anuncios.astro";
import PostPage from "../src/pages/anuncios/[id].astro";
import Notifications from "../src/pages/notificaciones.astro";
import Moderation from "../src/pages/anuncios/moderacion.astro";
import FounderPage from "../src/pages/founders/[id].astro";

async function render(component: Parameters<AstroContainer["renderToString"]>[0], params?: Record<string, string>, path = "/") {
  const container = await AstroContainer.create();
  return container.renderToString(component, { params, request: new Request(`http://localhost${path}`) });
}

describe("account screens", () => {
  it("keeps private screens out of search indexes", async () => {
    for (const page of [CrearCuenta, Entrar, Verificar, Recuperar, Onboarding, MisProyectos, Perfil]) {
      expect(await render(page)).toMatch(/<meta name="robots" content="noindex, nofollow">/);
    }
    expect(await render(FounderPage, { id: "acc_lucia" })).toMatch(/noindex/);
  });

  it("offers Google and email sign-up with captcha, terms and the 8-character hint", async () => {
    const html = await render(CrearCuenta);
    expect(html).toContain("Continuar con Google");
    expect(html).toContain("Mínimo 8 caracteres.");
    expect(html).toContain("No soy un robot");
    expect(html).toContain("Al crear tu cuenta aceptas");
    expect(html).toContain('href="/entrar"');
  });

  it("links sign-in to recovery and sign-up", async () => {
    const html = await render(Entrar);
    expect(html).toContain("Olvidé mi contraseña");
    expect(html).toContain('href="/crear-cuenta"');
  });

  it("asks for a six-digit code with a resend option", async () => {
    const html = await render(Verificar);
    expect(html).toMatch(/maxlength="6"/);
    expect(html).toContain("Reenviar código");
  });

  it("walks the four project steps and absorbs the community form questions", async () => {
    const html = await render(Onboarding);
    for (const step of ["Información", "Detalles", "Fundadores", "Revisión"]) expect(html).toContain(step);
    expect(html).toContain("¿Tienes un proyecto?");
    expect(html).toContain("Sí, registrarlo");
    expect(html).toContain("Aún no");
    expect(html).toContain("Autocompletar");
    expect(html).toContain("Guardar borrador");
    expect(html).toContain("¿Ya estás en el grupo de WhatsApp de la comunidad?");
    expect(html).toContain("Idea");
    expect(html).toContain("Primeros clientes");
    expect(html).toContain("Estamos buscando inversión");
  });

  it("shows the panel tabs and the profile contact visibility choices", async () => {
    const panel = await render(MisProyectos);
    for (const tab of ["Publicados", "Borradores", "Archivados"]) expect(panel).toContain(tab);
    const profile = await render(Perfil);
    expect(profile).toContain("Visible para registrados");
    expect(profile).toContain("Oculto");
    expect(profile).toContain("Eliminar mi cuenta");
  });

  it("offers the blog note in the profile with its price and reach", async () => {
    const html = await render(Perfil);
    expect(html).toContain('id="promociones"');
    expect(html).toContain("Nota en el blog de Asilo Digital");
    expect(html).toContain("$300");
    expect(html).toMatch(/1\.200|1,200/);
    expect(html).toContain("Continuar al pago");
    // No card fields: the payment is handled by a processor later.
    expect(html).not.toMatch(/autocomplete="cc-/);
  });

  it("indexes a seeded project page and sends unknown slugs to noindex", async () => {
    const known = await render(ProjectPage, { slug: "pana-pay" });
    expect(known).toContain("<title>Pana Pay | Asilo Builders</title>");
    expect(known).not.toContain("noindex");
    expect(known).toContain('"@type":"Organization"');
    expect(await render(ProjectPage, { slug: "no-existe" })).toContain("noindex");
  });

  it("never renders a founder's contact data on the server", async () => {
    const html = await render(FounderPage, { id: "acc_lucia" });
    expect(html).not.toMatch(/\+58 412 0000000|linkedin\.com\/in\/lucia|panapay\.example|lucia@example|Lucía Ferrer/);
  });

  it("keeps the feed screens private and shows the composer prompt", async () => {
    for (const page of [Feed, Notifications, Moderation]) {
      expect(await render(page)).toMatch(/<meta name="robots" content="noindex, nofollow">/);
    }
    expect(await render(PostPage, { id: "pst_x" })).toMatch(/noindex/);
    const feed = await render(Feed);
    expect(feed).toContain("¿Qué quiere contar tu proyecto?");
    expect(feed).toContain("Para publicar necesitas un proyecto publicado.");
    expect(feed).toContain("Cargar más anuncios");
  });

  it("keeps Anuncios out of the header: it lives in the member sidebar, first", async () => {
    const publicPage = await render(Entrar);
    expect(publicPage).not.toContain('href="/anuncios"');
    for (const page of [Feed, MisProyectos, Perfil, Notifications]) {
      const html = await render(page);
      const nav = html.match(/<nav class="member-nav"[\s\S]*?<\/nav>/)![0];
      const order = [...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      expect(order).toEqual(["/anuncios", "/mis-proyectos", "/perfil"]);
      expect(nav).not.toContain("/notificaciones"); // notifications live in the header
      const header = html.match(/<header class="site-header">[\s\S]*?<\/header>/)![0];
      expect(header).not.toContain('href="/anuncios"');
    }
  });

  it("puts the notifications bell in the header, shown only when signed in", async () => {
    const header = (await render(Entrar)).match(/<header class="site-header">[\s\S]*?<\/header>/)![0];
    expect(header).toMatch(/<a class="bell account-in" href="\/notificaciones"/);
    expect(header).toContain("data-notif-count");
  });

  it("marks the current member section", async () => {
    const nav = (await render(Feed, undefined, "/anuncios")).match(/<nav class="member-nav"[\s\S]*?<\/nav>/)![0];
    expect(nav).toMatch(/href="\/anuncios" aria-current="page"/);
  });

  it("renders no seeded post text on the server", async () => {
    expect(await render(Feed)).not.toContain("lista de espera para negocios");
  });
});
