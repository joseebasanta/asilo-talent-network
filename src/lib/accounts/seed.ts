import { previewFor } from "./link-preview";
import type { Account, Comment, Post, Project, Reaction, StoreState } from "./types";

const noContact = { value: "", visibility: "registrados" as const };

function account(id: string, name: string, email: string, city: string, role: Account["role"], bio: string, extra: Partial<Account> = {}): Account {
  return {
    id, name, email, emailVerified: true, password: null, hasGoogle: true, photo: null,
    city, country: "Venezuela", role, bio, inWhatsappGroup: true,
    contacts: {
      phone: { ...noContact }, contactEmail: { ...noContact },
      linkedin: { ...noContact }, x: { ...noContact },
    },
    onboarded: true, createdAt: Date.UTC(2026, 8, 1),
    ...extra,
  };
}

/** Fictional people and projects so every screen has something to show. */
export function seedState(): StoreState {
  const lucia = account("acc_lucia", "Lucía Ferrer", "lucia@example.com", "Caracas", "founder",
    "Construyo herramientas de pago para negocios pequeños. Antes, ingeniera en banca.", {
      // Demo login: lucia@example.com / demo12345 (the other seed people enter with Google only).
      password: "demo12345",
      contacts: {
        phone: { value: "+58 412 0000000", visibility: "registrados" },
        contactEmail: { value: "hola@panapay.example", visibility: "registrados" },
        linkedin: { value: "https://www.linkedin.com/in/lucia-ferrer", visibility: "registrados" },
        x: { value: "", visibility: "oculto" },
      },
    });
  const andres = account("acc_andres", "Andrés Rojas", "andres@example.com", "Valencia", "cofounder",
    "Desarrollo backend y automatización. Me gusta la logística.", {
      contacts: {
        phone: { value: "", visibility: "oculto" },
        contactEmail: { value: "", visibility: "oculto" },
        linkedin: { value: "https://www.linkedin.com/in/andres-rojas", visibility: "registrados" },
        x: { value: "https://x.com/andresrojas", visibility: "registrados" },
      },
    });
  const marta = account("acc_marta", "Marta Soto", "marta@example.com", "Madrid", "diseno",
    "Diseñadora de producto en la diáspora. Hago interfaces claras para gente que no es técnica.");

  const base = { previousSlugs: [], logo: null, long: "", socials: { instagram: "", tiktok: "", x: "", linkedin: "" }, status: "published" as const, createdAt: Date.UTC(2026, 8, 10) };
  const projects: Project[] = [
    {
      ...base, id: "prj_panapay", slug: "pana-pay", name: "Pana Pay", website: "https://panapay.example",
      short: "Cobros y pagos simples para negocios pequeños de Venezuela.",
      long: "Pana Pay permite a un negocio pequeño cobrar con un enlace, conciliar sus pagos y entender su caja sin hojas de cálculo.",
      sector: "Fintech", stage: "Primeros clientes", seekingInvestment: true, city: "Caracas",
      founders: [{ accountId: "acc_lucia", role: "founder", admin: true }, { accountId: "acc_andres", role: "cofounder", admin: false }],
    },
    {
      ...base, id: "prj_ruta", slug: "ruta-viva", name: "Ruta Viva", website: "https://rutaviva.example",
      short: "Seguimiento de entregas de última milla con WhatsApp.",
      long: "", sector: "Logística", stage: "MVP", seekingInvestment: false, city: "Valencia",
      founders: [{ accountId: "acc_andres", role: "founder", admin: true }],
    },
    {
      ...base, id: "prj_aula", slug: "aula-abierta", name: "Aula Abierta", website: "https://aulaabierta.example",
      short: "Tutorías en línea para estudiantes venezolanos, dentro y fuera del país.",
      long: "", sector: "Educación", stage: "Idea", seekingInvestment: false, city: "Madrid",
      founders: [{ accountId: "acc_marta", role: "founder", admin: true }],
    },
  ];

  const { posts, reactions, comments } = seedFeed();
  return {
    version: 1,
    accounts: [lucia, andres, marta],
    projects,
    invitations: [],
    sessionAccountId: null,
    pendingVerification: null,
    onboarding: {},
    posts, reactions, comments, notifications: [], reports: [], promotions: [],
  };
}

/** Enough posts to exercise the infinite scroll (page size 10). */
function seedFeed(): { posts: Post[]; reactions: Reaction[]; comments: Comment[] } {
  const now = Date.now();
  const H = 3_600_000;
  const lines: Array<[string, string, string, string]> = [
    ["prj_panapay", "acc_lucia", "Abrimos la lista de espera para negocios en Caracas y Valencia. Si cobras por WhatsApp, queremos hablar contigo.", ""],
    ["prj_ruta", "acc_andres", "Buscamos a alguien de diseño para pulir el seguimiento de entregas. Es trabajo remoto y por proyecto.", ""],
    ["prj_aula", "acc_marta", "Primeras 20 tutorías completadas. Gracias a quienes se sumaron como tutores.", ""],
    ["prj_panapay", "acc_andres", "Nueva versión: conciliación automática de pagos. Lo contamos en detalle en panapay.example/novedades", ""],
    ["prj_ruta", "acc_andres", "Pasamos de 50 a 300 entregas semanales sin cambiar el equipo.", ""],
    ["prj_aula", "acc_marta", "¿Alguien en la diáspora quiere dar una clase de programación a adolescentes? Escríbenos.", ""],
    ["prj_panapay", "acc_lucia", "Estamos preparando una ronda semilla. Si inviertes en fintech en Latinoamérica, hablemos.", ""],
    ["prj_ruta", "acc_andres", "Integramos mapas sin conexión para zonas con mala señal.", ""],
    ["prj_aula", "acc_marta", "Publicamos el temario de matemáticas para bachillerato: aulaabierta.example/temario", ""],
    ["prj_panapay", "acc_lucia", "Cumplimos tres meses con clientes de pago. Lo que aprendimos, en un hilo corto.", ""],
    ["prj_ruta", "acc_andres", "Buscamos un cofundador comercial con experiencia en distribución.", ""],
    ["prj_aula", "acc_marta", "Aula Abierta ya tiene página en Builders. ¡Pásate!", ""],
    ["prj_panapay", "acc_andres", "Corregimos un error en los enlaces de cobro. Gracias por avisar.", ""],
  ];
  const posts: Post[] = lines.map(([projectId, authorId, text], i) => ({
    id: `pst_seed${String(i).padStart(2, "0")}`, projectId, authorId, text, image: null, preview: previewFor(text),
    createdAt: now - (i + 1) * 5 * H, editedAt: null, hidden: false,
  }));
  const reactions: Reaction[] = [
    { postId: "pst_seed00", accountId: "acc_andres", kind: "rocket" },
    { postId: "pst_seed00", accountId: "acc_marta", kind: "clap" },
    { postId: "pst_seed02", accountId: "acc_lucia", kind: "love" },
  ];
  const comments: Comment[] = [
    { id: "cmt_seed0", postId: "pst_seed00", authorId: "acc_marta", text: "¡Qué buena noticia! Te escribo por privado.", createdAt: now - 4 * H },
    { id: "cmt_seed1", postId: "pst_seed01", authorId: "acc_lucia", text: "Conozco a alguien, te la presento.", createdAt: now - 8 * H },
  ];
  return { posts, reactions, comments };
}
