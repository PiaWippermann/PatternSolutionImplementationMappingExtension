/**
 * Mapping API
 * 
 * High-level functions for working with pattern-solution mapping discussions.
 */

import { createDiscussion } from "./queries/discussions";
import { parseMappingBody, createMappingBody } from "./parsers";
import type { PatternSolutionMapping, Pattern, SolutionImplementation } from "../types/DiscussionData";
import type { BaseDiscussion } from "../types/GitHub";

/**
 * Creates a new mapping discussion linking a pattern and solution implementation
 */
export async function createMapping({
  repositoryId,
  categoryId,
  title,
  patternDiscussion,
  solutionImplementationDiscussion,
}: {
  repositoryId: string;
  categoryId: string;
  title: string;
  patternDiscussion: Pattern;
  solutionImplementationDiscussion: SolutionImplementation;
}): Promise<{
  mapping: PatternSolutionMapping;
  patternNumber: number;
  solutionNumber: number;
}> {
  const body = createMappingBody({
    patternNumber: patternDiscussion.number,
    solutionImplementationNumber: solutionImplementationDiscussion.number,
  });

  const response = await createDiscussion(repositoryId, categoryId, title, body);

  const mapping: PatternSolutionMapping = {
    ...response,
    patternDiscussionNumber: patternDiscussion.number,
    solutionImplementationDiscussionNumber: solutionImplementationDiscussion.number,
  };

  return {
    mapping,
    patternNumber: patternDiscussion.number,
    solutionNumber: solutionImplementationDiscussion.number,
  };
}

/**
 * Parses a mapping discussion to extract pattern and solution numbers
 */
export function parseMapping(discussion: BaseDiscussion): PatternSolutionMapping {
  const parsed = parseMappingBody(discussion.body);

  return {
    ...discussion,
    patternDiscussionNumber: parseInt(parsed.patternDiscussionNumber),
    solutionImplementationDiscussionNumber: parseInt(parsed.solutionImplementationDiscussionNumber),
  };
}

export { parseMappingBody, createMappingBody };
