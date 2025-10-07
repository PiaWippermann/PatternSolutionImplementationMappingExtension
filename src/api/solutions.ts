/**
 * Solution Implementation API
 * 
 * High-level functions for working with solution implementation discussions.
 */

import { createDiscussion } from "./queries/discussions";
import { parseSolutionBody, createSolutionBody, addMappingToSolutionBody } from "./parsers";
import type { SolutionImplementation } from "../types/DiscussionData";
import type { BaseDiscussion } from "../types/GitHub";

/**
 * Creates a new solution implementation discussion
 */
export async function createSolution({
  repositoryId,
  categoryId,
  title,
  description,
  solutionsUrl,
}: {
  repositoryId: string;
  categoryId: string;
  title: string;
  description: string;
  solutionsUrl: string;
}): Promise<SolutionImplementation> {
  const body = createSolutionBody({
    description,
    solutionsUrl,
    title,
  });

  const response = await createDiscussion(repositoryId, categoryId, title, body);

  return {
    ...response,
    title,
    description,
    solutionRefUrl: solutionsUrl,
    mappings: [],
  };
}

/**
 * Parses a solution implementation discussion to extract structured data
 */
export function parseSolution(discussion: BaseDiscussion): SolutionImplementation {
  const parsed = parseSolutionBody(discussion.body);

  return {
    ...discussion,
    solutionRefUrl: parsed.solutionRefUrl || "",
    description: parsed.description || "",
    mappings: parsed.mappings || [],
  };
}

export { parseSolutionBody, addMappingToSolutionBody };
