/**
 * GitHub API Configuration
 * 
 * This file contains the configuration for connecting to the GitHub GraphQL API.
 * These values are safe to commit as they don't contain sensitive information.
 */

/**
 * The owner of the GitHub repository containing the discussions
 */
export const GITHUB_REPO_OWNER = 'PiaWippermann';

/**
 * The name of the GitHub repository containing the discussions
 */
export const GITHUB_REPO_NAME = 'GitHubDiscussionsTesting';

/**
 * The GitHub GraphQL API endpoint
 */
export const GITHUB_API_ENDPOINT = 'https://api.github.com/graphql';

/**
 * Full repository identifier in the format "owner/repo"
 */
export const GITHUB_REPO_FULL_NAME = `${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;
