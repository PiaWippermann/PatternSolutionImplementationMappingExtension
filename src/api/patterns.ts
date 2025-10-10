/**
 * Pattern API
 * 
 * High-level functions for working with pattern discussions.
 */

import { createDiscussion } from "./queries/discussions";
import { parsePatternBody, createPatternBody, addMappingToPatternBody } from "./parsers";
import type { Pattern } from "../types/DiscussionData";
import type { BaseDiscussion } from "../types/GitHub";

/**
 * Creates a new pattern discussion
 */
export async function createPattern({
  repositoryId,
  categoryId,
  title,
  description,
  patternLanguage,
  referenceUrl,
  iconUrl,
}: {
  repositoryId: string;
  categoryId: string;
  title: string;
  description: string;
  patternLanguage?: string;
  referenceUrl: string;
  iconUrl?: string;
}): Promise<Pattern> {
  const body = createPatternBody({
    description,
    patternLanguage,
    referenceUrl,
    title,
    iconUrl,
  });

  const response = await createDiscussion(repositoryId, categoryId, title, body);

  return {
    ...response,
    title,
    description,
    patternLanguage: patternLanguage || null,
    patternRef: referenceUrl,
    icon: iconUrl || "",
    mappings: [],
  };
}

/**
 * Parses a pattern discussion to extract structured data
 */
export function parsePattern(discussion: BaseDiscussion): Pattern {
  const parsed = parsePatternBody(discussion.body);

  return {
    ...discussion,
    icon: parsed.icon || "",
    description: parsed.description || "",
    patternLanguage: parsed.patternLanguage || null,
    patternRef: parsed.patternRef || "",
    mappings: parsed.mappings || [],
  };
}

export { parsePatternBody, addMappingToPatternBody };
