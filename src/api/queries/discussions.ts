/**
 * Discussions API
 * 
 * Functions for interacting with GitHub discussions.
 */

import { getClient } from "../client";
import {
  GET_DISCUSSIONS_QUERY,
  GET_SIMPLE_DISCUSSION_BY_NUMBER_QUERY,
  GET_COMMENTS_QUERY,
  CREATE_DISCUSSION_MUTATION,
  ADD_COMMENT_MUTATION,
  SEARCH_DISCUSSIONS_QUERY
} from "./index";
import { GITHUB_REPO_OWNER, GITHUB_REPO_NAME } from "../../config";
import type { BaseDiscussion, Comment, PageInfo, SimpleDiscussion } from "../../types/GitHub";
import type {
  GetDiscussionsResponse,
  GetSimpleDiscussionResponse,
  GetCommentsResponse,
  CreateDiscussionResponse,
  AddCommentResponse,
  SearchDiscussionsResponse
} from "../../types/GraphQLResponses";

/**
 * Fetches a list of discussions for a specific category with pagination
 */
export async function getDiscussionsListData(
  categoryId: string,
  cursor: string | null,
  pageSize: number
): Promise<{ nodes: SimpleDiscussion[]; pageInfo: PageInfo }> {
  const client = await getClient();

  const data = await client.request<GetDiscussionsResponse>(GET_DISCUSSIONS_QUERY, {
    first: pageSize,
    after: cursor,
    categoryId,
    owner: GITHUB_REPO_OWNER,
    repo: GITHUB_REPO_NAME,
  });

  return data.repository.discussions;
}

/**
 * Fetches detailed information about a specific discussion by its number
 */
export async function getDiscussionDetails(discussionNumber: number): Promise<BaseDiscussion> {
  const client = await getClient();

  const data = await client.request<GetSimpleDiscussionResponse>(GET_SIMPLE_DISCUSSION_BY_NUMBER_QUERY, {
    repoOwner: GITHUB_REPO_OWNER,
    repoName: GITHUB_REPO_NAME,
    discussionNumber,
  });

  return data.repository.discussion;
}

/**
 * Fetches comments for a specific discussion
 */
export async function fetchDiscussionComments(
  discussionId: string,
  pageSize: number = 10,
  cursor: string | null = null
): Promise<{ nodes: Comment[]; pageInfo: PageInfo }> {
  const client = await getClient();

  const data = await client.request<GetCommentsResponse>(GET_COMMENTS_QUERY, {
    discussionId,
    first: pageSize,
    after: cursor,
  });

  return data.node.comments;
}

/**
 * Creates a new discussion
 */
export async function createDiscussion(
  repositoryId: string,
  categoryId: string,
  title: string,
  body: string
): Promise<BaseDiscussion> {
  const client = await getClient();

  const data = await client.request<CreateDiscussionResponse>(CREATE_DISCUSSION_MUTATION, {
    repositoryId,
    categoryId,
    title,
    body,
  });

  return data.createDiscussion.discussion;
}

/**
 * Adds a comment to a discussion
 */
export async function addDiscussionComment(
  discussionId: string,
  body: string
): Promise<Comment> {
  const client = await getClient();

  const data = await client.request<AddCommentResponse>(ADD_COMMENT_MUTATION, {
    discussionId,
    body,
  });

  return data.addDiscussionComment.comment;
}

/**
 * Searches discussions in Patterns and Solution Implementations categories
 * Excludes the Mapping category to search only in the actual content
 * Uses GitHub's default search without wildcards for exact word matching
 * Can optionally filter by a specific category
 */
export async function searchDiscussions(
  searchTerm: string,
  mappingCategoryName: string = "Pattern - Solution Implementation Mapping",
  limit: number = 10,
  cursor: string | null = null,
  categoryId?: string
): Promise<{
  nodes: Array<{ id: string; title: string; number: number; category: { id: string; name: string } }>;
  pageInfo: PageInfo;
  discussionCount: number;
}> {
  const client = await getClient();

  const trimmedTerm = searchTerm.trim();

  // Build search query that excludes the mapping category
  // GitHub will search for the terms in title and body by default
  const queryString = `repo:${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME} -category:"${mappingCategoryName}" ${trimmedTerm}`;

  // If a specific categoryId is provided, we need to filter by category name
  // Note: GitHub Search doesn't support filtering by category ID, so we'll filter client-side

  const data = await client.request<SearchDiscussionsResponse>(SEARCH_DISCUSSIONS_QUERY, {
    queryString,
    first: limit,
    after: cursor,
  });

  interface SearchNode {
    id: string;
    title: string;
    number: number;
    category: {
      id: string;
      name: string;
    };
  }

  // Map the results directly from GitHub Search API
  let nodes: SearchNode[] = data.search.edges.map((edge) => ({
    id: edge.node.id,
    title: edge.node.title,
    number: edge.node.number,
    category: {
      id: edge.node.category.id,
      name: edge.node.category.name
    }
  }));

  // If categoryId is provided, filter client-side
  if (categoryId) {
    nodes = nodes.filter((node) => node.category.id === categoryId);
  }

  return {
    nodes,
    pageInfo: data.search.pageInfo,
    discussionCount: categoryId ? nodes.length : data.search.discussionCount
  };
}
