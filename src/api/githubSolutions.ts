import { createDiscussion, updateDiscussionBody } from "./githubQueries";
import type { SolutionImplementation } from "../types/DiscussionData";

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
}) {
  const body = `
# Description
${description}

# Solutions URL
[${title}](${solutionsUrl})

# Patterns
  `.trim();

  const response = await createDiscussion(title, body, categoryId, repositoryId);
  if (!response) {
    throw new Error("Failed to create pattern discussion");
  }

  // Create a Pattern object to return
  const solutionImplementation: SolutionImplementation = {
    ...response,
    title,
    description,
    solutionRefUrl: solutionsUrl,
    mappings: []
  };

  return solutionImplementation;
}

/**
 * Adds a new mapping number to the mappings list of the given solution implementation discussion.
 */
export async function addPatternMapping({
  solutionImplementationDiscussion,
  mappingNumber
}: {
  solutionImplementationDiscussion: SolutionImplementation,
  mappingNumber: number
}) {
  const patternHeader = "# Patterns";
  const newPatternEntry = `- #${mappingNumber}`;

  // find and update the "Patterns" section
  const lines = solutionImplementationDiscussion.body.split("\n");
  let updatedBodyLines: string[] = [];
  let patternsSectionFound = false;
  let newPatternAdded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    updatedBodyLines.push(line);

    if (line.trim() === patternHeader) {
      patternsSectionFound = true;
      // After finding the header, iterate until the end of the patterns list
      // or the next header, and insert the new pattern if it's not already there.
      let j = i + 1;
      let existingPatternNumbers: Set<string> = new Set();
      while (j < lines.length && lines[j].trim().startsWith("- #")) {
        const match = lines[j].match(/-\s*#(\d+)/);
        if (match) {
          existingPatternNumbers.add(match[1]);
        }
        updatedBodyLines.push(lines[j]);
        j++;
      }

      // if the new pattern is not already in the list, add it
      if (!existingPatternNumbers.has(mappingNumber.toString())) {
        updatedBodyLines.push(newPatternEntry);
        newPatternAdded = true;
      }
      // continue pushing remaining lines from original body
      for (; j < lines.length; j++) {
        updatedBodyLines.push(lines[j]);
      }
      break;
    }
  }

  // if the "Patterns" header wasn't found at all, append it
  if (!patternsSectionFound) {
    // Ensure there's a blank line before the new section if content exists
    if (
      updatedBodyLines.length > 0 &&
      updatedBodyLines[updatedBodyLines.length - 1] !== ""
    ) {
      updatedBodyLines.push("");
    }
    updatedBodyLines.push(patternHeader);
    updatedBodyLines.push(newPatternEntry);
    newPatternAdded = true;
  } else if (!newPatternAdded) {
    // If patterns section was found but the new pattern wasn't added
    // it means it was already present, or there's a logic issue.
    console.log(
      `Pattern #${mappingNumber} already exists in discussion ${solutionImplementationDiscussion.number}. No update needed.`
    );
    return solutionImplementationDiscussion; // No actual change, return original
  }

  const updatedBody = updatedBodyLines.join("\n");

  // call updateDiscussion to update the body
  const result = await updateDiscussionBody(solutionImplementationDiscussion.id, updatedBody);

  const solutionImplementationResult: SolutionImplementation = {
    ...result,
    mappings: [
      ...solutionImplementationDiscussion.mappings,
      mappingNumber
    ],
    solutionRefUrl: solutionImplementationDiscussion.solutionRefUrl,
    description: solutionImplementationDiscussion.description
  };
  return solutionImplementationResult;
}

/**
 * Parses the body of a solution discussion to extract the solution reference URL, description, and linked pattern numbers.
 * @param body - body of the discussion
 * @returns 
 */
export function parseSolutionBody(body: string): {
  solutionRefUrl: string | null;
  description: string | null;
  mappings: number[] | [];
} {
  const solutionRefRegex = /\[.*?\]\((https?:\/\/[^\s)]+)\)/; // Regex to match the solution reference URL
  const descriptionRegex = /# Description\s+([\s\S]*?)\n\s*#/;

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