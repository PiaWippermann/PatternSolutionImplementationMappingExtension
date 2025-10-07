# Pattern Solution Implementation Mapping Extension

A browser extension for mapping software design patterns to their solution implementations via GitHub Discussions. This tool helps developers and researchers document, discover, and discuss relationships between abstract design patterns and concrete implementations.

## 🎯 Features

### Core Functionality
- **🔍 Search & Discover**: Search through patterns and solution implementations with pagination
- **🔗 Create Mappings**: Link design patterns to their concrete solution implementations
- **💬 Discussion Support**: Comment and discuss directly within the extension
- **📱 GitHub Integration**: Seamless sidebar integration on GitHub Discussion pages
- **🎨 Theme Support**: Automatic light/dark theme switching

### Pattern Management
- Browse and create software design patterns
- View pattern details including context, problem, solution, and consequences
- Track pattern metadata (author, creation date, etc.)

### Solution Implementation Tracking
- Document solution implementations with repository URLs
- Specify programming languages and technologies used
- Track GitHub stars and implementation status
- Link to related discussions and documentation

### Mapping System
- Create bidirectional links between patterns and implementations
- View all implementations for a specific pattern
- View all patterns implemented by a solution
- Comment on mappings to discuss implementation details

## 📋 Requirements

- **Browser**: Chrome/Edge (Manifest V3 compatible)
- **GitHub Account**: Required for authentication
- **GitHub Personal Access Token** with the following scopes:
  - `repo` - Access to repositories (if private)
  - `read:discussion` - Read discussion data
  - `write:discussion` - Create and comment on discussions

## 🚀 Installation

### For Users

1. Download the latest release from the [Releases page](https://github.com/PiaWippermann/PatternSolutionImplementationMappingExtension/releases)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" and select the downloaded `dist/` folder
5. The extension icon should appear in your browser toolbar

### For Developers

1. **Clone the repository**
   ```bash
   git clone https://github.com/PiaWippermann/PatternSolutionImplementationMappingExtension.git
   cd PatternSolutionImplementationMappingExtension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in browser**
   - Open Chrome/Edge
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

## 🔧 Configuration

### GitHub Repository Setup

The extension requires a GitHub repository with three specific discussion categories:

1. **Patterns** - For software design patterns
2. **Solution Implementations** - For concrete implementations
3. **Pattern - Solution Implementation Mapping** - For linking patterns and implementations

Update the configuration in `src/config/github.config.ts`:

```typescript
export const GITHUB_REPO_OWNER = 'your-username';
export const GITHUB_REPO_NAME = 'your-repo-name';
export const GITHUB_API_ENDPOINT = 'https://api.github.com/graphql';
```

### Creating a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `read:discussion` (Read discussions)
   - `write:discussion` (Write discussions)
4. Generate and copy the token
5. Paste it into the extension when prompted on first use

## 💻 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Project Structure

```
src/
├── api/                    # GitHub GraphQL API integration
│   ├── auth.ts            # Authentication logic
│   ├── client.ts          # GraphQL client setup
│   ├── patterns.ts        # Pattern API functions
│   ├── solutions.ts       # Solution API functions
│   ├── mappings.ts        # Mapping API functions
│   ├── queries/           # GraphQL queries
│   └── parsers/           # Response parsers
├── components/            # Reusable React components
│   ├── Comment.tsx       # Discussion comment display
│   ├── CommentCreator.tsx # Comment creation form
│   ├── LoadingSpinner.tsx # Loading indicator
│   ├── MappingList.tsx   # Mapping list display
│   └── Pagination.tsx    # Pagination controls
├── pages/                # Main application pages
│   ├── PatternList.tsx
│   ├── PatternDetail.tsx
│   ├── SolutionImplementationList.tsx
│   ├── SolutionImplementationDetail.tsx
│   ├── CreatePattern.tsx
│   ├── CreateSolution.tsx
│   ├── Login.tsx
│   └── Search.tsx
├── context/              # React Context for state management
│   └── DiscussionDataContext.tsx
├── types/                # TypeScript type definitions
│   ├── DiscussionData.ts
│   ├── GitHub.ts
│   ├── GraphQLResponses.ts
│   └── Messages.ts
├── styles/               # SCSS stylesheets
│   ├── globals.scss
│   ├── base/
│   ├── layout/
│   ├── pages/
│   └── themes/
├── utils/                # Utility functions
├── App.tsx               # Main application component
├── background.ts         # Background service worker
├── content-script.tsx    # Content script for GitHub pages
└── main.tsx              # Application entry point
```

### Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS with CSS Modules
- **API**: GraphQL (GitHub API)
- **State Management**: React Context API
- **Icons**: FontAwesome
- **Extension API**: WebExtension Polyfill

## 🎨 Usage Guide

### First-Time Setup

1. Click the extension icon in your browser toolbar
2. Enter your GitHub Personal Access Token
3. Click "Login"

### Creating a Pattern

1. Open the extension popup
2. Navigate to "Patterns"
3. Click the "+" button
4. Fill in the pattern details:
   - Pattern Name
   - Context (when to use it)
   - Problem (what it solves)
   - Solution (how it solves it)
   - Consequences (trade-offs)
5. Click "Create Pattern"

### Creating a Solution Implementation

1. Navigate to "Solution Implementations"
2. Click the "+" button
3. Fill in the implementation details:
   - Title
   - Repository URL
   - Programming Language
   - Related Patterns (optional)
   - Description
4. Click "Create Solution Implementation"

### Creating a Mapping

**Option 1: From Pattern Detail Page**
1. Open a pattern detail page
2. Scroll to "Linked Solution Implementations"
3. Click "Add Mapping"
4. Search for and select a solution implementation
5. Add optional comments
6. Click "Create Mapping"

**Option 2: From Solution Implementation Page (GitHub)**
1. Navigate to a Solution Implementation discussion on GitHub
2. The extension sidebar will automatically appear
3. Click "Add Mapping"
4. Search for and select a pattern
5. Add optional comments
6. Click "Create Mapping"

### Searching

1. Click the search icon in the navigation
2. Enter your search term
3. Press Enter or click the search button
4. Browse through results with pagination
5. Click any result to view details

## 🔒 Privacy & Security

- **Token Storage**: GitHub tokens are stored securely in the browser's local storage
- **Data Access**: The extension only accesses the configured GitHub repository
- **No External Services**: All data is stored in your GitHub repository
- **Open Source**: Full source code is available for audit

## 🐛 Troubleshooting

### Extension doesn't appear on GitHub

- Ensure you're logged in to the extension
- Verify you're on a GitHub Discussion page
- Check that the URL matches a Solution Implementation discussion
- Refresh the page

### Cannot create discussions

- Verify your GitHub token has the correct permissions
- Check that the repository discussion categories exist
- Ensure you have write access to the repository

### Search not working

- Verify you're logged in
- Check your internet connection
- Note: GitHub's search API doesn't support wildcard/partial matching
- Search terms must match whole words

### Build errors

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

## 📝 License

This project is part of a master's thesis.

## 👤 Author

**Pia Wippermann**

- GitHub: [@PiaWippermann](https://github.com/PiaWippermann)
- Repository: [PatternSolutionImplementationMappingExtension](https://github.com/PiaWippermann/PatternSolutionImplementationMappingExtension)

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components styled with [SCSS](https://sass-lang.com/)
- Icons from [FontAwesome](https://fontawesome.com/)
- GitHub API documentation and support

---
