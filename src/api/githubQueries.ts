// in this file, we define the GraphQL queries and mutations for loading discussions and creating new discussions on GitHub.
import { GraphQLClient, gql } from "graphql-request";
import type {
    BaseDiscussion,
    Comment,
    PageInfo
} from "../types/GitHub";
import type { RepositoryIds } from "../types/DiscussionData";
import { GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_API_ENDPOINT } from "../config";

// Repository configuration
const owner = GITHUB_REPO_OWNER;
const repo = GITHUB_REPO_NAME;
const endpoint = GITHUB_API_ENDPOINT;

// Client cache for performance
let cachedClient: GraphQLClient | null = null;

/**
 * Gets a GraphQL client with the current authentication token.
 * The client is cached for performance.
 * @returns GraphQL client with authentication.
 */
async function getClient(): Promise<GraphQLClient> {
    if (cachedClient) return cachedClient;

    // Dynamic import to avoid circular dependency
    const { getToken } = await import('./auth');
    const token = await getToken();

    if (!token) {
        throw new Error('No authentication token found. Please login.');
    }

    cachedClient = new GraphQLClient(endpoint, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return cachedClient;
}

/**
 * Clears the cached GraphQL client.
 * Should be called after logout.
 */
export function clearClientCache(): void {
    cachedClient = null;
}

// Queries and mutations defined below

// Query to get repository and discussion category IDs
const GET_REPO_IDS_QUERY = gql`
  query GetIds($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      discussionCategories(first: 100) {
        nodes {
          id
          name
        }
      }
    }
  }
`;

// Query to get a discussion by its ID
const GET_SIMPLE_DISCUSSION_BY_NUMBER_QUERY = gql`
  query GetDiscussionByNumber($repoOwner: String!, $repoName: String!, $discussionNumber: Int!) {
  repository(owner: $repoOwner, name: $repoName) {
    discussion(number: $discussionNumber) {
      id
      number
      author {
        avatarUrl
        login
      }
      body
      category {
        id
        name
        description
        emojiHTML
      }
      createdAt
      title
      url
      viewerCanDelete
      viewerCanUpdate
    }
  }
}
`;

// Query to get discussion base information with pagination and by category
const GET_DISCUSSIONS_QUERY = gql`
  query GetDiscussions($first: Int!, $after: String, $categoryId: ID!, $owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      discussions(first: $first, after: $after, categoryId: $categoryId) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          id
          title
          number
        }
      }
    }
  }
`;

// Query to get discussion body for URL extraction
const GET_SOLUTIONS_BODY = gql`
  query GetSolutionsBody($first: Int!, $after: String, $categoryId: ID!, $owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      discussions(first: $first, after: $after, categoryId: $categoryId) {
        pageInfo {
            endCursor
            hasNextPage
        }  
        nodes {
          number
          id
          body
        }
      }
    }
  }
`;

// Mutation to create a discussion
const CREATE_DISCUSSION_MUTATION = gql`
    mutation CreateDiscussion($input: CreateDiscussionInput!) {
      createDiscussion(input: $input) {
        discussion {
          id
          title
          url
          number
          author {
            avatarUrl
            login
          }
          category {
            id
            name
            description
            emojiHTML
          }
          createdAt
          body
          viewerCanDelete
          viewerCanUpdate
          comments(first: 100) {
            nodes {
              author {
                login
                avatarUrl
              }
              body
              id
              publishedAt
              reactions(first: 10) {
                nodes {
                  content
                  user {
                    name
                    avatarUrl
                  }
                }
              }
            }
          }
          reactions(first: 10) {
            nodes {
              content
              user {
                login
                avatarUrl
              }
            }
          }
        }
      }
    }
  `;

// Mutation to update a discussion
const UPDATE_DISCUSSION_MUTATION = gql`
    mutation UpdateDiscussion($input: UpdateDiscussionInput!) {
      updateDiscussion(input: $input) {
        discussion {
          id
          number
          author {
            avatarUrl
            login
          }
          body
          category {
            id
            name
            description
            emojiHTML
          }
          createdAt
          title
          url
          viewerCanDelete
          viewerCanUpdate
          comments(first: 100) {
            nodes {
              author {
                login
                avatarUrl
              }
              body
              id
              publishedAt
              reactions(first: 10) {
                nodes {
                  content
                  user {
                    name
                    avatarUrl
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

// Corrected Mutation to add a discussion comment
const ADD_DISCUSSION_COMMENT = gql`
  mutation AddDiscussionComment($discussionId: ID!, $body: String!) {
    addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
      comment {
        id
        body
        publishedAt
        author {
          login
          avatarUrl
        }
        reactions(first: 10) {
          nodes {
            content
            user {
              name
              avatarUrl
            }
          }
        }
      }
    }
  }
`;

const GET_DISCUSSION_COMMENTS_QUERY = gql`
  query GetDiscussionComments($discussionId: ID!, $first: Int, $after: String) {
  node(id: $discussionId) {
    ... on Discussion {
      comments(first: $first, after: $after) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          id
          body
          publishedAt
          author {
            login
            avatarUrl
          }
          reactions(first: 10) {
            nodes {
              content
              user {
                login
              }
            }
          }
        }
      }
    }
  }
}
`;

const SEARCH_DISCUSSIONS_QUERY = gql`
  query SearchDiscussions($queryString: String!, $first: Int!, $after: String) {
    search(
      query: $queryString
      type: DISCUSSION
      first: $first
      after: $after
    ) {
      discussionCount
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        ... on Discussion {
          id
          title
          number
          url
          repository {
            nameWithOwner
          }
          category {
            id
            name
          }
        }
      }
    }
  }
`;

// Query to validate token and get current user info
const VALIDATE_TOKEN_QUERY = gql`
  query ValidateToken {
    viewer {
      login
      name
      avatarUrl
    }
  }
`;

/**
 * Gets a paginated list of discussions for a given category.
 * This category can be either referred to as "Patterns" or "Realizations".
 * * @param categoryId 
 * @param cursor 
 * @param pageSize 
 * @returns 
 */
export const getDiscussionsListData = async (
    categoryId: string,
    cursor: string | null,
    pageSize: number = 10
) => {
    // Add owner and repo to the variables object
    const variables = { first: pageSize, after: cursor, categoryId, owner, repo };

    const client = await getClient();
    const data = await client.request<{
        repository: {
            discussions: {
                pageInfo: {
                    endCursor: string;
                    hasNextPage: boolean;
                };
                nodes: { id: string; title: string, number: number }[];
            };
        };
    }>(GET_DISCUSSIONS_QUERY, variables);

    return data.repository.discussions;
};

/**
 * Fetches the IDs of the repository and the relevant discussion categories.
 * @returns IDs of the repository and the relevant discussion categories
 */
export const getRepositoryIds = async (): Promise<RepositoryIds> => {
    console.log("Fetching repository and category IDs from GitHub...", owner, repo, endpoint);
    const variables = { owner, name: repo };

    const client = await getClient();
    const data = await client.request<{
        repository: {
            id: string;
            discussionCategories: { nodes: { id: string; name: string }[] };
        };
    }>(GET_REPO_IDS_QUERY, variables);

    const repositoryId = data.repository.id;
    let solutionImplementationCategoryId = "";
    let patternCategoryId = "";
    let patternSolutionMappingCategoryId = "";

    for (const category of data.repository.discussionCategories.nodes) {
        if (category.name === "Solution Implementations") {
            solutionImplementationCategoryId = category.id;
        } else if (category.name === "Patterns") {
            patternCategoryId = category.id;
        } else if (category.name == "Pattern - Solution Implementation Mapping") {
            patternSolutionMappingCategoryId = category.id;
        }
    }

    if (!solutionImplementationCategoryId || !patternCategoryId) {
        throw new Error("One or more discussion categories not found");
    }

    return { repositoryId, patternCategoryId, solutionImplementationCategoryId, patternSolutionMappingCategoryId };
};

/**
 * Mutation to create a new discussion.
 * Used when creating new patterns or solution implementations.
 * @param title 
 * @param body 
 * @param categoryId 
 * @param repositoryId 
 * @returns 
 */
export const createDiscussion = async (
    title: string,
    body: string,
    categoryId: string,
    repositoryId: string
) => {
    const mutation = CREATE_DISCUSSION_MUTATION;

    const variables = {
        input: {
            repositoryId: repositoryId,
            title,
            body,
            categoryId,
        },
    };

    const client = await getClient();
    const response = await client.request<{
        createDiscussion: {
            discussion: BaseDiscussion;
        };
    }>(
        mutation,
        variables
    );

    return response.createDiscussion.discussion;
};

/**
 * Mutation to update the body of a discussion.
 * Used when editing patterns or solution implementations.
 * @param discussionId 
 * @param newBody 
 * @returns 
 */
export const updateDiscussionBody = async (
    discussionId: string,
    newBody: string
) => {
    const mutation = UPDATE_DISCUSSION_MUTATION;

    const variables = {
        input: {
            discussionId: discussionId,
            body: newBody,
        },
    };

    const client = await getClient();
    const response = await client.request<{ updateDiscussion: { discussion: BaseDiscussion } }>(
        mutation,
        variables
    );
    return response.updateDiscussion.discussion;
};

/**
 * Given a discussion ID, fetches the corresponding discussion details from GitHub.
 * This method is used when navigating to the detail view of a pattern or solution implementation.
 * @param discussionId
 * @returns 
 */
export const getDiscussionDetails = async (discussionNumber: number) => {
    let query = "";
    query = GET_SIMPLE_DISCUSSION_BY_NUMBER_QUERY;

    // 💡 Die Variablen müssen mit den Variablennamen im GraphQL-Query übereinstimmen
    const variables = {
        discussionNumber,
        repoOwner: owner,
        repoName: repo
    };

    const client = await getClient();
    const data = await client.request<{ repository: { discussion: BaseDiscussion } }>(query, variables);
    return data.repository.discussion;
};

/**
 * Creates a comment with given text (body) for a given discussion.
 * Used to comment on mapping discussions
 * @param discussionId 
 * @param body 
 * @returns 
 */
export const createDiscussionComment = async (discussionId: string, body: string) => {
    const mutation = ADD_DISCUSSION_COMMENT;

    const variables = {
        discussionId,
        body
    };

    const client = await getClient();
    const response = await client.request<{ addDiscussionComment: { comment: Comment } }>(mutation, variables);

    return response.addDiscussionComment.comment;
}

export const fetchDiscussionComments = async (discussionId: string, first: number, after?: string) => {
    const query = GET_DISCUSSION_COMMENTS_QUERY;

    const variables = {
        discussionId,
        first,
        after
    };

    const client = await getClient();
    const data = await client.request<{ node: { comments: { nodes: Comment[], pageInfo: PageInfo } } }>(query, variables);
    return data.node.comments;
}

export const fetchAllSolutionsBody = async (categoryId: string) => {
    // Fetch all discussions in the "Solution Implementations" category
    // First and after are used for pagination and we increase it until there are no more pages
    let allDiscussions: { id: string; number: number; body: string }[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    const pageSize = 50; // Adjust the page size as needed
    const query = GET_SOLUTIONS_BODY;

    const client = await getClient();
    while (hasNextPage) {
        const variables: { first: number; after: string | null; categoryId: string; owner: string; repo: string } = { first: pageSize, after: cursor, categoryId, owner, repo };
        const data = await client.request<{
            repository: {
                discussions: {
                    pageInfo: { endCursor: string; hasNextPage: boolean };
                    nodes: { id: string; number: number; body: string }[];
                };
            };
        }>(query, variables);

        allDiscussions = allDiscussions.concat(data.repository.discussions.nodes);
        hasNextPage = data.repository.discussions.pageInfo.hasNextPage;
        cursor = data.repository.discussions.pageInfo.endCursor;
    }

    return allDiscussions;
}

/**
 * Searches for discussions based on a search string, excluding the mapping category.
 * @param searchString The search term provided by the user.
 * @param after The cursor for pagination.
 * @param first The number of results to return.
 * @param repoName The name of the repository.
 * @param mappingCategoryName The name of the category to exclude.
 * @returns A list of matching discussions and pagination info.
 */
export const searchDiscussions = async (
    searchString: string,
    first: number,
    repoName: string,
    mappingCategoryName: string,
    after?: string | null
) => {
    const fullQueryString = `repo:${owner}/${repoName} -category:"${mappingCategoryName}" ${searchString}`;

    const variables = {
        queryString: fullQueryString,
        first,
        after,
    };

    const client = await getClient();
    const data = await client.request<{
        search: {
            discussionCount: number;
            pageInfo: {
                endCursor: string;
                hasNextPage: boolean;
            };
            nodes: {
                id: string;
                title: string;
                number: number;
                url: string;
                repository: { nameWithOwner: string };
                category: { id: string; name: string };
            }[];
        };
    }>(SEARCH_DISCUSSIONS_QUERY, variables);

    return data.search;
};

/**
 * Validates a GitHub token by making a test query to the GitHub API.
 * @param token The token to validate.
 * @returns True if the token is valid, false otherwise.
 */
export const validateGitHubToken = async (token: string): Promise<boolean> => {
    try {
        const testClient = new GraphQLClient(endpoint, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        await testClient.request(VALIDATE_TOKEN_QUERY);
        return true;
    } catch (error) {
        console.error('Token validation failed:', error);
        return false;
    }
};

/**
 * Gets information about the currently authenticated user.
 * @returns User information or null if not authenticated.
 */
export const getCurrentUserInfo = async (): Promise<{ login: string; name: string | null; avatarUrl: string } | null> => {
    try {
        const client = await getClient();
        const data = await client.request<{ viewer: { login: string; name: string | null; avatarUrl: string } }>(VALIDATE_TOKEN_QUERY);
        return data.viewer;
    } catch (error) {
        console.error('Failed to get current user info:', error);
        return null;
    }
};