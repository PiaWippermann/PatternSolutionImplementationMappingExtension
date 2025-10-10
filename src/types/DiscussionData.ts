// this file contains types related to discussions, patterns, and solution implementations and pattern-solution implementation links

import type { BaseDiscussion, SimpleDiscussion, PageInfo } from "./GitHub";

export interface Pattern extends BaseDiscussion {
    icon: string;
    description: string;
    patternLanguage: string | null;
    patternRef: string;
    mappings: number[];
}

export interface SolutionImplementation extends BaseDiscussion {
    solutionRefUrl: string;
    description: string;
    mappings: number[];
}

export interface PatternSolutionMapping extends BaseDiscussion {
    patternDiscussionNumber: number;
    solutionImplementationDiscussionNumber: number;
};

export type ListData = {
    discussions: SimpleDiscussion[];
    pageInfo: PageInfo;
};

export type DiscussionData = {
    patterns: {
        details: Pattern[];
        // Cache for the list data, indexed by the 'endCursor' of the previous page.
        // The first entry is stored under the key 'null'.
        listData: {
            [cursor: string]: ListData;
        };
        currentPageCursor: string | null;
    };
    solutionImplementations: {
        details: SolutionImplementation[];
        listData: {
            [cursor: string]: ListData;
        };
        currentPageCursor: string | null;
    };
    patternSolutionMappings: PatternSolutionMapping[];
};

export type RepositoryIds = {
    repositoryId: string;
    solutionImplementationCategoryId: string;
    patternCategoryId: string;
    patternSolutionMappingCategoryId: string;
};
