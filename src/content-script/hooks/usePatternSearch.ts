/**
 * Custom Hook for pattern search functionality
 */

import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import type { SimpleDiscussion, PageInfo } from '../../types/GitHub';
import type { PatternSolutionMapping } from '../../types/DiscussionData';
import { getDiscussionsListData, searchDiscussions } from '../../api';

const PAGE_SIZE = 10;

export function usePatternSearch(
    isInAddMappingMode: boolean,
    mappingDiscussions: (PatternSolutionMapping | undefined)[]
) {
    const [patternMappingOptionList, setPatternMappingOptionList] = useState<SimpleDiscussion[]>([]);
    const [listPageInfo, setListPageInfo] = useState<PageInfo | null>(null);
    const [listPageHistory, setListPageHistory] = useState<Array<string | null>>([null]);
    const [currentListPageIndex, setCurrentListPageIndex] = useState<number>(0);
    const [patternSearchTerm, setPatternSearchTerm] = useState<string>('');
    const [patternSearchInput, setPatternSearchInput] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isInAddMappingMode) {
            loadPatternOptions();
        }
    }, [isInAddMappingMode, currentListPageIndex, patternSearchTerm]);

    const loadPatternOptions = async () => {
        setIsLoading(true);
        
        const { repositoryIds: ids } = await browser.storage.local.get('repositoryIds') as {
            repositoryIds: {
                patternCategoryId: string;
                solutionImplementationCategoryId: string;
                repositoryId: string;
                patternSolutionMappingCategoryId: string;
            } | null;
        };

        if (!ids || !ids.patternCategoryId) {
            setIsLoading(false);
            return;
        }

        try {
            const currentCursor = listPageHistory[currentListPageIndex];
            let response;

            // If search term is provided, use search API, otherwise use list API
            if (patternSearchTerm.trim()) {
                setIsSearching(true);
                response = await searchDiscussions(
                    patternSearchTerm,
                    "Pattern - Solution Implementation Mapping",
                    PAGE_SIZE,
                    currentCursor,
                    ids.patternCategoryId // Filter by pattern category
                );
            } else {
                setIsSearching(false);
                response = await getDiscussionsListData(ids.patternCategoryId, currentCursor, PAGE_SIZE);
            }

            if (response) {
                // 1. Get the numbers of all target discussions that are already linked via a mapping.
                const mappedTargetNumbers = mappingDiscussions
                    .map(mapping => mapping?.patternDiscussionNumber)
                    .filter(Boolean);

                // 2. Filter the new list to exclude discussions that are already mapped.
                const patternOptions = response.nodes.filter(x => !mappedTargetNumbers.includes(x.number));

                // 3. Update the state with the filtered list and pagination info.
                setPatternMappingOptionList(patternOptions);
                setListPageInfo(response.pageInfo);
            }
        } catch (error) {
            // Error handling - silently fail
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextPage = () => {
        const nextCursor = listPageInfo?.endCursor || null;
        if (nextCursor) {
            setListPageHistory(prev => [...prev, nextCursor]);
            setCurrentListPageIndex(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        setCurrentListPageIndex(prev => prev - 1);
    };

    const handleSearchChange = (term: string) => {
        setPatternSearchTerm(term);
        // Reset pagination when search term changes
        setListPageHistory([null]);
        setCurrentListPageIndex(0);
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearchChange(patternSearchInput);
        }
    };

    const removeFromList = (patternNumber: number) => {
        setPatternMappingOptionList(prev => prev.filter(item => item.number !== patternNumber));
    };

    return {
        patternMappingOptionList,
        listPageInfo,
        currentListPageIndex,
        patternSearchInput,
        setPatternSearchInput,
        isSearching,
        isLoading,
        handleNextPage,
        handlePrevPage,
        handleSearchChange,
        handleSearchKeyPress,
        removeFromList
    };
}
