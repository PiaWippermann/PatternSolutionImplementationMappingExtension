# Pattern Solution Implementation Mapping Extension - Umfassende Dokumentation

## 📑 Inhaltsverzeichnis

1. [Projektübersicht](#projektübersicht)
2. [Architektur](#architektur)
3. [Technischer Stack](#technischer-stack)
4. [Modulstruktur](#modulstruktur)
5. [Kernfunktionalitäten](#kernfunktionalitäten)
6. [API Integration](#api-integration)
7. [State Management](#state-management)
8. [Content Script System](#content-script-system)
9. [Styling System](#styling-system)
10. [Authentication & Security](#authentication--security)
11. [Datenmodelle](#datenmodelle)
12. [Build & Deployment](#build--deployment)
13. [Development Guide](#development-guide)
14. [Testing](#testing)
15. [Troubleshooting](#troubleshooting)

---

## 🎯 Projektübersicht

### Zweck

Die **Pattern Solution Implementation Mapping Extension** ist eine Chrome/Edge Browser-Erweiterung, die es ermöglicht, **Software Design Patterns** mit konkreten **Solution Implementations** über GitHub Discussions zu verknüpfen. Das Tool richtet sich an Entwickler und Forscher, die Beziehungen zwischen abstrakten Designmustern und realen Implementierungen dokumentieren, entdecken und diskutieren möchten.

### Hauptziele

1. **Pattern Discovery**: Entwickler können Patterns durchsuchen und neue Patterns dokumentieren
2. **Solution Tracking**: Konkrete Implementierungen von Patterns mit Repository-Links verwalten
3. **Mapping System**: Bidirektionale Verknüpfungen zwischen Patterns und Solutions erstellen
4. **Discussion Platform**: Kommentare und Diskussionen zu Mappings führen
5. **GitHub Integration**: Nahtlose Integration in GitHub Discussion Pages

### Use Cases

- **Lernende**: Finden Implementierungsbeispiele für Design Patterns
- **Architekten**: Dokumentieren Pattern-Einsatz in ihren Projekten
- **Forscher**: Analysieren Pattern-Verwendung in Open-Source-Projekten
- **Teams**: Teilen Best Practices und Pattern-Kataloge

---

## 🏗️ Architektur

### Gesamtarchitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Extension                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Popup UI   │  │Content Script│  │  Background  │      │
│  │  (React App) │  │  (Sidebar)   │  │Service Worker│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘              │
│                            │                                  │
│                  ┌─────────▼─────────┐                       │
│                  │   API Module      │                       │
│                  │  (GraphQL Client) │                       │
│                  └─────────┬─────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ GitHub GraphQL  │
                    │      API        │
                    └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │ GitHub Repo     │
                    │  Discussions    │
                    │ - Patterns      │
                    │ - Solutions     │
                    │ - Mappings      │
                    └─────────────────┘
```

### Komponentenarchitektur

```
src/
├── Presentation Layer (React Components)
│   ├── pages/          # Hauptansichten (List, Detail, Create)
│   ├── components/     # Wiederverwendbare UI-Komponenten
│   └── content-script/ # GitHub Integration (Sidebar)
│
├── Business Logic Layer
│   ├── context/        # State Management (React Context)
│   ├── api/           # GitHub API Abstraktion
│   │   ├── queries/   # GraphQL Queries
│   │   └── parsers/   # Discussion Body Parsing
│   └── utils/         # Hilfsfunktionen
│
├── Data Layer
│   ├── types/         # TypeScript Typdefinitionen
│   └── config/        # Konfiguration
│
└── Style Layer
    └── styles/        # SCSS Styling (Modular)
```

### Design Patterns

**1. Repository Pattern**: API-Module abstrahiert GitHub als Datenquelle
**2. Context Provider Pattern**: Zentrales State Management
**3. Custom Hooks**: Wiederverwendbare Logik (useSolutionData, usePatternSearch)
**4. Parser Pattern**: Strukturierung unstrukturierter Discussion Bodies
**5. Factory Pattern**: Dynamische GraphQL Client-Erstellung

---

## 💻 Technischer Stack

### Core Technologies

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| **React** | 19.1.1 | UI Framework |
| **TypeScript** | 5.8.3 | Type Safety & DX |
| **Vite** | 7.1.2 | Build Tool & Dev Server |
| **SCSS** | 1.92.0 | Styling (sass-embedded) |
| **GraphQL** | - | API Query Language |

### Browser Extension APIs

- **Manifest V3**: Moderne Extension API
- **WebExtension Polyfill**: Cross-browser Kompatibilität
- **chrome.storage**: Sichere Token-Speicherung
- **chrome.scripting**: Content Script Injection
- **chrome.tabs**: Tab-Management

### API & Libraries

- **graphql-request** (7.2.0): GraphQL Client
- **FontAwesome** (7.0.1): Icon Library
- **@vitejs/plugin-react-swc**: React Fast Refresh
- **vite-plugin-web-extension**: Extension Build Support

### Development Tools

- **ESLint**: Code Linting
- **TypeScript ESLint**: TypeScript-spezifische Regeln
- **Prettier**: Code Formatting (empfohlen)

---

## 📦 Modulstruktur

### 1. API Module (`src/api/`)

**Zweck**: Abstraktion der GitHub GraphQL API

```typescript
src/api/
├── index.ts                 # ✅ Zentraler Export-Punkt
├── client.ts                # ✅ GraphQL Client Setup
├── auth.ts                  # ✅ Authentication Management
├── queries/
│   ├── index.ts            # ✅ GraphQL Query Definitionen
│   ├── repository.ts       # ✅ Repository & Category Queries
│   └── discussions.ts      # ✅ Discussion CRUD Operations
├── parsers/
│   ├── index.ts            # ✅ Parser Exports
│   ├── patternParser.ts    # ✅ Pattern Body Parsing
│   ├── solutionParser.ts   # ✅ Solution Body Parsing
│   └── mappingParser.ts    # ✅ Mapping Body Parsing
├── patterns.ts              # ✅ High-level Pattern API
├── solutions.ts             # ✅ High-level Solution API
└── mappings.ts              # ✅ High-level Mapping API
```

**Kernfunktionen**:
- `getRepositoryIds()`: Lädt Category IDs aus GitHub
- `createPattern()`: Erstellt neues Pattern
- `parsePattern()`: Parst Pattern aus Discussion Body
- `createMapping()`: Verknüpft Pattern mit Solution

**Design Principles**:
- **Single Responsibility**: Jede Datei hat genau einen Zweck
- **Separation of Concerns**: Queries ≠ Parser ≠ Business Logic
- **Central Export**: Konsistente Imports über `@/api`

### 2. Context Module (`src/context/`)

**Zweck**: Zentrales State Management

```typescript
src/context/
└── DiscussionDataContext.tsx  # ✅ Global State Provider
```

**State Structure**:
```typescript
{
  discussionData: {
    patterns: {
      details: Pattern[],           // Vollständige Pattern-Daten
      listData: {                   // Cache für Listen-Ansichten
        [cursor: string]: {
          discussions: SimpleDiscussion[],
          pageInfo: PageInfo
        }
      },
      currentPageCursor: string | null
    },
    solutionImplementations: { /* analog */ },
    patternSolutionMappings: PatternSolutionMapping[]
  },
  ids: RepositoryIds,              // GitHub Category IDs
  loading: boolean,
  error: string | null
}
```

**Key Functions**:
- `fetchDiscussionList()`: Lädt paginierten Listen
- `fetchDiscussionDetailsByNumber()`: Lädt einzelne Discussion
- `addOrUpdatePatternData()`: Cache-Update nach Erstellung
- `clearListCache()`: Cache-Invalidierung

### 3. Pages Module (`src/pages/`)

**Zweck**: Hauptansichten der Anwendung

```typescript
src/pages/
├── Login.tsx                    # ✅ Authentication UI
├── PatternList.tsx             # ✅ Pattern-Liste mit Pagination
├── PatternDetail.tsx           # ✅ Pattern-Detailansicht
├── CreatePattern.tsx           # ✅ Pattern-Erstellungsformular
├── SolutionImplementationList.tsx   # ✅ Solution-Liste
├── SolutionImplementationDetail.tsx # ✅ Solution-Details
├── CreateSolution.tsx          # ✅ Solution-Formular
└── Search.tsx                  # ✅ Globale Suche
```

**Navigation Flow**:
```
Login → PatternList/SolutionList → Detail → Create
                ↓
              Search → Detail
```

### 4. Components Module (`src/components/`)

**Zweck**: Wiederverwendbare UI-Komponenten

```typescript
src/components/
├── Comment.tsx           # ✅ Kommentar-Anzeige
├── CommentCreator.tsx    # ✅ Kommentar-Eingabe
├── LoadingSpinner.tsx    # ✅ Loading Indikator
├── MappingList.tsx       # ✅ Mapping-Liste (Popup)
├── Pagination.tsx        # ✅ Pagination Controls
└── Sidebar.module.scss   # ✅ Sidebar Styling
```

**Component Props Pattern**:
```typescript
// Beispiel: CommentCreator
interface CommentCreatorProps {
  discussionId: string | undefined;
  onCommentSubmit: (comment: Comment) => void;
}
```

### 5. Content Script Module (`src/content-script/`)

**Zweck**: GitHub Page Integration (Sidebar)

```typescript
src/content-script/
├── index.tsx                # ✅ Entry Point
├── components/
│   ├── SolutionSidebar.tsx     # ✅ Hauptcontainer
│   ├── MappingListView.tsx     # ✅ Mapping-Liste
│   ├── PatternSelector.tsx     # ✅ Pattern-Auswahl
│   └── PatternDetailView.tsx   # ✅ Pattern-Details
└── hooks/
    ├── useSolutionData.ts      # ✅ Daten-Loading
    └── usePatternSearch.ts     # ✅ Pattern-Suche
```

**Injection Logic**:
```typescript
// Nur auf Solution Implementation Discussion Pages
if (url.matches(/github\.com\/.*\/discussions\/\d+/)) {
  injectSidebar(discussionNumber);
}
```

### 6. Types Module (`src/types/`)

**Zweck**: TypeScript Typdefinitionen

```typescript
src/types/
├── DiscussionData.ts    # ✅ Domain Models
├── GitHub.ts            # ✅ GitHub API Types
├── Extension.ts         # ✅ Extension-spezifische Types
└── GraphQLResponses.ts  # ✅ GraphQL Response Types
```

---

## ⚙️ Kernfunktionalitäten

### 1. Pattern Management

#### Pattern erstellen
```typescript
// src/pages/CreatePattern.tsx
const pattern = await createPattern({
  repositoryId: ids.repositoryId,
  categoryId: ids.patternCategoryId,
  title: "Singleton Pattern",
  description: "Ensures only one instance exists",
  patternLanguage: "GoF Design Patterns",
  referenceUrl: "https://refactoring.guru/design-patterns/singleton",
  iconUrl: "https://example.com/singleton.svg"
});
```

**Discussion Body Format**:
```markdown
![Alt-Text](icon-url)

# Description
Pattern description text...

# Pattern Language
Gang of Four Design Patterns

# Pattern Reference
[Singleton Pattern](reference-url)

# Solution Implementations
- #123
- #456
```

#### Pattern anzeigen
- **Liste**: Alle Patterns mit Pagination (10 pro Seite)
- **Detail**: Vollständige Pattern-Info + verknüpfte Solutions
- **Parsing**: Regex-basierte Extraktion aus Markdown Body

### 2. Solution Implementation Management

#### Solution erstellen
```typescript
// src/pages/CreateSolution.tsx
const solution = await createSolution({
  repositoryId: ids.repositoryId,
  categoryId: ids.solutionImplementationCategoryId,
  title: "Spring Boot Singleton Example",
  description: "Singleton implementation using Spring",
  solutionsUrl: "https://github.com/user/repo"
});
```

**Discussion Body Format**:
```markdown
![Alt-Text](icon-url)

# Description
Implementation description...

# Solution Implementations
https://github.com/user/repo

# Patterns
- #789
- #101
```

### 3. Mapping System

#### Bidirektionale Verknüpfung

**Pattern → Solution Mapping**:
```typescript
// Von PatternDetail.tsx aus
const mapping = await createMapping({
  repositoryId,
  categoryId: ids.patternSolutionMappingCategoryId,
  title: `Pattern #${patternNumber} - Solution #${solutionNumber}`,
  patternDiscussion,
  solutionImplementationDiscussion
});
```

**Mapping Body Format**:
```markdown
This discussion links:
- **Pattern**: [Pattern Title](#pattern-number)
- **Solution Implementation**: [Solution Title](#solution-number)

# Comments
Discussion about this mapping...
```

**Automatische Rückverweise**:
- Pattern Discussion: Fügt `- #mapping-number` unter "Solution Implementations" hinzu
- Solution Discussion: Fügt `- #mapping-number` unter "Patterns" hinzu

### 4. Comment System

#### Kommentar erstellen
```typescript
// CommentCreator.tsx
await addDiscussionComment(discussionId, commentText);
```

**Features**:
- Markdown-Support (über GitHub API)
- Author-Info mit Avatar
- Reactions (👍, ❤️, 🎉, etc.)
- Pagination ("Load More Comments")
- Real-time Updates

### 5. Search Functionality

#### Globale Suche
```typescript
// src/pages/Search.tsx
const results = await searchDiscussions(searchTerm, cursor);
```

**Features**:
- Suche über alle Discussion-Kategorien
- Cursor-basierte Pagination
- Navigation zu Pattern/Solution Details
- Highlighting von Suchergebnissen

**Limitation**: GitHub Search API unterstützt kein Wildcard/Partial Matching

### 6. GitHub Sidebar Integration

#### Content Script Injection
```typescript
// src/content-script.tsx
if (isSolutionImplementationPage(url)) {
  const sidebar = createSidebarElement();
  injectIntoGitHubPage(sidebar);
  
  const root = createRoot(sidebar);
  root.render(<SolutionSidebar number={extractNumber(url)} />);
}
```

**Features**:
- Erscheint automatisch auf Solution Discussion Pages
- Zeigt verknüpfte Patterns
- Pattern-Auswahl mit Suche
- Inline Mapping-Erstellung
- Kommentarfunktion

---

## 🔌 API Integration

### GraphQL Client Setup

```typescript
// src/api/client.ts
let cachedClient: GraphQLClient | null = null;

export async function getClient(): Promise<GraphQLClient> {
  if (cachedClient) return cachedClient;
  
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  
  cachedClient = new GraphQLClient(GITHUB_API_ENDPOINT, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  
  return cachedClient;
}
```

### Wichtige Queries

#### 1. Repository & Categories laden
```graphql
query GetRepositoryIds($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    id
    discussionCategories(first: 10) {
      nodes {
        id
        name
      }
    }
  }
}
```

#### 2. Discussions Liste
```graphql
query GetDiscussions($categoryId: ID!, $cursor: String, $first: Int!) {
  node(id: $categoryId) {
    ... on DiscussionCategory {
      discussions(first: $first, after: $cursor) {
        nodes {
          id
          number
          title
          createdAt
          author { login, avatarUrl }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
}
```

#### 3. Discussion Details
```graphql
query GetDiscussionByNumber($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    discussion(number: $number) {
      id
      number
      title
      body
      category { id, name, emojiHTML }
      comments(first: 10) {
        nodes {
          id
          body
          author { login, avatarUrl }
          createdAt
          reactions(first: 10) {
            nodes { content, user { login } }
          }
        }
        pageInfo { hasNextPage, endCursor }
      }
    }
  }
}
```

#### 4. Discussion erstellen
```graphql
mutation CreateDiscussion(
  $repositoryId: ID!,
  $categoryId: ID!,
  $title: String!,
  $body: String!
) {
  createDiscussion(input: {
    repositoryId: $repositoryId,
    categoryId: $categoryId,
    title: $title,
    body: $body
  }) {
    discussion {
      id
      number
      title
      body
    }
  }
}
```

### Parser System

**Pattern Parser** (`src/api/parsers/patternParser.ts`):
```typescript
export function parsePatternBody(body: string): {
  icon: string | null;
  description: string | null;
  patternLanguage: string | null;
  patternRef: string | null;
  mappings: number[];
} {
  const iconRegex = /!\[.*?\]\((.*?)\)/;
  const descriptionRegex = /# Description\s+([\s\S]*?)(?=\n#|$)/m;
  const patternLanguageRegex = /# Pattern Language\s*\n((?:(?!^#)[\s\S])*?)(?=\n#|$)/m;
  const patternRefRegex = /\[.*?\]\((https?:\/\/[^\s)]+)\)/;
  const mappingsRegex = /# Solution Implementations\s*((?:.|\n)*?)(?=\n# |\n*$)/;
  
  // Regex matching und Extraktion...
  
  return { icon, description, patternLanguage, patternRef, mappings };
}
```

**Warum Regex statt Markdown Parser?**
- ✅ Lightweight (keine Dependencies)
- ✅ Volle Kontrolle über Format
- ✅ Performant für kleine Dokumente
- ⚠️ Anfällig für Format-Änderungen

---

## 🗂️ State Management

### React Context Pattern

```typescript
// src/context/DiscussionDataContext.tsx
export const DiscussionDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [discussionData, setDiscussionData] = useState<DiscussionData>(initialState);
  const [ids, setIds] = useState<RepositoryIds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initial load
  useEffect(() => {
    loadRepositoryIds();
  }, []);
  
  // Cache-Management
  const fetchDiscussionList = useCallback(async (categoryId, cursor, callback) => {
    const cacheKey = cursor || 'null';
    
    // Check cache
    if (discussionData.patterns.listData[cacheKey]) {
      callback(discussionData.patterns.listData[cacheKey]);
      return;
    }
    
    // Fetch from API
    const data = await getDiscussionsListData(categoryId, cursor, PAGE_SIZE);
    
    // Update cache
    setDiscussionData(prev => ({
      ...prev,
      patterns: {
        ...prev.patterns,
        listData: { ...prev.patterns.listData, [cacheKey]: data }
      }
    }));
    
    callback(data);
  }, [discussionData]);
  
  return (
    <DiscussionDataContext.Provider value={{
      discussionData,
      ids,
      loading,
      error,
      fetchDiscussionList,
      // ... weitere Functions
    }}>
      {children}
    </DiscussionDataContext.Provider>
  );
};
```

### Cache-Strategie

**Liste-Cache**:
```typescript
{
  listData: {
    'null': { discussions: [...], pageInfo: {...} },      // Seite 1
    'cursor_abc': { discussions: [...], pageInfo: {...} }, // Seite 2
    'cursor_xyz': { discussions: [...], pageInfo: {...} }  // Seite 3
  }
}
```

**Vorteile**:
- ✅ Schnelle Navigation (Back/Forward)
- ✅ Reduzierte API-Calls
- ✅ Offline-fähig (bei cached Daten)

**Cache Invalidation**:
```typescript
clearListCache('patterns'); // Nach Erstellung neuer Pattern
```

### Custom Hooks

#### useSolutionData (Content Script)
```typescript
export function useSolutionData(solutionNumber: number) {
  const [solutionDetails, setSolutionDetails] = useState<SolutionImplementation | null>(null);
  const [mappingDiscussions, setMappingDiscussions] = useState<PatternSolutionMapping[]>([]);
  const [patternDetails, setPatternDetails] = useState<PatternDetailsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      // 1. Lade Solution
      const solution = await fetchDiscussionDetailsByNumber(
        ids.solutionImplementationCategoryId,
        solutionNumber
      );
      
      // 2. Lade Mappings
      const mappings = await Promise.all(
        solution.mappings.map(num => fetchMappingDiscussionByNumber(num))
      );
      
      // 3. Lade Pattern-Details für jedes Mapping
      const patterns = await Promise.all(
        mappings.map(mapping => fetchDiscussionDetailsByNumber(
          ids.patternCategoryId,
          mapping.patternDiscussionNumber
        ))
      );
      
      setData({ solution, mappings, patterns });
    }
    
    loadData();
  }, [solutionNumber]);
  
  return { solutionDetails, mappingDiscussions, patternDetails, isLoading };
}
```

---

## 🎨 Styling System

### SCSS Architektur

```
src/styles/
├── globals.scss              # ✅ Global Styles & Imports
├── base/
│   ├── _variables.scss      # ✅ CSS Variables (Colors, Spacing)
│   ├── _typography.scss     # ✅ Font Definitions
│   └── _buttons.scss        # ✅ Button Styles
├── layout/
│   ├── AppLayout.scss       # ✅ App Container & Header
│   └── Sidebar.scss         # ✅ Sidebar Layout
├── pages/
│   ├── ListPage.scss        # ✅ List View Styling
│   ├── DetailPage.scss      # ✅ Detail View Styling
│   └── Login.scss           # ✅ Login Page
└── themes/
    ├── _light.scss          # ✅ Light Theme Variables
    └── _dark.scss           # ✅ Dark Theme Variables
```

### CSS Variables

```scss
// src/styles/base/_variables.scss
:root {
  // Colors
  --color-primary: #6750a4;
  --color-secondary: #625b71;
  --color-background: #f5f5f5;
  --color-surface: #ffffff;
  --color-text: #1c1b1f;
  
  // Spacing
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  // Border Radius
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  
  // Shadows
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
}

// Dark Theme
[data-theme="dark"] {
  --color-background: #1c1b1f;
  --color-surface: #2b2930;
  --color-text: #e6e1e5;
}
```

### CSS Modules

```scss
// src/components/Comment.module.scss
.commentCard {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-md);
}

.commentHeader {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}
```

**Verwendung**:
```tsx
import styles from './Comment.module.scss';

<div className={styles.commentCard}>
  <div className={styles.commentHeader}>
    <img src={avatar} className={styles.avatar} />
  </div>
</div>
```

### Theme Switching

```typescript
// Automatische Theme-Erkennung
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
```

---

## 🔐 Authentication & Security

### Personal Access Token (PAT)

**Erforderliche Scopes**:
- `repo` - Zugriff auf Repositories (private & public)
- `read:discussion` - Discussions lesen
- `write:discussion` - Discussions erstellen/bearbeiten

### Token Storage

```typescript
// src/api/auth.ts
export async function setToken(token: string): Promise<void> {
  await browser.storage.local.set({ githubToken: token });
  cachedToken = token;
}

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  
  const result = await browser.storage.local.get('githubToken');
  cachedToken = result.githubToken || null;
  return cachedToken;
}
```

**Security Features**:
- ✅ Token in `browser.storage.local` (encrypted by browser)
- ✅ Nicht im localStorage (XSS-geschützt)
- ✅ Niemals in Logs ausgegeben
- ✅ Validierung vor jeder API-Anfrage
- ✅ Automatischer Logout bei 401

### Token Validation

```typescript
export async function validateToken(token: string): Promise<boolean> {
  try {
    const client = new GraphQLClient(GITHUB_API_ENDPOINT, {
      headers: { authorization: `Bearer ${token}` },
    });
    
    await client.request(gql`
      query {
        viewer {
          login
        }
      }
    `);
    
    return true;
  } catch {
    return false;
  }
}
```

### Authentication Flow

```
1. User öffnet Extension
   ↓
2. Check: Token vorhanden?
   ├─ Nein → Login Page
   └─ Ja → Validate Token
            ├─ Valid → App laden
            └─ Invalid → Login Page
```

### Logout

```typescript
export async function logout(): Promise<void> {
  await browser.storage.local.remove('githubToken');
  cachedToken = null;
  clearClient(); // GraphQL Client Cache leeren
}
```

---

## 📊 Datenmodelle

### TypeScript Interfaces

#### Pattern
```typescript
export interface Pattern extends BaseDiscussion {
  icon: string;                    // Icon URL
  description: string;             // Pattern Beschreibung
  patternLanguage: string | null;  // Pattern Sprache (z.B. "GoF")
  patternRef: string;              // Referenz-URL
  mappings: number[];              // Mapping Discussion Numbers
}
```

#### SolutionImplementation
```typescript
export interface SolutionImplementation extends BaseDiscussion {
  solutionRefUrl: string;   // Repository/Documentation URL
  description: string;      // Implementation Beschreibung
  mappings: number[];       // Mapping Discussion Numbers
}
```

#### PatternSolutionMapping
```typescript
export interface PatternSolutionMapping extends BaseDiscussion {
  patternDiscussionNumber: number;
  solutionImplementationDiscussionNumber: number;
}
```

#### BaseDiscussion (GitHub)
```typescript
export interface BaseDiscussion {
  id: string;               // GraphQL Node ID
  number: number;           // Discussion Number
  title: string;
  body: string;             // Markdown Content
  createdAt: string;
  author: {
    login: string;
    avatarUrl: string;
  };
  category: {
    id: string;
    name: string;
    emojiHTML: string;
  };
  comments?: {
    nodes: Comment[];
    pageInfo: PageInfo;
  };
}
```

#### Comment
```typescript
export interface Comment {
  id: string;
  body: string;             // Markdown Content
  bodyHTML: string;         // Rendered HTML
  author: {
    login: string;
    avatarUrl: string;
  };
  createdAt: string;
  reactions?: {
    nodes: Array<{
      content: ReactionContent;  // THUMBS_UP, HEART, etc.
      user: { login: string };
    }>;
  };
}
```

### Datenfluss-Diagramm

```
GitHub Discussions (Raw Markdown)
        ↓
    GraphQL API
        ↓
   API Response (JSON)
        ↓
    Parser Functions
        ↓
  TypeScript Models (Pattern/Solution/Mapping)
        ↓
  React Context (State)
        ↓
    UI Components
```

---

## 🔨 Build & Deployment

### Build-Prozess

```bash
# Development Build mit Hot Reload
npm run dev

# Production Build
npm run build

# Preview Production Build
npm run preview

# Linting
npm run lint
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: './manifest.json',
      additionalInputs: ['src/content-script.tsx'],
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: 'index.html',
      },
    },
  },
});
```

### Build Output

```
dist/
├── manifest.json          # 0.51 KB
├── index.html            # Popup Entry
├── assets/
│   ├── index-[hash].js   # ~200 KB (popup)
│   ├── index-[hash].css  # ~20 KB
│   └── icons/
└── src/
    ├── background.js     # Service Worker
    ├── content-script.js # 341 KB (102 KB gzipped)
    └── extension-sidebar.css
```

### Extension Loading

**Chrome/Edge**:
1. Öffne `chrome://extensions/`
2. Aktiviere "Developer mode"
3. Klicke "Load unpacked"
4. Wähle `dist/` Ordner
5. Extension erscheint in Toolbar

### Deployment Checklist

- [ ] `npm run build` erfolgreich
- [ ] Keine TypeScript Errors
- [ ] Keine ESLint Warnings
- [ ] manifest.json Version aktualisiert
- [ ] README.md aktualisiert
- [ ] CHANGELOG.md erstellt
- [ ] GitHub Release erstellt
- [ ] dist/ als ZIP verpackt
- [ ] Screenshots erstellt
- [ ] Chrome Web Store Listing vorbereitet (optional)

---

## 🛠️ Development Guide

### Setup

```bash
# 1. Repository klonen
git clone https://github.com/PiaWippermann/PatternSolutionImplementationMappingExtension.git
cd PatternSolutionImplementationMappingExtension

# 2. Dependencies installieren
npm install

# 3. Konfiguration anpassen (optional)
# src/config/github.config.ts
export const GITHUB_REPO_OWNER = 'YourUsername';
export const GITHUB_REPO_NAME = 'YourRepoName';

# 4. Development Server starten
npm run dev

# 5. Extension in Browser laden
# Chrome: chrome://extensions/ → Load unpacked → dist/
```

### Entwicklungsworkflow

**1. Feature Branch erstellen**:
```bash
git checkout -b feature/new-feature-name
```

**2. Code ändern**:
- Hot Reload aktiv (Vite Dev Server)
- Browser-Extension auto-reload (bei manifest.json Änderungen manuell)

**3. Testen**:
```bash
# Build testen
npm run build

# Extension neu laden
# Chrome: Reload-Button in chrome://extensions/
```

**4. Commit & Push**:
```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature-name
```

### Code Conventions

**TypeScript**:
- Strict Mode aktiviert
- Explizite Return Types für Functions
- Interface statt Type (wo möglich)
- Named Exports bevorzugt

**React**:
- Functional Components + Hooks
- Props per Destructuring
- `React.FC<Props>` Type Annotation
- Custom Hooks mit `use` Prefix

**Naming**:
- Components: PascalCase (`PatternList.tsx`)
- Files: kebab-case für non-components (`github-api.ts`)
- Hooks: camelCase mit `use` (`usePatternSearch.ts`)
- Constants: SCREAMING_SNAKE_CASE (`PAGE_SIZE`)

**Imports**:
```typescript
// External
import React from 'react';
import { GraphQLClient } from 'graphql-request';

// Internal - Absolute Paths (@/ alias)
import { getClient } from '@/api';
import { Pattern } from '@/types';

// Relative
import './Component.scss';
```

### Debugging

**Console Logs**:
```typescript
// Development only
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}
```

**React DevTools**:
- Installiere React DevTools Extension
- Inspiziere Component Tree
- Profiling für Performance

**GraphQL Debugging**:
```typescript
// Teste Queries direkt
const client = await getClient();
const result = await client.request(query, variables);
console.log(JSON.stringify(result, null, 2));
```

**Extension Debugging**:
- **Popup**: Rechtsklick auf Extension Icon → Inspect
- **Content Script**: Browser DevTools → Console
- **Background**: chrome://extensions/ → "Inspect views: Service Worker"

---

## 🧪 Testing

### Testing Strategy (Empfohlen)

**1. Unit Tests** (nicht implementiert):
```typescript
// src/api/parsers/__tests__/patternParser.test.ts
import { parsePatternBody } from '../patternParser';

describe('parsePatternBody', () => {
  it('should extract description', () => {
    const body = `
# Description
This is a test pattern

# Pattern Reference
[Test](https://example.com)
    `;
    
    const result = parsePatternBody(body);
    expect(result.description).toBe('This is a test pattern');
  });
});
```

**2. Integration Tests**:
```typescript
// Test API Calls mit Mock Server
import { createPattern } from '@/api';

describe('createPattern', () => {
  it('should create pattern and return data', async () => {
    const pattern = await createPattern({
      repositoryId: 'test-id',
      categoryId: 'test-category',
      title: 'Test Pattern',
      description: 'Test',
      referenceUrl: 'https://example.com'
    });
    
    expect(pattern.title).toBe('Test Pattern');
  });
});
```

**3. E2E Tests** (mit Playwright):
```typescript
import { test, expect } from '@playwright/test';

test('create new pattern', async ({ page }) => {
  // 1. Login
  await page.goto('chrome-extension://[id]/index.html');
  await page.fill('input[type="password"]', 'token');
  await page.click('button[type="submit"]');
  
  // 2. Navigate to Create
  await page.click('text=Patterns');
  await page.click('button:has-text("+")');
  
  // 3. Fill Form
  await page.fill('input[name="title"]', 'New Pattern');
  await page.fill('textarea', 'Description');
  
  // 4. Submit
  await page.click('button[type="submit"]');
  
  // 5. Verify
  await expect(page.locator('text=New Pattern')).toBeVisible();
});
```

### Manual Testing Checklist

**Authentication**:
- [ ] Login mit gültigem Token
- [ ] Login mit ungültigem Token
- [ ] Logout
- [ ] Token Persistence (nach Reload)

**Pattern Management**:
- [ ] Pattern-Liste laden
- [ ] Pattern-Details anzeigen
- [ ] Neues Pattern erstellen
- [ ] Pagination funktioniert

**Solution Management**:
- [ ] Solution-Liste laden
- [ ] Solution-Details anzeigen
- [ ] Neue Solution erstellen
- [ ] Pagination funktioniert

**Mapping**:
- [ ] Mapping von Pattern aus erstellen
- [ ] Mapping von Solution aus erstellen (Sidebar)
- [ ] Mappings in Details anzeigen
- [ ] Bidirektionale Links funktionieren

**Comments**:
- [ ] Kommentare anzeigen
- [ ] Neuen Kommentar erstellen
- [ ] "Load More" funktioniert
- [ ] Reactions werden angezeigt

**Search**:
- [ ] Suche findet Patterns
- [ ] Suche findet Solutions
- [ ] Navigation zu Details funktioniert
- [ ] Pagination funktioniert

**Content Script**:
- [ ] Sidebar erscheint auf Solution Pages
- [ ] Pattern-Liste lädt
- [ ] Pattern-Suche funktioniert
- [ ] Mapping erstellen funktioniert

---

## 🐛 Troubleshooting

### Häufige Probleme

#### 1. "Invalid Token" Error

**Problem**: Login schlägt fehl oder API Calls geben 401 zurück

**Lösungen**:
- Token hat nicht die richtigen Scopes (`repo`, `read:discussion`, `write:discussion`)
- Token ist abgelaufen
- Token wurde revoked in GitHub Settings
- **Fix**: Neues Token mit korrekten Scopes erstellen

#### 2. Content Script lädt nicht

**Problem**: Sidebar erscheint nicht auf GitHub Pages

**Lösungen**:
- Nicht auf einer Solution Implementation Discussion Page
- Extension nicht authentifiziert
- Browser-Cache
- **Fix**: 
  ```bash
  # 1. Logout & Login
  # 2. Page neu laden (Cmd+Shift+R)
  # 3. Extension neu laden in chrome://extensions/
  ```

#### 3. Build Errors

**Problem**: `npm run build` schlägt fehl

**Lösungen**:
```bash
# TypeScript Errors
npm run build 2>&1 | grep error

# Cache leeren
rm -rf node_modules dist
npm install
npm run build

# Dependencies updaten
npm update
```

#### 4. Pagination funktioniert nicht

**Problem**: "Next Page" Button disabled obwohl mehr Daten verfügbar

**Lösung**:
- Context Cache invalidieren
- **Fix**: 
  ```typescript
  clearListCache('patterns');
  // Dann Liste neu laden
  ```

#### 5. Kommentare werden nicht angezeigt

**Problem**: Comments-Section leer obwohl Kommentare existieren

**Lösungen**:
- GitHub API Permissions fehlen
- Discussion hat keine Kommentare
- **Fix**: "Load More Comments" Button klicken

#### 6. Search findet nichts

**Problem**: Suche gibt keine Ergebnisse zurück

**Lösungen**:
- GitHub Search API hat Einschränkungen (kein Wildcard Matching)
- Suchterm muss exakt matchen
- **Fix**: Ganzes Wort verwenden, nicht Teil-Strings

#### 7. Memory Leaks

**Problem**: Extension wird langsam über Zeit

**Lösungen**:
- Zu viele cached Discussions
- Content Scripts nicht aufgeräumt
- **Fix**: 
  ```typescript
  // In Context
  useEffect(() => {
    return () => {
      // Cleanup
    };
  }, []);
  ```

### Debug-Kommandos

```bash
# Logs von Background Script
chrome://extensions/ → Inspect Service Worker → Console

# Network Requests prüfen
DevTools → Network → Filter: graphql

# Storage inspizieren
DevTools → Application → Storage → Local Storage

# Bundle Size analysieren
npm run build -- --mode analyze

# TypeScript strikt prüfen
npx tsc --noEmit
```

---

## 📚 Weitere Ressourcen

### Interne Dokumentation
- [README.md](./README.md) - Projekt-Übersicht & Quickstart
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Authentication Details
- [src/api/README.md](./src/api/README.md) - API Module Dokumentation
- [src/config/README.md](./src/config/README.md) - Configuration Guide
- [src/content-script/README.md](./src/content-script/README.md) - Content Script Details

### Externe Ressourcen
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [React 19 Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

### Community
- GitHub Issues: [Report Bugs](https://github.com/PiaWippermann/PatternSolutionImplementationMappingExtension/issues)
- GitHub Discussions: [Ask Questions](https://github.com/PiaWippermann/PatternSolutionImplementationMappingExtension/discussions)

---

## 📝 Changelog

### Version 1.1.0 (Aktuell - in Entwicklung)
- ✅ **Pattern Language Field** hinzugefügt
  - Pattern Language in Pattern-Erstellung
  - Pattern Language Display in Details
  - Pattern Language in Mapping-Sidebar
- ✅ Placeholder-Texte für Input-Felder
- ✅ Parser-Regex verbessert für bessere Extraktion

### Version 1.0.0
- ✅ Initiales Release
- ✅ Pattern Management (CRUD)
- ✅ Solution Implementation Management (CRUD)
- ✅ Bidirektionale Mappings
- ✅ Comment System
- ✅ Search Functionality
- ✅ GitHub Sidebar Integration
- ✅ Personal Access Token Authentication
- ✅ Light/Dark Theme Support

---

## 🎓 Lizenz & Credits

**Autor**: Pia Wippermann  
**GitHub**: [@PiaWippermann](https://github.com/PiaWippermann)  
**Repository**: [PatternSolutionImplementationMappingExtension](https://github.com/PiaWippermann/PatternSolutionImplementationMappingExtension)

**Kontext**: Dieses Projekt ist Teil einer Masterarbeit.

**Technologie-Credits**:
- React Team für React 19
- Vite Team für Build Tooling
- GitHub für GraphQL API
- FontAwesome für Icons
- SASS Team für SCSS

---

**© 2025 Pia Wippermann. All rights reserved.**

*Letzte Aktualisierung: 10. Oktober 2025*
