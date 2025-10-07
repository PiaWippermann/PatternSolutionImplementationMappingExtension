# API Module Structure

This directory contains all API-related code for interacting with GitHub's GraphQL API.

## Structure

```
src/api/
├── index.ts                    # Central export point
├── client.ts                   # GraphQL client setup
├── auth.ts                     # Authentication management
├── queries/                    # GraphQL queries and API functions
│   ├── index.ts               # Query definitions
│   ├── repository.ts          # Repository & user queries
│   └── discussions.ts         # Discussion queries
├── parsers/                    # Body parsers for discussions
│   ├── index.ts               # Central parser export
│   ├── patternParser.ts       # Pattern body parsing
│   ├── solutionParser.ts      # Solution body parsing
│   └── mappingParser.ts       # Mapping body parsing
├── patterns.ts                 # High-level pattern API
├── solutions.ts                # High-level solution API
└── mappings.ts                 # High-level mapping API
```

## Usage

### Importing from API

Always import from the central export point:

```typescript
import {
  createPattern,
  createSolution,
  createMapping,
  getDiscussionsListData,
  getRepositoryIds,
  parsePattern
} from '@/api';
```

### Authentication

```typescript
import { isAuthenticated, getToken, setToken, logout } from '@/api';

// Check authentication
const isLoggedIn = await isAuthenticated();

// Get current token
const token = await getToken();

// Set new token
await setToken('ghp_...');

// Logout
await logout();
```

### Repository Operations

```typescript
import { getRepositoryIds, getCurrentUserInfo } from '@/api';

// Get category IDs
const ids = await getRepositoryIds();

// Get current user
const user = await getCurrentUserInfo();
```

### Discussion Operations

```typescript
import { getDiscussionsListData, getDiscussionDetails } from '@/api';

// Get list of discussions
const list = await getDiscussionsListData(categoryId, cursor, 10);

// Get single discussion
const discussion = await getDiscussionDetails(discussionNumber);
```

### Pattern Operations

```typescript
import { createPattern, parsePattern } from '@/api';

// Create new pattern
const pattern = await createPattern({
  repositoryId,
  categoryId,
  title,
  description,
  referenceUrl,
  iconUrl,
});

// Parse pattern from discussion
const pattern = parsePattern(discussion);
```

### Solution Operations

```typescript
import { createSolution, parseSolution } from '@/api';

// Create new solution
const solution = await createSolution({
  repositoryId,
  categoryId,
  title,
  description,
  solutionsUrl,
});

// Parse solution from discussion
const solution = parseSolution(discussion);
```

### Mapping Operations

```typescript
import { createMapping, parseMapping } from '@/api';

// Create new mapping
const result = await createMapping({
  repositoryId,
  categoryId,
  title,
  patternDiscussion,
  solutionImplementationDiscussion,
});

// Parse mapping from discussion
const mapping = parseMapping(discussion);
```

## Design Principles

### 1. **Separation of Concerns**
- **Client**: GraphQL client setup and caching
- **Queries**: Raw GraphQL operations
- **Parsers**: Discussion body parsing logic
- **High-level APIs**: Business logic and convenience functions

### 2. **Single Responsibility**
Each file has one clear purpose:
- `client.ts` - Only manages the GraphQL client
- `repository.ts` - Only repository-related queries
- `patternParser.ts` - Only pattern body parsing

### 3. **Central Export**
All API functions are re-exported from `index.ts` for consistent imports.

### 4. **Type Safety**
All functions are fully typed with TypeScript interfaces.

### 5. **Error Handling**
Errors are thrown and should be caught by callers (usually in Context).

## Migration from Old Structure

### Old:
```typescript
import { createDiscussion } from './api/githubQueries';
import { parsePatternBody } from './api/githubPatterns';
import { createPattern } from './api/githubPatterns';
```

### New:
```typescript
import { createDiscussion, parsePattern, createPattern } from '@/api';
```

## Benefits of New Structure

✅ **Better Organization**: Clear separation between queries, parsers, and business logic
✅ **Easier Testing**: Each module can be tested independently
✅ **Better Maintainability**: Smaller files with single responsibilities
✅ **Easier to Extend**: Adding new functionality is straightforward
✅ **Type Safety**: Centralized types and exports
✅ **Reduced Coupling**: Clear dependencies between modules
