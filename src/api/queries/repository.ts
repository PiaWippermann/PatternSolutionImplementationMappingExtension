/**
 * Repository API
 * 
 * Functions for interacting with GitHub repositories.
 */

import { GraphQLClient } from "graphql-request";
import { getClient } from "../client";
import { GET_REPO_IDS_QUERY, VALIDATE_TOKEN_QUERY } from "../queries";
import { GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_API_ENDPOINT } from "../../config";
import type { RepositoryIds } from "../../types/DiscussionData";
import type { GetRepositoryIdsResponse, ValidateTokenResponse, RepositoryCategory } from "../../types/GraphQLResponses";

/**
 * Fetches repository and discussion category IDs
 */
export async function getRepositoryIds(): Promise<RepositoryIds> {
  const client = await getClient();

  const data = await client.request<GetRepositoryIdsResponse>(GET_REPO_IDS_QUERY, {
    owner: GITHUB_REPO_OWNER,
    name: GITHUB_REPO_NAME,
  });

  const categories = data.repository.discussionCategories.nodes;
  
  const patternCategory = categories.find((cat: RepositoryCategory) => cat.name === "Patterns");
  const solutionCategory = categories.find((cat: RepositoryCategory) => cat.name === "Solution Implementations");
  const mappingCategory = categories.find((cat: RepositoryCategory) => cat.name === "Pattern - Solution Implementation Mapping");

  if (!patternCategory || !solutionCategory || !mappingCategory) {
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
    const client = new GraphQLClient(GITHUB_API_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await client.request<ValidateTokenResponse>(VALIDATE_TOKEN_QUERY);
    return true;
  } catch (error: unknown) {
    return false;
  }
}

/**
 * Gets information about the currently authenticated user
 */
export async function getCurrentUserInfo(): Promise<{ login: string; avatarUrl: string; email: string | null }> {
  const client = await getClient();
  const data = await client.request<ValidateTokenResponse>(VALIDATE_TOKEN_QUERY);
  return data.viewer;
}

