/**
 * Mapping Parser
 * 
 * Functions for parsing and creating mapping discussions.
 */

/**
 * Parses the body of a pattern-solution mapping discussion
 */
export function parseMappingBody(body: string): {
  patternDiscussionNumber: string;
  solutionImplementationDiscussionNumber: string;
} {
  const patternRegex = /#\s*Pattern[\s\S]*?#(\d+)/;
  const solutionImplementationRegex = /#\s*Solution\s*Implementation[\s\S]*?#(\d+)/;

  const patternMatch = body.match(patternRegex);
  const solutionImplementationMatch = body.match(solutionImplementationRegex);

  return {
    patternDiscussionNumber: patternMatch ? patternMatch[1].trim() : "",
    solutionImplementationDiscussionNumber: solutionImplementationMatch ? solutionImplementationMatch[1].trim() : "",
  };
}

/**
 * Creates a mapping discussion body
 */
export function createMappingBody({
  patternNumber,
  solutionImplementationNumber,
}: {
  patternNumber: number;
  solutionImplementationNumber: number;
}): string {
  return `
# Pattern
#${patternNumber}

# Solution Implementation
#${solutionImplementationNumber}
  `.trim();
}
