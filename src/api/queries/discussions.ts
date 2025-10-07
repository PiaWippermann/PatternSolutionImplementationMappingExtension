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

/**
 * Fetches a list of discussions for a specific category with pagination
 */
export async function getDiscussionsListData(
  categoryId: string,
  cursor: string | null,
  pageSize: number
): Promise<{ nodes: SimpleDiscussion[]; pageInfo: PageInfo }> {
  const client = await getClient();

  const data: any = await client.request(GET_DISCUSSIONS_QUERY, {
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

  const data: any = await client.request(GET_SIMPLE_DISCUSSION_BY_NUMBER_QUERY, {
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

  const data: any = await client.request(GET_COMMENTS_QUERY, {
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

  const data: any = await client.request(CREATE_DISCUSSION_MUTATION, {
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

  const data: any = await client.request(ADD_COMMENT_MUTATION, {
    discussionId,
    body,
  });

  return data.addDiscussionComment.comment;
}

/**
 * Searches discussions by title
 */
export async function searchDiscussions(
  searchTerm: string,
  categoryId: string,
  limit: number = 20
): Promise<SimpleDiscussion[]> {
  const client = await getClient();

  // Build search query string
  const queryString = `repo:${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME} ${searchTerm} in:title`;

  const data: any = await client.request(SEARCH_DISCUSSIONS_QUERY, {
    queryString,
    first: limit,
  });

  // Filter by category if needed
  const discussions = data.search.edges
    .map((edge: any) => edge.node)
    .filter((discussion: any) => discussion.category.id === categoryId);

  return discussions.map((discussion: any) => ({
    id: discussion.id,
    title: discussion.title,
    number: discussion.number,
  }));
}
