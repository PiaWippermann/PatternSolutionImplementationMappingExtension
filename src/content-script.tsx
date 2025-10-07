import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import type { SolutionImplementation, PatternSolutionMapping, Pattern } from './types/DiscussionData';
import type { BrowserMessage } from './types/Messages';
import LoadingSpinner from './components/LoadingSpinner';
import Pagination from './components/Pagination';
import browser from 'webextension-polyfill';
import {
    getDiscussionDetails,
    fetchDiscussionComments,
    getDiscussionsListData,
    searchDiscussions,
    parseSolution,
    parseMapping,
    createMapping,
    parsePattern
} from "./api";
import type { BaseDiscussion, Comment, SimpleDiscussion, PageInfo } from './types/GitHub';
import CommentComponent from './components/Comment';
import CommentCreator from './components/CommentCreator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faChevronLeft, faChevronRight, faAnglesLeft, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import styles from './components/MappingList.module.scss';
import sidebarStyles from './components/Sidebar.module.scss';
import './styles/pages/Search.scss';
/**
 * Checks if the user is authenticated by verifying if a token exists in storage.
 * @returns True if authenticated, false otherwise.
 */
async function checkAuth(): Promise<boolean> {
    const { githubToken } = await browser.storage.local.get('githubToken') as { githubToken?: string };
    return !!githubToken;
}
// ExtensionIntegration is a functional component that handles fetching and rendering
const ExtensionIntegration = ({ solutionImplementationNumber }: { solutionImplementationNumber: number }) => {
    const [solutionImplementationDetails, setSolutionImplementationDetails] = useState<SolutionImplementation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [patternDetails, setPatternDetails] = useState<{ [key: number]: { details: Pattern | undefined, isVisible: boolean } }>({});
    const [mappingDiscussions, setMappingDiscussions] = useState<(PatternSolutionMapping | undefined)[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState<{ [key: string]: boolean }>({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    // State for adding new mapping
    const [isInAddMappingMode, setIsInAddMappingMode] = useState<boolean>(false);
    const [patternMappingOptionList, setPatternMappingOptionList] = useState<SimpleDiscussion[]>([]);
    const [listPageInfo, setListPageInfo] = useState<PageInfo | null>(null);
    const [listPageHistory, setListPageHistory] = useState<Array<string | null>>([null]);
    const [currentListPageIndex, setCurrentListPageIndex] = useState<number>(0);
    const [selectedPatternOptionDetails, setSelectedPatternOptionDetails] = useState<Pattern | undefined>(undefined);
    // State for pattern search
    const [patternSearchTerm, setPatternSearchTerm] = useState<string>('');
    const [patternSearchInput, setPatternSearchInput] = useState<string>(''); // Input field value
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    useEffect(() => {
        const loadDetails = async () => {
            setIsLoading(true);
            const { repositoryIds: ids } = await browser.storage.local.get('repositoryIds') as { repositoryIds: { patternCategoryId: string; solutionImplementationCategoryId: string; repositoryId: string } | null };
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
                interface PatternDetailsMap {
                    [key: number]: {
                        details: Pattern;
                        isVisible: boolean;
                    };
                }
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
    // Use effect that is triggered when entering or exiting the "add mapping" mode
    useEffect(() => {
        if (isInAddMappingMode) {
            onLoadPatternOptions();
        }
    }, [isInAddMappingMode, currentListPageIndex, patternSearchTerm]);
    /**
     * Handles the click event on a pattern mapping.
     * Toggles the visibility of the pattern details.
     * @param patternDetail The details of the pattern mapping.
     */
    const handleMappingClick = (mappingDiscussionNumber: number) => {
        setPatternDetails(prevDetails => ({
            ...prevDetails,
            [mappingDiscussionNumber]: {
                ...prevDetails[mappingDiscussionNumber],
                isVisible: !prevDetails[mappingDiscussionNumber]?.isVisible
            }
        }));
    }
    /**
     * Handles the addition of a comment to a mapping discussion.
     * @param discussionId The ID of the discussion to add the comment to.
     * @param comment The comment to add.
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
     * Loads pattern options for mapping.
     * This function is called when entering the "add mapping" mode or when navigating through pages.
     * Supports both listing all patterns (when no search term) and searching patterns (when search term provided).
     * @returns 
     */
    const onLoadPatternOptions = async () => {
        setIsLoading(true);
        const { repositoryIds: ids } = await browser.storage.local.get('repositoryIds') as { repositoryIds: { patternCategoryId: string; solutionImplementationCategoryId: string; repositoryId: string, patternSolutionMappingCategoryId: string } | null };
        if (!ids || !ids.patternCategoryId) {
            setIsLoading(false);
            return;
        }
        try {
            const currentCursor = listPageHistory[currentListPageIndex];
            const PAGE_SIZE = 10;
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
                // The target discussion is either the pattern or the solution implementation from the mapping.
                const mappedTargetNumbers = mappingDiscussions.map(mapping => {
                    return mapping?.patternDiscussionNumber;
                }).filter(Boolean);
                // 2. Filter the new list to exclude discussions that are already mapped.
                const patternOptions = response.nodes.filter(x => !mappedTargetNumbers.includes(x.number));
                // 3. Update the state with the filtered list and pagination info.
                setPatternMappingOptionList(patternOptions);
                setListPageInfo(response.pageInfo);
            }
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };
    /**
     * Handles pagination to the next page of pattern options.
     * Updates the cursor history and current index.
     */
    const handleCreationNextPage = () => {
        const nextCursor = listPageInfo?.endCursor || null;
        if (nextCursor) {
            setListPageHistory(prev => [...prev, nextCursor]);
            setCurrentListPageIndex(prev => prev + 1);
        }
    };
    /**
     * Handles pagination to the previous page of pattern options.
     * Updates the current index to go back in history.
     */
    const handleCreationPrevPage = () => {
        setCurrentListPageIndex(prev => prev - 1);
    };
    /**
     * Handles search term change for pattern search.
     * Resets pagination when search term changes.
     */
    const handlePatternSearchChange = (term: string) => {
        setPatternSearchTerm(term);
        // Reset pagination when search term changes
        setListPageHistory([null]);
        setCurrentListPageIndex(0);
    };
    /**
     * Handles Enter key press in search input.
     * Triggers search when Enter is pressed.
     */
    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handlePatternSearchChange(patternSearchInput);
        }
    };
    /**
     * Shows the details of a specific pattern discussion when selected from the pattern options list.
     * @param patternDiscussionNumber The number of the pattern discussion to show details for.
     * @returns 
     */
    const showPatternDetails = async (patternDiscussionNumber: number) => {
        setIsLoading(true);
        const patternDiscussion = await getDiscussionDetails(patternDiscussionNumber) as BaseDiscussion;
        if (!patternDiscussion) {
            setIsLoading(false);
            return;
        }
        const patternDetails = parsePattern(patternDiscussion);
        if (!patternDetails) {
            setIsLoading(false);
            return;
        }
        setSelectedPatternOptionDetails(patternDetails);
        setIsLoading(false);
    }
    /**
     * Creates a mapping between a pattern discussion and a solution implementation discussion.
     * @param targetDiscussion The target discussion to create a mapping with.
     * @returns 
     */
    const onCreateMapping = async () => {
        if (!selectedPatternOptionDetails || !solutionImplementationDetails) return;
        try {
            setIsLoading(true);
            const { repositoryIds: ids } = await browser.storage.local.get('repositoryIds') as { repositoryIds: { patternCategoryId: string; solutionImplementationCategoryId: string; repositoryId: string, patternSolutionMappingCategoryId: string } | null };
            if (!ids || !ids.patternCategoryId || !ids.repositoryId) {
                return;
            }
            const title = `${selectedPatternOptionDetails.title} - ${solutionImplementationDetails.title}`;
            // Function that handles the mapping creation
            // Including updating the pattern and the solution implementation discussions
            const response = await createMapping({ repositoryId: ids.repositoryId, categoryId: ids.patternSolutionMappingCategoryId, title, patternDiscussion: selectedPatternOptionDetails, solutionImplementationDiscussion: solutionImplementationDetails });
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
            setPatternMappingOptionList(prev => prev.filter(item => item.number !== selectedPatternOptionDetails.number));
            // Reset the creation state
            setIsInAddMappingMode(false);
            setSelectedPatternOptionDetails(undefined);
        } catch (error) {
        }
        setIsLoading(false);
    };
    /**
     * Loads comments for a specific discussion.
     * @param discussionId The ID of the discussion to load comments for.
     * @returns 
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
        } finally {
            // Set the loading state for this discussion to false
            setIsLoadingComments(prev => ({ ...prev, [discussionId]: false }));
        }
    };
    // Render the entire sidebar and the toggle button as top-level elements.
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
                        <>
                            {/* Show selected pattern details */}
                            <div className={styles.mappingListContainer}>
                                <button onClick={() => setSelectedPatternOptionDetails(undefined)} className="back-button">
                                    <FontAwesomeIcon icon={faAnglesLeft} />
                                    <span className="back-button-text">Back</span>
                                </button>
                                <h3>Pattern Details</h3>
                                <div className={styles.selectedPatternDetails}>
                                    <img src={selectedPatternOptionDetails.icon} alt={`${selectedPatternOptionDetails.title} Icon`} className={sidebarStyles.icon} />
                                    <h3>{selectedPatternOptionDetails.title}</h3>
                                    <button className={styles.createButton} onClick={() => onCreateMapping()}>Create Mapping</button>
                                </div>
                                <div className={styles.linkedDetailsContainer}>
                                    <p>{selectedPatternOptionDetails.description}</p>
                                </div>
                            </div>
                        </>
                    ) : isInAddMappingMode ? (
                        <>
                            {/* Add pattern mapping */}
                            <div className={styles.mappingListContainer}>
                                <button onClick={() => setIsInAddMappingMode(false)} className="back-button">
                                    <FontAwesomeIcon icon={faAnglesLeft} />
                                    <span className="back-button-text">Back</span>
                                </button>
                                <h3>Create a new mapping</h3>
                                {/* Search Input */}
                                <div className="search-input-container" style={{ margin: '16px 0' }}>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search patterns..."
                                        value={patternSearchInput}
                                        onChange={(e) => setPatternSearchInput(e.target.value)}
                                        onKeyPress={handleSearchKeyPress}
                                    />
                                    <button
                                        type="button"
                                        className="search-button"
                                        onClick={() => handlePatternSearchChange(patternSearchInput)}
                                    >
                                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                                    </button>
                                </div>                                {isLoading && <LoadingSpinner />}
                                {!isLoading && patternMappingOptionList.length === 0 && (
                                    <p>{isSearching ? 'No patterns found matching your search.' : 'No items found.'}</p>
                                )}
                                {!isLoading && patternMappingOptionList.length > 0 && (
                                    <ul className={styles.creationList}>
                                        {patternMappingOptionList.map(item => (
                                            <li key={item.number} onClick={() => showPatternDetails(item.number)}>
                                                {item.title}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <Pagination
                                    onPrevPage={handleCreationPrevPage}
                                    onNextPage={handleCreationNextPage}
                                    hasNextPage={listPageInfo?.hasNextPage || false}
                                    isBackDisabled={currentListPageIndex === 0}
                                    loading={isLoading}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Existing pattern mappings */}
                            <h3>Mapped Patterns</h3>
                            <ul className={styles.list}>
                                <button className={sidebarStyles.addMappingButton} onClick={() => setIsInAddMappingMode(true)}>
                                    Add Mapping
                                </button>
                                {mappingDiscussions.map((discussion) => (
                                    discussion && (
                                        <li key={discussion.id} className={styles.mappingItem}>
                                            <div
                                                className={styles.mappingHeader}
                                                onClick={() => handleMappingClick(discussion.number)}
                                            >
                                                <img src={patternDetails[discussion.number]?.details?.icon} alt={`${patternDetails[discussion.number]?.details?.title} Icon`} className={sidebarStyles.icon} />
                                                <span className={sidebarStyles.mappingTitle}>{patternDetails[discussion.number]?.details?.title}</span>
                                                <span className={`${styles.toggleIcon} ${patternDetails[discussion.number]?.isVisible ? styles.toggled : ''}`}>
                                                    <FontAwesomeIcon icon={patternDetails[discussion.number]?.isVisible ? faChevronUp : faChevronDown} />
                                                </span>
                                            </div>
                                            {patternDetails[discussion.number]?.isVisible && (
                                                <div className={styles.linkedDetailsContainer}>
                                                    <p>{patternDetails[discussion.number]?.details?.description}</p>
                                                    <div className={styles.separator}></div>
                                                    <h4>Comments</h4>
                                                    <ul>
                                                        <li>
                                                            <CommentCreator
                                                                discussionId={discussion.id}
                                                                onCommentSubmit={(comment) => onAddedComment(discussion.id, comment)}
                                                            />
                                                        </li>
                                                    </ul>
                                                    {discussion.comments?.pageInfo?.hasNextPage && (
                                                        <button
                                                            onClick={() => onLoadDiscussionComments(discussion.id)}
                                                            className={styles.loadCommentButton}
                                                            disabled={isLoadingComments[discussion.id]}
                                                        >
                                                            {isLoadingComments[discussion.id] ? 'Loading...' : 'Load More Comments'}
                                                        </button>
                                                    )}
                                                    {!discussion.comments?.nodes?.length && !isLoadingComments[discussion.id] && (
                                                        <button
                                                            onClick={() => onLoadDiscussionComments(discussion.id)}
                                                            className={styles.loadCommentButton}
                                                        >
                                                            Load Comments
                                                        </button>
                                                    )}
                                                    <ul className={styles.commentList}>
                                                        {discussion.comments?.nodes?.map((comment) => (
                                                            <li key={comment.id}>
                                                                <CommentComponent commentData={comment} />
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </li>
                                    )
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div >
            <div className={`${sidebarStyles.sidebarToggle} ${isSidebarOpen ? sidebarStyles.openToggle : ''}`} onClick={toggleSidebar}>
                <FontAwesomeIcon icon={isSidebarOpen ? faChevronLeft : faChevronRight} />
            </div>
        </>
    );
};
// The main function is the entry point and is called by the background script
export const main = async (solutionImplementationNumber: number) => {
    // Check if user is authenticated
    const isAuth = await checkAuth();
    if (!isAuth) {
        return;
    }
    // Check if the container already exists to prevent duplicate execution.
    const existingContainer = document.getElementById('extension-react-root');
    if (existingContainer) {
        return;
    }
    const targetElement = document.body;
    if (targetElement) {
        const container = document.createElement('div');
        container.id = 'extension-react-root';
        targetElement.appendChild(container);
        const root = createRoot(container);
        root.render(<ExtensionIntegration solutionImplementationNumber={solutionImplementationNumber} />);
    } else {
    }
};
// Send a "ready" message as soon as the listener is set up
browser.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' });
// Listen for messages from the background script
browser.runtime.onMessage.addListener(async (message: unknown) => {
    const msg = message as BrowserMessage;
    if (msg.type === 'DISCUSSION_NUMBER_MESSAGE' && msg.discussionNumber) {
        await main(msg.discussionNumber);
    }
});