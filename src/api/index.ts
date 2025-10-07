/**
 * API Module
 * 
 * Central export point for all API functions.
 * Import from here to access all API functionality.
 * 
 * @example
 * ```typescript
 * import { createPattern, getDiscussionsListData, parsePattern } from '@/api';
 * ```
 */

// Client
export * from './client';

// Auth
export * from './auth';

// Repository & User
export * from './queries/repository';

// Discussions
export * from './queries/discussions';

// High-level APIs
export * from './patterns';
export * from './solutions';
export * from './mappings';

// Parsers (re-exported for convenience)
export * from './parsers';
