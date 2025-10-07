# Configuration

This directory contains all configuration files for the application.

## Structure

- **`github.config.ts`**: GitHub-specific configuration (repository owner, name, API endpoint)
- **`constants.ts`**: Application-wide constants (page size, cache TTL, etc.)
- **`index.ts`**: Central export point for all configuration values

## Usage

Import configuration values from the central export:

```typescript
import { GITHUB_REPO_OWNER, PAGE_SIZE } from '@/config';
```

Or import from specific config files:

```typescript
import { GITHUB_REPO_OWNER } from '@/config/github.config';
import { PAGE_SIZE } from '@/config/constants';
```

## Environment Variables

Sensitive information like Personal Access Tokens should be stored in `.env` files:

1. Copy `.env.example` to `.env`
2. Replace the placeholder with your actual GitHub PAT
3. Never commit the `.env` file

## Why This Structure?

- ✅ **Version Control**: Non-sensitive configuration is committed to git
- ✅ **Security**: Secrets remain in `.env` (gitignored)
- ✅ **Maintainability**: All config values in one place
- ✅ **Type Safety**: TypeScript provides autocomplete and type checking
- ✅ **Testability**: Easy to mock configuration in tests
