import { createDiscussion, updateDiscussionBody } from "./githubQueries";
import type { Pattern } from "../types/DiscussionData";

/**
 * Function to create a new pattern.
 * Given properties are parsed into markup text and this is stored as discussion body.
 * 
 * @returns 
 */
export async function createPattern({
  repositoryId,
  categoryId,
  title,
  description,
  referenceUrl,
  iconUrl,
}: {
  repositoryId: string;
  categoryId: string;
  title: string;
  description: string;
  referenceUrl: string;
  iconUrl?: string;
}) {
  const body = `
${iconUrl ? `![Alt-Text](${iconUrl})\n\n` : ""}
# Description
${description}

# Pattern Reference
[${title}](${referenceUrl})

# Solution Implementations
  `.trim();

  const response = await createDiscussion(title, body, categoryId, repositoryId);
  if (!response) {
    throw new Error("Failed to create pattern discussion");
  }

  // Create a Pattern object to return
  const pattern: Pattern = {
    ...response,
    title,
    description,
    patternRef: referenceUrl,
    icon: iconUrl || "",
    mappings: []
  };

  return pattern;
}

/**
 * Adds a new mapping number to the mappings list of the given pattern discussion.
 */
export async function addSolutionImplementationMapping({
  patternDiscussion,
  mappingNumber
}: {
  patternDiscussion: Pattern,
  mappingNumber: number
}) {
  const solutionImplementationHeader = "# Solution Implementations";
  const newSolutionImplementationEntry = `- #${mappingNumber}`;

  // find and update the "Patterns" section
  const lines = patternDiscussion.body.split("\n");
  let updatedBodyLines: string[] = [];
  let solutionImplementationsSectionFound = false;
  let newSolutionImplementationAdded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    updatedBodyLines.push(line);

    if (line.trim() === solutionImplementationHeader) {
      solutionImplementationsSectionFound = true;
      // After finding the header, iterate until the end of the solutionImplementations list
      // or the next header, and insert the new solutionImplementation if it's not already there.
      let j = i + 1;
      let existingSolutionImplementationNumbers: Set<string> = new Set();
      while (j < lines.length && lines[j].trim().startsWith("- #")) {
        const match = lines[j].match(/-\s*#(\d+)/);
        if (match) {
          existingSolutionImplementationNumbers.add(match[1]);
        }
        updatedBodyLines.push(lines[j]);
        j++;
      }

      // if the new solutionImplementation is not already in the list, add it
      if (!existingSolutionImplementationNumbers.has(mappingNumber.toString())) {
        updatedBodyLines.push(newSolutionImplementationEntry);
        newSolutionImplementationAdded = true;
      }
      // continue pushing remaining lines from original body
      for (; j < lines.length; j++) {
        updatedBodyLines.push(lines[j]);
      }
      break;
    }
  }

  // if the "Solution Implementations" header wasn't found at all, append it
  if (!solutionImplementationsSectionFound) {
    // Ensure there's a blank line before the new section if content exists
    if (
      updatedBodyLines.length > 0 &&
      updatedBodyLines[updatedBodyLines.length - 1] !== ""
    ) {
      updatedBodyLines.push("");
    }
    updatedBodyLines.push(solutionImplementationHeader);
    updatedBodyLines.push(newSolutionImplementationEntry);
    newSolutionImplementationAdded = true;
  } else if (!newSolutionImplementationAdded) {
    // If solutionImplementations section was found but the new solutionImplementation wasn't added
    // it means it was already present, or there's a logic issue.
    console.log(
      `Solution Implementation #${mappingNumber} already exists in discussion ${patternDiscussion.number}. No update needed.`
    );
    return patternDiscussion; // No actual change, return original
  }

  const updatedBody = updatedBodyLines.join("\n");

  // call updateDiscussion to update the body
  const result = await updateDiscussionBody(patternDiscussion.id, updatedBody);

  const patternResult: Pattern = {
    ...result,
    mappings: [
      ...patternDiscussion.mappings,
      mappingNumber
    ],
    icon: patternDiscussion.icon,
    patternRef: patternDiscussion.patternRef,
    description: patternDiscussion.description
  };

  return patternResult;
}

/**
 * Parses the body of a pattern discussion to extract the icon URL, description, and pattern reference URL.
 * 
 * @param body - body of the discussion
 * @returns 
 */
export function parsePatternBody(body: string): {
  icon: string | null;
  description: string | null;
  patternRef: string | null;
  mappings: number[] | [];
} {
  const iconRegex = /!\[.*?\]\((.*?)\)/;
  const descriptionRegex = /# Description\s+([\s\S]*?)\n\s*#/;
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
  const patternRefMatch = body.match(patternRefRegex);

  return {
    icon: iconMatch ? iconMatch[1].trim() : null,
    description: descriptionMatch ? descriptionMatch[1].trim() : null,
    patternRef: patternRefMatch ? patternRefMatch[1].trim() : null,
    mappings: mappingsMatches,
  };
}