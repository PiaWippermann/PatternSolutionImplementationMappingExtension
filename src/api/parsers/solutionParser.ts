/**
 * Solution Implementation Parser
 * 
 * Functions for parsing and creating solution implementation discussions.
 */

/**
 * Parses the body of a solution implementation discussion
 */
export function parseSolutionBody(body: string): {
  solutionRefUrl: string | null;
  description: string | null;
  mappings: number[];
} {
  const solutionRefRegex = /\[.*?\]\((https?:\/\/[^\s)]+)\)/;
  const descriptionRegex = /# Description\s*\n((?:(?!^#)[\s\S])*?)(?=\n#|$)/m;

  const patternLinksMatch = body.match(
    /# Patterns\s*((?:.|\n)*?)(?=\n# |\n*$)/
  );
  let patternLinkMatches: number[] = [];

  if (patternLinksMatch) {
    const sectionText = patternLinksMatch[1];
    patternLinkMatches = [...sectionText.matchAll(/#(\d+)/g)].map((m) =>
      Number(m[1])
    );
  }

  const solutionRefMatch = body.match(solutionRefRegex);
  const descriptionMatch = body.match(descriptionRegex);

  return {
    solutionRefUrl: solutionRefMatch ? solutionRefMatch[1].trim() : null,
    description: descriptionMatch ? descriptionMatch[1].trim() : null,
    mappings: patternLinkMatches,
  };
}

/**
 * Creates a solution implementation discussion body
 */
export function createSolutionBody({
  description,
  solutionsUrl,
  title,
}: {
  description: string;
  solutionsUrl: string;
  title: string;
}): string {
  return `
# Description
${description}

# Solutions URL
[${title}](${solutionsUrl})

# Patterns
  `.trim();
}

/**
 * Adds a mapping reference to a solution implementation body
 */
export function addMappingToSolutionBody(
  body: string,
  mappingNumber: number
): string {
  const patternHeader = "# Patterns";
  const newPatternEntry = `- #${mappingNumber}`;

  const lines = body.split("\n");
  const updatedBodyLines: string[] = [];
  let patternsSectionFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    updatedBodyLines.push(line);

    if (line.trim() === patternHeader) {
      patternsSectionFound = true;
      let j = i + 1;
      const existingPatternNumbers: Set<string> = new Set();

      while (j < lines.length && lines[j].trim().startsWith("- #")) {
        const match = lines[j].match(/-\s*#(\d+)/);
        if (match) {
          existingPatternNumbers.add(match[1]);
        }
        updatedBodyLines.push(lines[j]);
        j++;
      }

      if (!existingPatternNumbers.has(mappingNumber.toString())) {
        updatedBodyLines.push(newPatternEntry);
      }

      for (; j < lines.length; j++) {
        updatedBodyLines.push(lines[j]);
      }
      break;
    }
  }

  if (!patternsSectionFound) {
    if (
      updatedBodyLines.length > 0 &&
      updatedBodyLines[updatedBodyLines.length - 1] !== ""
    ) {
      updatedBodyLines.push("");
    }
    updatedBodyLines.push(patternHeader);
    updatedBodyLines.push(newPatternEntry);
  }

  return updatedBodyLines.join("\n");
}
