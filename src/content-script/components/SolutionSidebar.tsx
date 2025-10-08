/**
 * SolutionSidebar Component
 * Main sidebar component for Solution Implementation pages
 * Displays pattern mappings and allows creating new mappings
 */

import { useState } from 'react';
import browser from 'webextension-polyfill';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import type { Pattern } from '../../types/DiscussionData';
import type { BaseDiscussion, Comment } from '../../types/GitHub';
import { getDiscussionDetails, parsePattern, createMapping, fetchDiscussionComments } from '../../api';
import { useSolutionData } from '../hooks/useSolutionData';
import { usePatternSearch } from '../hooks/usePatternSearch';
import { PatternSelector } from './PatternSelector';
import { PatternDetailView } from './PatternDetailView';
import { MappingListView } from './MappingListView';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from '../../components/MappingList.module.scss';
import sidebarStyles from '../../components/Sidebar.module.scss';

interface SolutionSidebarProps {
    solutionImplementationNumber: number;
}

export function SolutionSidebar({ solutionImplementationNumber }: SolutionSidebarProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isInAddMappingMode, setIsInAddMappingMode] = useState(false);
    const [selectedPatternOptionDetails, setSelectedPatternOptionDetails] = useState<Pattern | undefined>(undefined);
    const [isLoadingComments, setIsLoadingComments] = useState<{ [key: string]: boolean }>({});

    // Use custom hooks
    const {
        solutionImplementationDetails,
        setSolutionImplementationDetails,
        mappingDiscussions,
        setMappingDiscussions,
        patternDetails,
        setPatternDetails,
        isLoading: isLoadingSolution,
        setIsLoading: setIsLoadingSolution,
        togglePatternVisibility
    } = useSolutionData(solutionImplementationNumber);

    const {
        patternMappingOptionList,
        listPageInfo,
        currentListPageIndex,
        patternSearchInput,
        setPatternSearchInput,
        isSearching,
        isLoading: isLoadingSearch,
        handleNextPage,
        handlePrevPage,
        handleSearchChange,
        handleSearchKeyPress,
        removeFromList
    } = usePatternSearch(isInAddMappingMode, mappingDiscussions);

    const isLoading = isLoadingSolution || isLoadingSearch;

    /**
     * Handles adding a comment to a mapping discussion.
     */
    const onAddedComment = (discussionId: string, comment: Comment) => {
        const updatedDiscussions = mappingDiscussions.map(discussion => {
            if (discussion && discussion.id === discussionId) {
                return {
                    ...discussion,
                    comments: {
                        ...discussion.comments,
                        nodes: [...(discussion.comments?.nodes || []), comment]
                    }
                };
            }
            return discussion;
        });
        setMappingDiscussions(updatedDiscussions);
    };

    /**
     * Shows the details of a specific pattern discussion when selected from the pattern options list.
     */
    const showPatternDetails = async (patternDiscussionNumber: number) => {
        setIsLoadingSolution(true);
        const patternDiscussion = await getDiscussionDetails(patternDiscussionNumber) as BaseDiscussion;

        if (!patternDiscussion) {
            setIsLoadingSolution(false);
            return;
        }

        const patternDetails = parsePattern(patternDiscussion);

        if (!patternDetails) {
            setIsLoadingSolution(false);
            return;
        }

        setSelectedPatternOptionDetails(patternDetails);
        setIsLoadingSolution(false);
    };

    /**
     * Creates a mapping between a pattern discussion and a solution implementation discussion.
     */
    const onCreateMapping = async () => {
        if (!selectedPatternOptionDetails || !solutionImplementationDetails) return;

        try {
            setIsLoadingSolution(true);

            const { repositoryIds: ids } = await browser.storage.local.get('repositoryIds') as {
                repositoryIds: {
                    patternCategoryId: string;
                    solutionImplementationCategoryId: string;
                    repositoryId: string;
                    patternSolutionMappingCategoryId: string;
                } | null;
            };

            if (!ids || !ids.patternCategoryId || !ids.repositoryId) {
                return;
            }

            const title = `${selectedPatternOptionDetails.title} - ${solutionImplementationDetails.title}`;

            // Create the mapping
            const response = await createMapping({
                repositoryId: ids.repositoryId,
                categoryId: ids.patternSolutionMappingCategoryId,
                title,
                patternDiscussion: selectedPatternOptionDetails,
                solutionImplementationDiscussion: solutionImplementationDetails
            });

            setMappingDiscussions(prev => [response.mapping, ...prev]);

            // Update the pattern details state to include the new mapping
            setPatternDetails(prevDetails => ({
                ...prevDetails,
                [response.mapping.number]: {
                    details: {
                        ...selectedPatternOptionDetails,
                        mappings: [...selectedPatternOptionDetails.mappings, response.mapping.number]
                    },
                    isVisible: true
                }
            }));

            // Update the solution implementation details state to include the new mapping
            setSolutionImplementationDetails(prev => prev ? {
                ...prev,
                mappings: [...prev.mappings, response.mapping.number]
            } : prev);

            // Refresh the pattern options list to exclude the newly mapped pattern
            removeFromList(selectedPatternOptionDetails.number);

            // Reset the creation state
            setIsInAddMappingMode(false);
            setSelectedPatternOptionDetails(undefined);
        } catch (error) {
            console.error('Failed to create mapping:', error);
        }
        setIsLoadingSolution(false);
    };

    /**
     * Loads comments for a specific discussion.
     */
    const onLoadDiscussionComments = async (discussionId: string | undefined) => {
        if (!discussionId) return;

        // Set isLoadingComments for the current discussion
        setIsLoadingComments(prev => ({ ...prev, [discussionId]: true }));

        try {
            // Filter discussions to find the one to load comments for
            const discussionToUpdate = mappingDiscussions.find(d => d?.id === discussionId);
            const currentCursor = discussionToUpdate?.comments?.pageInfo?.endCursor || undefined;
            const comments = await fetchDiscussionComments(discussionId, 5, currentCursor);

            // Find the affected discussion and add the comments
            setMappingDiscussions(prevDiscussions => {
                return prevDiscussions.map(discussion => {
                    if (discussion && discussion.id === discussionId) {
                        // Merge the new comment nodes with the existing ones
                        const newNodes = [...(discussion.comments?.nodes || []), ...comments.nodes];
                        return {
                            ...discussion,
                            comments: {
                                nodes: newNodes,
                                pageInfo: comments.pageInfo // Update the pageInfo with the new one
                            }
                        };
                    }
                    return discussion;
                });
            });
        } catch (error) {
            console.error('Failed to load discussion comments:', error);
        } finally {
            // Set the loading state for this discussion to false
            setIsLoadingComments(prev => ({ ...prev, [discussionId]: false }));
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Render the sidebar
    return (
        <>
            <div className={`${sidebarStyles.sidebar} ${isSidebarOpen ? sidebarStyles.openSidebar : ''}`}>
                <div className={sidebarStyles.sidebarContent}>
                    {/* Loading state */}
                    {isLoading || !solutionImplementationDetails ? (
                        <LoadingSpinner />
                    ) : mappingDiscussions.length === 0 ? (
                        <>
                            {/* No existing pattern mappings */}
                            <h3>Mapped Patterns</h3>
                            <button className={sidebarStyles.addMappingButton} onClick={() => setIsInAddMappingMode(true)}>
                                Add Mapping
                            </button>
                            <div className={styles.noItemsContainer}>
                                <p>No mappings found.</p>
                            </div>
                        </>
                    ) : isInAddMappingMode && selectedPatternOptionDetails ? (
                        <PatternDetailView
                            selectedPattern={selectedPatternOptionDetails}
                            onBack={() => setSelectedPatternOptionDetails(undefined)}
                            onCreateMapping={onCreateMapping}
                        />
                    ) : isInAddMappingMode ? (
                        <PatternSelector
                            patternMappingOptionList={patternMappingOptionList}
                            listPageInfo={listPageInfo}
                            currentListPageIndex={currentListPageIndex}
                            patternSearchInput={patternSearchInput}
                            isSearching={isSearching}
                            isLoading={isLoading}
                            onBack={() => setIsInAddMappingMode(false)}
                            onPatternSelect={showPatternDetails}
                            onSearchInputChange={setPatternSearchInput}
                            onSearchKeyPress={handleSearchKeyPress}
                            onSearchSubmit={handleSearchChange}
                            onNextPage={handleNextPage}
                            onPrevPage={handlePrevPage}
                        />
                    ) : (
                        <MappingListView
                            mappingDiscussions={mappingDiscussions}
                            patternDetails={patternDetails}
                            isLoadingComments={isLoadingComments}
                            onMappingClick={togglePatternVisibility}
                            onAddMapping={() => setIsInAddMappingMode(true)}
                            onAddComment={onAddedComment}
                            onLoadComments={onLoadDiscussionComments}
                        />
                    )}
                </div>
            </div>
            <div className={`${sidebarStyles.sidebarToggle} ${isSidebarOpen ? sidebarStyles.openToggle : ''}`} onClick={toggleSidebar}>
                <FontAwesomeIcon icon={isSidebarOpen ? faChevronLeft : faChevronRight} />
            </div>
        </>
    );
}
