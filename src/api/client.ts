/**
 * GraphQL Client Setup
 * 
 * Provides a singleton GraphQL client with authentication.
 */

import { GraphQLClient } from "graphql-request";
import { GITHUB_API_ENDPOINT } from "../config";

// Client cache for performance
let cachedClient: GraphQLClient | null = null;

/**
 * Gets a GraphQL client with the current authentication token.
 * The client is cached for performance.
 * @returns GraphQL client with authentication.
 */
export async function getClient(): Promise<GraphQLClient> {
  if (cachedClient) return cachedClient;

  // Dynamic import to avoid circular dependency
  const { getToken } = await import('./auth');
  const token = await getToken();

  if (!token) {
    throw new Error('No authentication token found. Please login.');
  }

  cachedClient = new GraphQLClient(GITHUB_API_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return cachedClient;
}

/**
 * Clears the cached GraphQL client.
 * Should be called after logout.
 */
export function clearClientCache(): void {
  cachedClient = null;
}
