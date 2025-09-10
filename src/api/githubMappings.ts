import { createDiscussion } from "./githubQueries";
import type { PatternSolutionMapping, Pattern, SolutionImplementation } from "../types/DiscussionData";
import { addPatternMapping } from "./githubSolutions";
import { addSolutionImplementationMapping } from "./githubPatterns";

export async function createMapping({
    repositoryId,
    categoryId,
    title,
    patternDiscussion,
    solutionImplementationDiscussion
}: {
    repositoryId: string;
    categoryId: string;
    title: string;
    patternDiscussion: Pattern;
    solutionImplementationDiscussion: SolutionImplementation;
}) {
    const body = `
# Pattern
#${patternDiscussion.number}

# Solution Implementation
#${solutionImplementationDiscussion.number}
  `.trim();

    const response = await createDiscussion(title, body, categoryId, repositoryId);
    if (!response) {
        throw new Error("Failed to create pattern discussion");
    }

    // Create a Mapping object
    const mapping: PatternSolutionMapping = {
        ...response,
        patternDiscussionNumber: patternDiscussion.number,
        solutionImplementationDiscussionNumber: solutionImplementationDiscussion.number
    };

    const updatedPattern: Pattern = await addSolutionImplementationMapping({ patternDiscussion, mappingNumber: response.number });

    const updatedSolutionImplementation: SolutionImplementation = await addPatternMapping({ solutionImplementationDiscussion, mappingNumber: response.number });

    return {
        mapping,
        updatedPattern,
        updatedSolutionImplementation
    };
}


/**
 * Parses the body of a pattern - solution implementation - mapping discussion to extract the pattern and solution implementation number.
 * @param body 
 */
export function parseMappingBody(body: string): {
    patternDiscussionNumber: string,
    solutionImplementationDiscussionNumber: string
} {
    // 💡 Korrigierter Regex: Sucht nach "# Pattern" und ignoriert alle Zeichen bis zur nächsten Überschrift
    // Die Gruppe (\d+) fängt die Nummer ein.
    const patternRegex = /#\s*Pattern[\s\S]*?#(\d+)/;

    // 💡 Korrigierter Regex: Sucht nach "# Solution Implementation" und ignoriert alle Zeichen bis zur nächsten Überschrift
    // Die Gruppe (\d+) fängt die Nummer ein.
    const solutionImplementationRegex = /#\s*Solution\s*Implementation[\s\S]*?#(\d+)/;

    const patternMatch = body.match(patternRegex);
    const solutionImplementationMatch = body.match(solutionImplementationRegex);

    return {
        patternDiscussionNumber: patternMatch ? patternMatch[1].trim() : "",
        solutionImplementationDiscussionNumber: solutionImplementationMatch ? solutionImplementationMatch[1].trim() : "",
    }
}