/**
 * GraphQL Query Definitions
 * 
 * Contains all GraphQL query strings used in the application.
 */

import { gql } from "graphql-request";

/**
 * Query to get repository and discussion category IDs
 */
export const GET_REPO_IDS_QUERY = gql`
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

/**
 * Query to get a discussion by its number
 */
export const GET_SIMPLE_DISCUSSION_BY_NUMBER_QUERY = gql`
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

/**
 * Query to get discussions with pagination by category
 */
export const GET_DISCUSSIONS_QUERY = gql`
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

/**
 * Query to get comments for a discussion
 */
export const GET_COMMENTS_QUERY = gql`
  query GetComments($discussionId: ID!, $first: Int!, $after: String) {
    node(id: $discussionId) {
      ... on Discussion {
        comments(first: $first, after: $after) {
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            id
            author {
              avatarUrl
              login
            }
            body
            createdAt
            publishedAt
            reactions(first: 100) {
              nodes {
                content
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Mutation to create a new discussion
 */
export const CREATE_DISCUSSION_MUTATION = gql`
  mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $body: String!, $title: String!) {
    createDiscussion(input: {repositoryId: $repositoryId, categoryId: $categoryId, body: $body, title: $title}) {
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
      }
    }
  }
`;

/**
 * Mutation to add a comment to a discussion
 */
export const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($discussionId: ID!, $body: String!) {
    addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
      comment {
        id
        author {
          avatarUrl
          login
        }
        body
        createdAt
        publishedAt
        reactions(first: 100) {
          nodes {
            content
          }
        }
      }
    }
  }
`;

/**
 * Query to validate a GitHub token and get current user info
 */
export const VALIDATE_TOKEN_QUERY = gql`
  query ValidateToken {
    viewer {
      login
      avatarUrl
    }
  }
`;

/**
 * Query to search discussions by title
 */
export const SEARCH_DISCUSSIONS_QUERY = gql`
  query SearchDiscussions($queryString: String!, $first: Int!) {
    search(query: $queryString, type: DISCUSSION, first: $first) {
      discussionCount
      edges {
        node {
          ... on Discussion {
            id
            title
            number
            body
            category {
              id
              name
            }
          }
        }
      }
    }
  }
`;
