/**
 * Type definitions for GitHub GraphQL API responses
 */

import type { BaseDiscussion, Comment, PageInfo } from './GitHub';

export interface GetDiscussionsResponse {
  repository: {
    discussions: {
      nodes: BaseDiscussion[];
      pageInfo: PageInfo;
    };
  };
}

export interface GetSimpleDiscussionResponse {
  repository: {
    discussion: BaseDiscussion;
  };
}

export interface GetCommentsResponse {
  node: {
    comments: {
      nodes: Comment[];
      pageInfo: PageInfo;
    };
  };
}

export interface CreateDiscussionResponse {
  createDiscussion: {
    discussion: BaseDiscussion;
  };
}

export interface AddCommentResponse {
  addDiscussionComment: {
    comment: Comment;
  };
}

export interface UpdateDiscussionResponse {
  updateDiscussion: {
    discussion: BaseDiscussion;
  };
}

export interface SearchDiscussionsResponse {
  search: {
    discussionCount: number;
    edges: Array<{
      node: BaseDiscussion;
    }>;
    pageInfo: PageInfo;
  };
}

export interface RepositoryCategory {
  id: string;
  name: string;
  description: string;
  emojiHTML: string;
}

export interface GetRepositoryIdsResponse {
  repository: {
    id: string;
    discussionCategories: {
      nodes: RepositoryCategory[];
    };
  };
}

export interface ValidateTokenResponse {
  viewer: {
    login: string;
    avatarUrl: string;
    email: string | null;
  };
}
