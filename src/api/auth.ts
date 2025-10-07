import browser from 'webextension-polyfill';
import { validateGitHubToken } from './queries/repository';

const TOKEN_STORAGE_KEY = 'githubToken';

/**
 * Checks if the user is authenticated by verifying if a token exists in storage.
 * @returns True if a token exists, false otherwise.
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}

/**
 * Retrieves the GitHub token from browser storage.
 * @returns The token string or null if not found.
 */
export async function getToken(): Promise<string | null> {
  try {
    const result = await browser.storage.local.get(TOKEN_STORAGE_KEY) as Record<string, string>;
    return result[TOKEN_STORAGE_KEY] || null;
  } catch (error) {
    console.error('Error retrieving token from storage:', error);
    return null;
  }
}

/**
 * Stores the GitHub token in browser storage.
 * @param token The token to store.
 */
export async function setToken(token: string): Promise<void> {
  try {
    await browser.storage.local.set({ [TOKEN_STORAGE_KEY]: token });
    console.log('Token saved successfully.');
  } catch (error) {
    console.error('Error saving token to storage:', error);
    throw error;
  }
}

/**
 * Validates a GitHub token by making a test query to the GitHub API.
 * @param token The token to validate.
 * @returns True if the token is valid, false otherwise.
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    return await validateGitHubToken(token);
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}

/**
 * Logs out the user by removing the token and clearing cached data.
 */
export async function logout(): Promise<void> {
  try {
    await browser.storage.local.remove([
      TOKEN_STORAGE_KEY,
      'repositoryIds',
      'relevantUrls'
    ]);
    console.log('Logout successful. Token and cached data cleared.');
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
}

/**
 * Gets the current GitHub user information if authenticated.
 * @returns User login name or null if not authenticated.
 */
export async function getCurrentUser(): Promise<string | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const { getCurrentUserInfo } = await import('./queries/repository');
    const userInfo = await getCurrentUserInfo();
    return userInfo?.login || null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}
