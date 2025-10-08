/**
 * Mapping API
 * 
 * High-level functions for working with pattern-solution mapping discussions.
 */

import { createDiscussion, updateDiscussionBody } from "./queries/discussions";
import { parseMappingBody, createMappingBody, addMappingToPatternBody, addMappingToSolutionBody } from "./parsers";
import type { PatternSolutionMapping, Pattern, SolutionImplementation } from "../types/DiscussionData";
import type { BaseDiscussion } from "../types/GitHub";

/**
 * Creates a new mapping discussion linking a pattern and solution implementation
 * Also updates the pattern and solution bodies to include the mapping reference
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

  // Step 1: Create the mapping discussion
  const response = await createDiscussion(repositoryId, categoryId, title, body);

  const mapping: PatternSolutionMapping = {
    ...response,
    patternDiscussionNumber: patternDiscussion.number,
    solutionImplementationDiscussionNumber: solutionImplementationDiscussion.number,
  };

  // Step 2: Update pattern body to include mapping reference
  const updatedPatternBody = addMappingToPatternBody(
    patternDiscussion.body,
    response.number
  );
  await updateDiscussionBody(patternDiscussion.id, updatedPatternBody);

  // Step 3: Update solution body to include mapping reference
  const updatedSolutionBody = addMappingToSolutionBody(
    solutionImplementationDiscussion.body,
    response.number
  );
  await updateDiscussionBody(solutionImplementationDiscussion.id, updatedSolutionBody);

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
