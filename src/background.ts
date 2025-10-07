import browser from "webextension-polyfill";
import { getRepositoryIds, getDiscussionsListData, getDiscussionDetails } from "./api";
import type { BrowserMessage } from './types/Messages';
import type { BaseDiscussion } from "./types/GitHub";
// Temporarily stores promises that are waiting for the "ready" message
const readyResolvers = new Map<number, (value: unknown) => void>();
/**
 * Fetches ALL solution implementations by paginating through all pages
 */
async function fetchAllSolutionsBody(categoryId: string): Promise<BaseDiscussion[]> {
    const allDiscussions: BaseDiscussion[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;
    while (hasNextPage) {
        const result = await getDiscussionsListData(categoryId, cursor, 100);
        // Fetch full details for each discussion to get the body
        const detailsPromises = result.nodes.map(node => getDiscussionDetails(node.number));
        const details = await Promise.all(detailsPromises);
        allDiscussions.push(...details);
        hasNextPage = result.pageInfo.hasNextPage;
        cursor = result.pageInfo.endCursor;
    }
    return allDiscussions;
}
/**
 * Fetches the solution implementations from GitHub discussions,
 * extracts relevant URLs, and stores them in the extension's local storage.
 */
async function fetchAndParseUrls() {
    const ids = await getRepositoryIds();
    if (!ids) {
        return;
    }
    // Init the repository ids in local storage for later use
    await browser.storage.local.set({ repositoryIds: ids });
    const discussions = await fetchAllSolutionsBody(ids.solutionImplementationCategoryId);
    const urlMappings = new Array<{ url: string, discussionNumber: number }>();
    const solutionRefRegex = /\[.*?\]\((https?:\/\/[^\s)]+)\)/;
    discussions.forEach(discussion => {
        const solutionRefMatch = discussion.body.match(solutionRefRegex);
        if (solutionRefMatch) {
            const url = solutionRefMatch[1].trim();
            urlMappings.push({ url, discussionNumber: discussion.number });
        }
    });
    await browser.storage.local.set({ relevantUrls: urlMappings });
}
/**
 * Executes the content script on a specific tab.
 */
async function executeContentScript(tabId: number, discussionNumber: number) {
    try {
        await browser.scripting.executeScript({
            target: { tabId: tabId },
            files: ['src/content-script.js'],
        });
        // Wait until the content script is ready
        await new Promise(resolve => readyResolvers.set(tabId, resolve));
        // After the ready message has been received, send the data
        browser.tabs.sendMessage(tabId, {
            type: 'DISCUSSION_NUMBER_MESSAGE',
            discussionNumber: discussionNumber
        });
    } catch (error) {
    }
}
/**
 * Initializes the extension by fetching and parsing URLs.
 */
async function initializeExtension() {
    const { githubToken } = await browser.storage.local.get('githubToken');
    if (!githubToken) {
        return; // Don't initialize without authentication
    }
    await fetchAndParseUrls();
}
// Event listener: executed when the extension is installed or updated
browser.runtime.onInstalled.addListener(() => {
    initializeExtension();
});
// Event listener: triggered when a tab is updated
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Check if user is authenticated
        const { githubToken } = await browser.storage.local.get('githubToken');
        if (!githubToken) {
            return; // Don't inject content script if not authenticated
        }
        const result = await browser.storage.local.get('relevantUrls') as { relevantUrls: { url: string, discussionNumber: number }[] };
        const relevantUrls = result.relevantUrls || [];
        const normalizedTabUrl = tab.url.replace(/\/(de|en|jp)\//, '/');
        const matchingSolution = relevantUrls.find(urlMapping => normalizedTabUrl.startsWith(urlMapping.url));
        if (matchingSolution) {
            executeContentScript(tabId, matchingSolution.discussionNumber);
        }
    }
});
// Receive the "I am ready" message from the content script
browser.runtime.onMessage.addListener((message: unknown, sender: browser.Runtime.MessageSender) => {
    const msg = message as BrowserMessage;
    if (msg.type === 'CONTENT_SCRIPT_READY' && sender.tab?.id) {
        const resolve = readyResolvers.get(sender.tab.id);
        if (resolve) {
            resolve(true);
            readyResolvers.delete(sender.tab.id);
        }
    }
    // Listen for login success message from the popup
    if (msg.type === 'LOGIN_SUCCESS') {
        initializeExtension();
    }
});