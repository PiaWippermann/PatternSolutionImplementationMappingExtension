/**
 * Pattern Parser
 * 
 * Functions for parsing and creating pattern discussions.
 */

/**
 * Parses the body of a pattern discussion to extract structured data
 */
export function parsePatternBody(body: string): {
  icon: string | null;
  description: string | null;
  patternLanguage: string | null;
  patternRef: string | null;
  mappings: number[];
} {
  const iconRegex = /!\[.*?\]\((.*?)\)/;
  const descriptionRegex = /# Description\s+([\s\S]*?)(?=\n#|$)/m;
  const patternLanguageRegex = /# Pattern Language\s*\n((?:(?!^#)[\s\S])*?)(?=\n#|$)/m;
  const patternRefRegex = /\[.*?\]\((https?:\/\/[^\s)]+)\)/;

  const mappingsMatch = body.match(
    /# Solution Implementations\s*((?:.|\n)*?)(?=\n# |\n*$)/
  );
  let mappingsMatches: number[] = [];

  if (mappingsMatch) {
    const sectionText = mappingsMatch[1];
    mappingsMatches = [...sectionText.matchAll(/#(\d+)/g)].map((m) =>
      Number(m[1])
    );
  }

  const iconMatch = body.match(iconRegex);
  const descriptionMatch = body.match(descriptionRegex);
  const patternLanguageMatch = body.match(patternLanguageRegex);
  const patternRefMatch = body.match(patternRefRegex);

  return {
    icon: iconMatch ? iconMatch[1].trim() : null,
    description: descriptionMatch ? descriptionMatch[1].trim() : null,
    patternLanguage: patternLanguageMatch ? patternLanguageMatch[1].trim() : null,
    patternRef: patternRefMatch ? patternRefMatch[1].trim() : null,
    mappings: mappingsMatches,
  };
}

/**
 * Creates a pattern discussion body from structured data
 */
export function createPatternBody({
  description,
  patternLanguage,
  referenceUrl,
  title,
  iconUrl,
}: {
  description: string;
  patternLanguage?: string;
  referenceUrl: string;
  title: string;
  iconUrl?: string;
}): string {
  return `
${iconUrl ? `![Alt-Text](${iconUrl})\n\n` : ""}
# Description
${description}
${patternLanguage ? `\n# Pattern Language\n${patternLanguage}\n` : ""}
# Pattern Reference
[${title}](${referenceUrl})

# Solution Implementations
  `.trim();
}

/**
 * Adds a mapping reference to a pattern body
 */
export function addMappingToPatternBody(
  body: string,
  mappingNumber: number
): string {
  const solutionImplementationHeader = "# Solution Implementations";
  const newSolutionImplementationEntry = `- #${mappingNumber}`;

  const lines = body.split("\n");
  const updatedBodyLines: string[] = [];
  let solutionImplementationsSectionFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    updatedBodyLines.push(line);

    if (line.trim() === solutionImplementationHeader) {
      solutionImplementationsSectionFound = true;
      let j = i + 1;
      const existingSolutionImplementationNumbers: Set<string> = new Set();

      while (j < lines.length && lines[j].trim().startsWith("- #")) {
        const match = lines[j].match(/-\s*#(\d+)/);
        if (match) {
          existingSolutionImplementationNumbers.add(match[1]);
        }
        updatedBodyLines.push(lines[j]);
        j++;
      }

      if (!existingSolutionImplementationNumbers.has(mappingNumber.toString())) {
        updatedBodyLines.push(newSolutionImplementationEntry);
      }

      for (; j < lines.length; j++) {
        updatedBodyLines.push(lines[j]);
      }
      break;
    }
  }

  if (!solutionImplementationsSectionFound) {
    if (
      updatedBodyLines.length > 0 &&
      updatedBodyLines[updatedBodyLines.length - 1] !== ""
    ) {
      updatedBodyLines.push("");
    }
    updatedBodyLines.push(solutionImplementationHeader);
    updatedBodyLines.push(newSolutionImplementationEntry);
  }

  return updatedBodyLines.join("\n");
}
