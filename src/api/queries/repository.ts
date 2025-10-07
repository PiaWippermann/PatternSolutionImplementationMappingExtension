/**
 * Repository API
 * 
 * Functions for interacting with GitHub repositories.
 */

import { getClient } from "../client";
import { GET_REPO_IDS_QUERY, VALIDATE_TOKEN_QUERY } from "../queries";
import { GITHUB_REPO_OWNER, GITHUB_REPO_NAME } from "../../config";
import type { RepositoryIds } from "../../types/DiscussionData";

/**
 * Fetches repository and discussion category IDs
 */
export async function getRepositoryIds(): Promise<RepositoryIds> {
  const client = await getClient();

  const data: any = await client.request(GET_REPO_IDS_QUERY, {
    owner: GITHUB_REPO_OWNER,
    name: GITHUB_REPO_NAME,
  });

  const categories = data.repository.discussionCategories.nodes;
  
  const patternCategory = categories.find((cat: any) => cat.name === "Patterns");
  const solutionCategory = categories.find((cat: any) => cat.name === "Solution Implementations");
  const mappingCategory = categories.find((cat: any) => cat.name === "Pattern - Solution Implementation Mapping");

  if (!patternCategory || !solutionCategory || !mappingCategory) {
    console.error("Available categories:", categories.map((c: any) => c.name));
    throw new Error("Required discussion categories not found in repository");
  }

  return {
    repositoryId: data.repository.id,
    patternCategoryId: patternCategory.id,
    solutionImplementationCategoryId: solutionCategory.id,
    patternSolutionMappingCategoryId: mappingCategory.id,
  };
}

/**
 * Validates a GitHub token by attempting to fetch user info
 */
export async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const { GraphQLClient } = await import("graphql-request");
    const { GITHUB_API_ENDPOINT } = await import("../../config");
    
    const client = new GraphQLClient(GITHUB_API_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await client.request(VALIDATE_TOKEN_QUERY);
    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}

/**
 * Gets information about the currently authenticated user
 */
export async function getCurrentUserInfo(): Promise<{ login: string; avatarUrl: string; email: string | null }> {
  const client = await getClient();
  const data: any = await client.request(VALIDATE_TOKEN_QUERY);
  return data.viewer;
}
