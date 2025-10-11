/**
 * Custom Hook for loading solution implementation data and related mappings
 */

import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import type { SolutionImplementation, Pattern, PatternSolutionMapping } from '../../types/DiscussionData';
import type { BaseDiscussion } from '../../types/GitHub';
import { getDiscussionDetails, parseSolution, parseMapping, parsePattern } from '../../api';

interface PatternDetailsMap {
    [key: number]: {
        details: Pattern;
        isVisible: boolean;
    };
}

export function useSolutionData(solutionImplementationNumber: number) {
    const [solutionImplementationDetails, setSolutionImplementationDetails] = useState<SolutionImplementation | null>(null);
    const [mappingDiscussions, setMappingDiscussions] = useState<(PatternSolutionMapping | undefined)[]>([]);
    const [patternDetails, setPatternDetails] = useState<PatternDetailsMap>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDetails = async () => {
            setIsLoading(true);

            const { repositoryIds: ids } = await browser.storage.local.get('repositoryIds') as {
                repositoryIds: {
                    patternCategoryId: string;
                    solutionImplementationCategoryId: string;
                    repositoryId: string
                } | null
            };

            if (!ids) {
                setIsLoading(false);
                return;
            }

            if (solutionImplementationNumber && ids?.solutionImplementationCategoryId) {
                const solutionDiscussion = await getDiscussionDetails(solutionImplementationNumber) as BaseDiscussion;

                if (!solutionDiscussion) {
                    setIsLoading(false);
                    return;
                }

                const solutionDetails = parseSolution(solutionDiscussion);

                if (!solutionDetails) {
                    setIsLoading(false);
                    return;
                }

                // Check if the solutionDetails are already included in the state
                if (solutionImplementationDetails?.number !== solutionDetails.number) {
                    setSolutionImplementationDetails(solutionDetails);
                }

                const mappingNumbers = solutionDetails.mappings;

                if (mappingNumbers.length === 0) {
                    setIsLoading(false);
                    return;
                }

                // Fetch all mappings in parallel with error handling
                const mappingPromises = mappingNumbers.map(async (mappingNumber) => {
                    try {
                        return await getDiscussionDetails(mappingNumber);
                    } catch (error) {
                        console.error(`Error loading mapping #${mappingNumber}:`, error);
                        return null;
                    }
                });

                const mappingResultsSettled = await Promise.allSettled(mappingPromises);
                const mappingResults = mappingResultsSettled
                    .filter(result => result.status === 'fulfilled' && result.value !== null)
                    .map(result => (result as PromiseFulfilledResult<BaseDiscussion>).value);

                // Fetch all patterns in parallel with error handling
                const patternPromises = mappingResults.map(async (mappingDetails: BaseDiscussion) => {
                    try {
                        const mappingData = parseMapping(mappingDetails);
                        const patternNumber = mappingData?.patternDiscussionNumber;
                        return patternNumber ? await getDiscussionDetails(patternNumber) : null;
                    } catch (error) {
                        console.error(`Error loading pattern for mapping #${mappingDetails.number}:`, error);
                        return null;
                    }
                });

                const patternResultsSettled = await Promise.allSettled(patternPromises);
                const patternResults = patternResultsSettled
                    .filter(result => result.status === 'fulfilled' && result.value !== null)
                    .map(result => (result as PromiseFulfilledResult<BaseDiscussion | null>).value);

                const newMappingDiscussions = mappingResults.map((mappingDetails: BaseDiscussion) => {
                    return parseMapping(mappingDetails);
                });

                setMappingDiscussions(newMappingDiscussions);

                const newPatternDetails: PatternDetailsMap = {};
                patternResults.forEach((patternDetails: BaseDiscussion | null, index) => {
                    const mappingNumber = mappingNumbers[index];
                    if (patternDetails) {
                        const parsedPattern = parsePattern(patternDetails);
                        newPatternDetails[mappingNumber] = {
                            details: parsedPattern,
                            isVisible: false,
                        };
                    } else {
                        // Set undefined to indicate error
                        newPatternDetails[mappingNumber] = {
                            details: undefined as any,
                            isVisible: false,
                        };
                    }
                });
                setPatternDetails(newPatternDetails);
            }

            setIsLoading(false);
        };

        loadDetails();
    }, [solutionImplementationNumber, solutionImplementationDetails?.number]);

    const togglePatternVisibility = (mappingDiscussionNumber: number) => {
        setPatternDetails(prevDetails => ({
            ...prevDetails,
            [mappingDiscussionNumber]: {
                ...prevDetails[mappingDiscussionNumber],
                isVisible: !prevDetails[mappingDiscussionNumber]?.isVisible
            }
        }));
    };

    return {
        solutionImplementationDetails,
        setSolutionImplementationDetails,
        mappingDiscussions,
        setMappingDiscussions,
        patternDetails,
        setPatternDetails,
        isLoading,
        setIsLoading,
        togglePatternVisibility
    };
}
