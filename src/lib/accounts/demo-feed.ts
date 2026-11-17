export type DemoReaction = "like" | "love" | "rocket" | "clap";
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
  hidden: boolean;
};

const seedPosts: DemoPost[] = [
  { id: "demo-post-pana", author: "Lucía Demo", project: "Pana Pay", projectId: "demo-pana-pay", text: "Cerramos una nueva alianza para hacer más simples los pagos de los comercios pequeños. 🚀", createdAt: "Hace 2 horas", reactions: { rocket: 4, like: 2 }, mine: null, comments: ["¡Qué buena noticia!"], hidden: false },
  { id: "demo-post-ruta", author: "Andrés Demo", project: "Ruta Viva", projectId: "demo-ruta-viva", text: "Estamos probando el flujo de seguimiento de entregas con tres negocios de Caracas.", createdAt: "Ayer", reactions: { like: 3 }, mine: null, comments: [], hidden: false },
];

const clone = () => seedPosts.map((post) => ({ ...post, reactions: { ...post.reactions }, comments: [...post.comments] }));
const result = (ok: boolean, error?: string) => ok ? { ok: true as const } : { ok: false as const, error: error ?? "No se pudo completar la acción." };

export function createDemoFeed() {
  const posts = clone();
  const notifications: string[] = [];
  return {
    posts: () => posts.filter((post) => !post.hidden),
    post: (id: string) => posts.find((post) => post.id === id && !post.hidden) ?? null,
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

export function createDemoPromotion() {
  const orders: Array<{ id: string; projectId: string; brief: string; status: "pending_payment" | "paid" }> = [];
  return {
    create(projectId: string, brief: string) {
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
