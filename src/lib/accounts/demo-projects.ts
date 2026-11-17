export type DemoProjectStatus = "published" | "draft" | "archived";

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

export function updateDemoProjectStatus(id: string, status: DemoProjectStatus): DemoProject {
  const project = DEMO_PROJECTS.find((item) => item.id === id);
  if (!project) throw new Error("Proyecto demo no encontrado");
  project.status = status;
  return project;
}

export function getDemoProject(id: string): DemoProject | undefined {
  return DEMO_PROJECTS.find((project) => project.id === id);
}
