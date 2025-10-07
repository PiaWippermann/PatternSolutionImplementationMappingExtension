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

                // Fetch all mappings in parallel
                const mappingPromises = mappingNumbers.map(mappingNumber => getDiscussionDetails(mappingNumber));
                const mappingResults = await Promise.all(mappingPromises);

                // Fetch all patterns in parallel
                const patternPromises = mappingResults.map(mappingDetails => {
                    const mappingData = mappingDetails ? parseMapping(mappingDetails) : null;
                    const patternNumber = mappingData?.patternDiscussionNumber;
                    return patternNumber ? getDiscussionDetails(patternNumber) : Promise.resolve(null);
                });
                const patternResults = await Promise.all(patternPromises);

                const newMappingDiscussions = mappingResults.filter(Boolean).map((mappingDetails: BaseDiscussion) => {
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
                    }
                });
                setPatternDetails(newPatternDetails);
            }

            setIsLoading(false);
        };

        loadDetails();
    }, [solutionImplementationNumber]);

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
