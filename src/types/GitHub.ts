// this file contains types related to GitHub GraphQL API responses

export type Author = {
    login: string;
    avatarUrl: string;
}

export type Reaction = {
    content: string;
    user: {
        name: string;
        avatarUrl: string;
    };
}

export type Comment = {
    id: string;
    body: string;
    publishedAt: string;
    author: Author;
    reactions: {
        nodes: Reaction[];
    };
}

export type PageInfo = {
    endCursor: string | null;
    hasNextPage: boolean;
};

export type DiscussionCategory = {
    id: string;
    name: string;
    description: string;
    emojiHTML: string;
}

export type SimpleDiscussion = {
    id: string;
    number: number;
    title: string;
}

export interface BaseDiscussion {
    id: string;
    number: number;
    title: string;
    url: string;
    body: string;
    category: DiscussionCategory;
    createdAt: string;
    viewerCanUpdate: boolean;
    viewerCanDelete: boolean;
    author: Author;
    comments: {
        nodes: Comment[];
        pageInfo: PageInfo;
    };
    reactions: {
        nodes: Reaction[];
    };
}