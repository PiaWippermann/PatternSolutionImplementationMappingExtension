# Content Script Module

This module contains the components and logic for the browser extension's sidebar that appears on GitHub Solution Implementation discussion pages.

## Structure

```
content-script/
├── components/          # React components
│   ├── SolutionSidebar.tsx       # Main sidebar container
│   ├── MappingListView.tsx       # Displays existing mappings
│   ├── PatternSelector.tsx       # Pattern selection with search
│   └── PatternDetailView.tsx     # Selected pattern details
├── hooks/              # Custom React hooks
│   ├── useSolutionData.ts        # Loads solution and mapping data
│   └── usePatternSearch.ts       # Handles pattern search logic
└── index.ts            # Module exports
```

## Components

### SolutionSidebar
Main component that orchestrates the entire sidebar experience. Manages state for:
- Creating new mappings
- Displaying existing mappings
- Loading comments
- Sidebar visibility

### MappingListView
Displays the list of existing pattern-solution mappings with:
- Expandable pattern details
- Comment threads
- Comment creation

### PatternSelector
Searchable list for selecting patterns when creating a mapping:
- Search functionality with pagination
- GitHub API integration
- Filters out already-mapped patterns

### PatternDetailView
Shows detailed information about a selected pattern before creating the mapping.

## Hooks

### useSolutionData
Custom hook that handles:
- Loading solution implementation details
- Fetching related mappings
- Loading pattern details for each mapping
- Managing visibility state

**Returns:**
- `solutionImplementationDetails` - Current solution data
- `mappingDiscussions` - List of mappings
- `patternDetails` - Map of pattern details by mapping number
- `isLoading` - Loading state
- `togglePatternVisibility` - Function to expand/collapse patterns
- Setter functions for state updates

### usePatternSearch
Custom hook for pattern search functionality:
- Pagination management
- Search term handling
- API calls (list vs search)
- Filters already-mapped patterns

**Returns:**
- `patternMappingOptionList` - Filtered pattern list
- `listPageInfo` - Pagination info
- `isSearching` - Search mode flag
- `isLoading` - Loading state
- Navigation functions (`handleNextPage`, `handlePrevPage`)
- Search handlers (`handleSearchChange`, `handleSearchKeyPress`)

## Data Flow

1. **Initial Load** (useSolutionData)
   - Fetch solution implementation details
   - Load all related mapping discussions
   - Fetch pattern details for each mapping

2. **Creating Mapping** (usePatternSearch)
   - Load available patterns (with pagination)
   - Support search functionality
   - Filter out already-mapped patterns
   - Allow pattern selection

3. **Selected Pattern**
   - Show pattern details
   - Create mapping via API
   - Update local state
   - Refresh pattern list

## Key Features

- **Lazy Loading**: Comments are loaded on demand
- **Pagination**: Both pattern list and comments support pagination
- **Search**: Pattern search with GitHub API integration
- **Real-time Updates**: State updates immediately after creating mappings
- **Optimistic UI**: UI updates before API confirmation
- **Error Resilience**: Silent error handling to prevent UI breakage

## Usage

```typescript
import { SolutionSidebar } from './content-script';

// In your content script entry point:
const root = createRoot(container);
root.render(<SolutionSidebar solutionImplementationNumber={123} />);
```

## Dependencies

- React 19
- WebExtension Polyfill
- FontAwesome Icons
- SCSS Modules (for styling)
- GitHub GraphQL API (via api module)
