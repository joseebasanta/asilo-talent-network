export type DemoProjectStatus = "published" | "draft" | "archived";

export type DemoInvitation = {
  id: string;
  projectId: string;
  recipient: "Marta Demo" | "Andrés Demo";
  role: "Founder" | "Cofounder";
  status: "pending" | "accepted" | "revoked";
};

export type DemoProject = {
  id: string;
  name: string;
  slug: string;
  short: string;
  sector: string;
  stage: string;
  status: DemoProjectStatus;
  seekingInvestment: boolean;
  founders: string[];
};

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: "demo-pana-pay", name: "Pana Pay", slug: "pana-pay",
    short: "Cobros y pagos simples para negocios pequeños.", sector: "Fintech", stage: "Primeros clientes",
    status: "published", seekingInvestment: true, founders: ["Lucía Demo", "Andrés Demo"],
  },
  {
    id: "demo-ruta-viva", name: "Ruta Viva", slug: "ruta-viva",
    short: "Seguimiento de entregas de última milla con WhatsApp.", sector: "Logística", stage: "MVP",
    status: "draft", seekingInvestment: false, founders: ["Lucía Demo"],
  },
  {
    id: "demo-aula-abierta", name: "Aula Abierta", slug: "aula-abierta",
    short: "Tutorías en línea para estudiantes venezolanos.", sector: "Educación", stage: "Idea",
    status: "archived", seekingInvestment: false, founders: ["Marta Demo"],
  },
];

export const DEMO_INVITATIONS: DemoInvitation[] = [];

export function updateDemoProject(id: string, patch: Partial<Pick<DemoProject, "name" | "short" | "sector" | "stage" | "seekingInvestment">>): DemoProject {
  const project = getDemoProject(id);
  if (!project) throw new Error("Proyecto demo no encontrado");
  Object.assign(project, patch);
  return project;
}

export function updateDemoProjectStatus(id: string, status: DemoProjectStatus): DemoProject {
  const project = DEMO_PROJECTS.find((item) => item.id === id);
  if (!project) throw new Error("Proyecto demo no encontrado");
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

export function createDemoInvitation(projectId: string, recipient: DemoInvitation["recipient"], role: DemoInvitation["role"]): DemoInvitation {
  if (!getDemoProject(projectId)) throw new Error("Proyecto demo no encontrado");
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
  invitation.status = "accepted";
  return { ...invitation, founders: project.founders };
}
