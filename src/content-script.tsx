/**
 * Content Script Entry Point
 * Injects the Solution Sidebar into GitHub Discussion pages
 */

import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import type { BrowserMessage } from './types/Messages';
import { SolutionSidebar } from './content-script/components/SolutionSidebar';
import './styles/extension-typography.scss';
import './styles/pages/Search.scss';

/**
 * Checks if the user is authenticated by verifying if a token exists in storage.
 * @returns True if authenticated, false otherwise.
 */
async function checkAuth(): Promise<boolean> {
    const { githubToken } = await browser.storage.local.get('githubToken') as { githubToken?: string };
    return !!githubToken;
}

/**
 * Main function - Entry point called by the background script
 * Injects the React sidebar component into the page
 */
export const main = async (solutionImplementationNumber: number) => {
    console.log('Content script main function called with solutionImplementationNumber:', solutionImplementationNumber);
    // Check if user is authenticated
    const isAuth = await checkAuth();
    if (!isAuth) {
        return;
    }

    // Check if the container already exists to prevent duplicate execution
    const existingContainer = document.getElementById('extension-react-root');
    if (existingContainer) {
        return;
    }

    const targetElement = document.body;
    if (targetElement) {
        const container = document.createElement('div');
        container.id = 'extension-react-root';
        targetElement.appendChild(container);

        const root = createRoot(container);
        root.render(<SolutionSidebar solutionImplementationNumber={solutionImplementationNumber} />);
    }
};

// Send a "ready" message as soon as the listener is set up
browser.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' });

// Listen for messages from the background script
browser.runtime.onMessage.addListener(async (message: unknown) => {
    const msg = message as BrowserMessage;
    if (msg.type === 'DISCUSSION_NUMBER_MESSAGE' && msg.discussionNumber) {
        await main(msg.discussionNumber);
    }
});
