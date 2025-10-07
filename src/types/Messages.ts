/**
 * Type definitions for browser extension messaging
 */

export interface ExtensionMessage {
  type: string;
  discussionNumber?: number;
}

export interface LoginSuccessMessage {
  type: 'LOGIN_SUCCESS';
}

export type BrowserMessage = ExtensionMessage | LoginSuccessMessage;
