# Authentication Implementation

## Overview

This document describes the authentication implementation added to the Pattern-Solution Implementation Mapping Extension.

## Features Implemented

### 1. **Login Page**
- User-friendly login interface
- Personal Access Token (PAT) input with show/hide toggle
- Detailed instructions for creating a GitHub PAT
- Real-time token validation
- Error handling with user feedback

### 2. **Authentication Service** (`src/api/auth.ts`)
- `isAuthenticated()`: Checks if user has a valid token
- `getToken()`: Retrieves token from browser storage
- `setToken(token)`: Stores token securely
- `validateToken(token)`: Validates token against GitHub API
- `logout()`: Removes token and clears cached data
- `getCurrentUser()`: Gets current user information

### 3. **GitHub API Integration**
- Dynamic client creation with authentication
- Token validation query
- User information retrieval
- Automatic client caching for performance

### 4. **UI Components**

#### App Header
- User information display (username)
- Logout button with icon
- Consistent styling with existing design

#### Login Page
- Responsive design
- Instructions for PAT creation
- Required scopes documentation
- Loading states
- Error messages

### 5. **Content Script Protection**
- Authentication check before injecting sidebar
- Prevents unauthorized usage
- Clean error handling

### 6. **Background Script Protection**
- Token verification before initialization
- Prevents data fetching without authentication
- URL matching only for authenticated users

## Required GitHub Token Scopes

Users need to create a GitHub Personal Access Token with the following scopes:

- `repo` (for private repositories) or `public_repo` (for public only)
- `read:discussion`
- `write:discussion`

## Usage Flow

1. **First Launch**
   - User sees login page
   - Must provide a valid GitHub PAT
   - Token is validated against GitHub API
   - On success, redirected to patterns list

2. **Authenticated Session**
   - Token stored in browser's local storage (encrypted)
   - Header shows username
   - Full access to all features
   - Logout button available

3. **Logout**
   - Clears token from storage
   - Clears all cached data
   - Redirects to login page
   - Content scripts stop injecting

## Security Considerations

- Token stored in `browser.storage.local` (automatically encrypted by browser)
- Token never logged to console
- Token validated on every API request
- 401 responses trigger automatic logout
- No token transmission to untrusted domains

## File Changes

### New Files
- `src/api/auth.ts`: Authentication service
- `src/pages/Login.tsx`: Login page component
- `src/styles/pages/Login.scss`: Login page styling

### Modified Files
- `src/api/githubQueries.ts`: Dynamic client with authentication
- `src/App.tsx`: Authentication state management
- `src/background.ts`: Authentication checks
- `src/content-script.tsx`: Authentication validation
- `src/styles/layout/AppLayout.scss`: Header styling for user info

## Testing

To test the authentication:

1. Build the extension: `npm run build`
2. Load the extension in browser (Developer Mode)
3. Open the extension popup
4. Should see login page
5. Create a GitHub PAT with required scopes
6. Enter the PAT and click "Login"
7. Should be redirected to patterns list
8. Username should appear in header
9. Logout button should work correctly

## Future Enhancements

Potential improvements for future versions:

1. **OAuth Integration**: Replace PAT with GitHub OAuth flow
2. **Token Refresh**: Implement automatic token refresh
3. **Session Management**: Add session timeout
4. **Multiple Accounts**: Support switching between accounts
5. **Token Validation Cache**: Cache validation results
6. **Biometric Authentication**: Add fingerprint/face ID support (where available)

## Troubleshooting

### Common Issues

**Issue**: "Invalid token" error
- **Solution**: Ensure the PAT has the required scopes
- **Solution**: Check that the token hasn't expired

**Issue**: Content script not injecting
- **Solution**: Verify authentication in popup
- **Solution**: Reload the page after logging in

**Issue**: API requests failing
- **Solution**: Check browser console for 401 errors
- **Solution**: Logout and login again

**Issue**: Username not showing
- **Solution**: Token might not have `read:user` scope
- **Solution**: Still functional, just won't display username

## Development Notes

### Circular Dependency Handling

The implementation uses dynamic imports to avoid circular dependencies between `auth.ts` and `githubQueries.ts`:

```typescript
// In githubQueries.ts
async function getClient(): Promise<GraphQLClient> {
  const { getToken } = await import('./auth');
  const token = await getToken();
  // ...
}
```

### State Management

Authentication state is managed at the top level in `App.tsx`:

```typescript
const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(false);
const [currentUserLogin, setCurrentUserLogin] = useState<string | null>(null);
```

### Error Handling

All authentication-related errors are caught and displayed to the user with clear messages. The system gracefully handles:

- Invalid tokens
- Network errors
- Missing permissions
- Token expiration

## Conclusion

The authentication implementation provides a secure and user-friendly way to manage GitHub API access. It follows best practices for browser extension security and provides a solid foundation for future enhancements.
