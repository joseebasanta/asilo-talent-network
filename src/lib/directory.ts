/**
 * Application service for the "Proyectos" directory: loads the approved
 * projects (Google Sheet) and sorts them. Pages, the refresh partial and the
 * JSON API all go through here, so there is exactly one definition of "what
 * the directory shows".
 */

import type { Project } from "../data/projects";
import { loadApprovedProjects } from "./projects-loader";
import { parseSortMode, sortProjects, type SortMode } from "./project-sort";

/** `?orden=` → sort mode; unknown values fall back to A–Z. */
export function resolveSort(raw: string | null | undefined): SortMode {
  return parseSortMode(raw);
}

/** Approved projects in the requested order. */
export async function loadDirectory(sort: SortMode): Promise<Project[]> {
  return sortProjects(await loadApprovedProjects(), sort);
}

/** One approved project by public id, or `null`. */
export async function findProject(id: string): Promise<Project | null> {
  const projects = await loadApprovedProjects();
  return projects.find((project) => project.id === id) ?? null;
}
