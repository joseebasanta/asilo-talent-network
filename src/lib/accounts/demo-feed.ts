import { DEMO_PROJECTS } from "./demo-projects";

export type DemoReaction = "like" | "love" | "rocket" | "clap";
export type DemoLinkPreview = { url: string; host: string; title: string; description: string };
export type DemoPost = {
  id: string;
  author: string;
  project: string;
  projectId: string;
  text: string;
  createdAt: string;
  reactions: Partial<Record<DemoReaction, number>>;
  mine: DemoReaction | null;
  comments: string[];
  image?: string | null;
  preview?: DemoLinkPreview | null;
  hidden: boolean;
};

const seedPosts: DemoPost[] = [
  { id: "demo-post-pana", author: "Lucía Demo", project: "Pana Pay", projectId: "demo-pana-pay", text: "Cerramos una nueva alianza para hacer más simples los pagos de los comercios pequeños. 🚀", createdAt: "Hace 2 horas", reactions: { rocket: 4, like: 2 }, mine: null, comments: ["¡Qué buena noticia!"], hidden: false },
  { id: "demo-post-ruta", author: "Andrés Demo", project: "Ruta Viva", projectId: "demo-ruta-viva", text: "Estamos probando el flujo de seguimiento de entregas con tres negocios de Caracas.", createdAt: "Ayer", reactions: { like: 3 }, mine: null, comments: [], hidden: false },
];

const clone = () => seedPosts.map((post) => ({ ...post, reactions: { ...post.reactions }, comments: [...post.comments] }));
const result = (ok: boolean, error?: string) => ok ? { ok: true as const } : { ok: false as const, error: error ?? "No se pudo completar la acción." };
const previewFor = (text: string): DemoLinkPreview | null => {
  const match = text.match(/https?:\/\/[^\s<]+/i);
  if (!match) return null;
  try {
    const url = new URL(match[0]);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return { url: url.href, host: url.hostname, title: `Enlace a ${url.hostname}`, description: "Vista previa segura y sintética; no se consultó el sitio." };
  } catch { return null; }
};

export function createDemoFeed() {
  const posts = clone();
  const notifications: string[] = [];
  return {
    posts: () => posts.filter((post) => !post.hidden),
    feedPage: (cursor: number | null, size = 10) => {
      const visible = posts.filter((post) => !post.hidden);
      const start = cursor ?? 0;
      const page = visible.slice(start, start + size);
      const nextCursor = start + page.length < visible.length ? start + page.length : null;
      return { posts: page, nextCursor };
    },
    post: (id: string) => posts.find((post) => post.id === id && !post.hidden) ?? null,
    createPost: (projectId: string, input: { text: string; image?: string | null }) => {
      const project = publishedProjects.find((item) => item.id === projectId && item.founders.includes("Lucía Demo"));
      const text = input.text.trim();
      if (!project) return { ok: false as const, error: "Solo puedes publicar en un proyecto publicado que te pertenece." };
      if (!text) return { ok: false as const, error: "Escribe un anuncio." };
      if (text.length > 1000) return { ok: false as const, error: "El anuncio admite hasta 1000 caracteres." };
      if (input.image && !input.image.startsWith("data:image/")) return { ok: false as const, error: "La imagen de demo no es válida." };
      const post: DemoPost = { id: `demo-post-${posts.length + 1}`, author: "Lucía Demo", project: project.name, projectId, text, createdAt: "Ahora", reactions: {}, mine: null, comments: [], image: input.image ?? null, preview: previewFor(text), hidden: false };
      posts.unshift(post);
      return { ok: true as const, value: post };
    },
    delete: (id: string) => {
      const post = posts.find((item) => item.id === id && !item.hidden);
      if (!post || post.author !== "Lucía Demo") return result(false, "Solo puedes borrar tus propios anuncios.");
      post.hidden = true;
      return result(true);
    },
    react: (id: string, reaction: DemoReaction) => {
      const post = posts.find((item) => item.id === id && !item.hidden);
      if (!post) return null;
      if (post.mine === reaction) { post.reactions[reaction] = Math.max(0, (post.reactions[reaction] ?? 1) - 1); post.mine = null; return null; }
      if (post.mine) post.reactions[post.mine] = Math.max(0, (post.reactions[post.mine] ?? 1) - 1);
      post.mine = reaction; post.reactions[reaction] = (post.reactions[reaction] ?? 0) + 1; notifications.push("reacción"); return reaction;
    },
    comment: (id: string, text: string) => {
      const post = posts.find((item) => item.id === id && !item.hidden);
      const clean = text.trim();
      if (!post) return result(false, "El anuncio ya no está disponible.");
      if (!clean) return result(false, "Escribe un comentario.");
      if (clean.length > 500) return result(false, "El comentario admite hasta 500 caracteres.");
      post.comments.push(clean); notifications.push("comentario"); return result(true);
    },
    report: (id: string) => posts.some((post) => post.id === id && !post.hidden) ? result(true) : result(false, "El anuncio ya no está disponible."),
    resolve: (id: string, action: "hide" | "dismiss") => {
      const post = posts.find((item) => item.id === id);
      if (!post) return false;
      if (action === "hide") post.hidden = true;
      return true;
    },
    notifications: () => [...notifications],
  };
}

const publishedProjects = DEMO_PROJECTS.filter((project) => project.status === "published");

export function createDemoPromotion() {
  const orders: Array<{ id: string; projectId: string; brief: string; status: "pending_payment" | "paid" }> = [];
  return {
    create(projectId: string, brief: string) {
      if (!publishedProjects.some((project) => project.id === projectId && project.founders.includes("Lucía Demo"))) return { ok: false as const, error: "Solo puedes promocionar un proyecto publicado que te pertenece." };
      const clean = brief.trim();
      if (!clean || clean.length < 20) return { ok: false as const, error: "Cuéntanos qué quieres destacar (mínimo 20 caracteres)." };
      if (clean.length > 600) return { ok: false as const, error: "El mensaje admite hasta 600 caracteres." };
      const order = { id: `demo-order-${orders.length + 1}`, projectId, brief: clean, status: "pending_payment" as const };
      orders.push(order); return { ok: true as const, value: order };
    },
    checkout(id: string) { return orders.find((order) => order.id === id) ? "Pago simulado · no se procesa dinero real." : "Solicitud no encontrada."; },
    pay(id: string) { const order = orders.find((item) => item.id === id); if (!order) throw new Error("Solicitud no encontrada."); order.status = "paid"; return order; },
    cancel(id: string) { const index = orders.findIndex((item) => item.id === id); if (index >= 0) orders.splice(index, 1); },
    orders: () => [...orders],
    source: () => "memoria sintética; sin red, credenciales ni servicios externos",
  };
}
