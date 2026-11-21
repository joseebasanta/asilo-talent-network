export type DemoProjectStatus = "published" | "draft" | "archived";

export type DemoInvitation = {
  id: string;
  projectId: string;
  recipient: "Marta Demo" | "Andrés Demo";
  role: "Founder" | "Cofounder";
  status: "pending" | "accepted" | "revoked";
};

export type DemoSocials = { instagram: string; tiktok: string; x: string; linkedin: string };

export type DemoProject = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string;
  short: string;
  long: string;
  sector: string;
  stage: string;
  city: string;
  socials: DemoSocials;
  status: DemoProjectStatus;
  seekingInvestment: boolean;
  owner: string;
  founders: string[];
  founderRoles: Record<string, "Founder" | "Cofounder" | "Equipo">;
};

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: "demo-pana-pay", name: "Pana Pay", slug: "pana-pay", logo: null, website: "https://pana-pay.demo",
    short: "Cobros y pagos simples para negocios pequeños.", long: "", sector: "Fintech", stage: "Primeros clientes", city: "Caracas",
    socials: { instagram: "", tiktok: "", x: "", linkedin: "" }, status: "published", seekingInvestment: true,
    owner: "Lucía Demo", founders: ["Lucía Demo", "Andrés Demo"], founderRoles: { "Lucía Demo": "Founder", "Andrés Demo": "Cofounder" },
  },
  {
    id: "demo-ruta-viva", name: "Ruta Viva", slug: "ruta-viva", logo: null, website: "https://ruta-viva.demo",
    short: "Seguimiento de entregas de última milla con WhatsApp.", long: "", sector: "Logística", stage: "MVP", city: "",
    socials: { instagram: "", tiktok: "", x: "", linkedin: "" }, status: "draft", seekingInvestment: false,
    owner: "Lucía Demo", founders: ["Lucía Demo"], founderRoles: { "Lucía Demo": "Founder" },
  },
  {
    id: "demo-aula-abierta", name: "Aula Abierta", slug: "aula-abierta", logo: null, website: "https://aula-abierta.demo",
    short: "Tutorías en línea para estudiantes venezolanos.", long: "", sector: "Educación", stage: "Idea", city: "",
    socials: { instagram: "", tiktok: "", x: "", linkedin: "" }, status: "archived", seekingInvestment: false,
    owner: "Marta Demo", founders: ["Marta Demo"], founderRoles: { "Marta Demo": "Founder" },
  },
];

export const DEMO_INVITATIONS: DemoInvitation[] = [];

export function canManageDemoProject(id: string, actor = "Lucía Demo"): boolean {
  return getDemoProject(id)?.owner === actor;
}

export function updateDemoProject(id: string, patch: Partial<Pick<DemoProject, "name" | "slug" | "logo" | "website" | "short" | "long" | "sector" | "stage" | "city" | "socials" | "seekingInvestment">>): DemoProject {
  const project = getDemoProject(id);
  if (!project) throw new Error("Proyecto demo no encontrado");
  Object.assign(project, patch);
  return project;
}

export function updateDemoProjectStatus(id: string, status: DemoProjectStatus, actor = "Lucía Demo"): DemoProject {
  const project = DEMO_PROJECTS.find((item) => item.id === id);
  if (!project) throw new Error("Proyecto demo no encontrado");
  if (!canManageDemoProject(id, actor)) throw new Error("Solo el administrador puede cambiar el estado del proyecto demo");
  project.status = status;
  return project;
}

export function getDemoProject(id: string): DemoProject | undefined {
  return DEMO_PROJECTS.find((project) => project.id === id);
}

export function getPublishedDemoProjects(): DemoProject[] {
  return DEMO_PROJECTS.filter((project) => project.status === "published");
}

export function getDemoInvitations(projectId: string): DemoInvitation[] {
  return DEMO_INVITATIONS.filter((invitation) => invitation.projectId === projectId && invitation.status !== "revoked");
}

export function createDemoInvitation(projectId: string, recipient: DemoInvitation["recipient"], role: DemoInvitation["role"], actor = "Lucía Demo"): DemoInvitation {
  if (!getDemoProject(projectId)) throw new Error("Proyecto demo no encontrado");
  if (!canManageDemoProject(projectId, actor)) throw new Error("Solo el administrador puede invitar cofundadores en el demo");
  const existing = DEMO_INVITATIONS.find((invitation) => invitation.projectId === projectId && invitation.recipient === recipient && invitation.status === "pending");
  if (existing) return existing;
  const invitation: DemoInvitation = { id: `demo-invite-${DEMO_INVITATIONS.length + 1}`, projectId, recipient, role, status: "pending" };
  DEMO_INVITATIONS.push(invitation);
  return invitation;
}

export function revokeDemoInvitation(id: string): DemoInvitation {
  const invitation = DEMO_INVITATIONS.find((item) => item.id === id);
  if (!invitation) throw new Error("Invitación demo no encontrada");
  invitation.status = "revoked";
  return invitation;
}

export function acceptDemoInvitation(id: string): DemoInvitation & { founders: string[] } {
  const invitation = DEMO_INVITATIONS.find((item) => item.id === id);
  if (!invitation || invitation.status !== "pending") throw new Error("Invitación demo no disponible");
  const project = getDemoProject(invitation.projectId);
  if (!project) throw new Error("Proyecto demo no encontrado");
  if (!project.founders.includes(invitation.recipient)) project.founders.push(invitation.recipient);
  project.founderRoles[invitation.recipient] = invitation.role;
  invitation.status = "accepted";
  return { ...invitation, founders: project.founders };
}
