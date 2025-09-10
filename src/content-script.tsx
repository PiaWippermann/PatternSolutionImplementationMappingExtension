import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import type { SolutionImplementation, PatternSolutionMapping, Pattern } from './types/DiscussionData';
import LoadingSpinner from './components/LoadingSpinner';
import browser from 'webextension-polyfill';
import { getDiscussionDetails, fetchDiscussionComments } from "./api/githubQueries";
import { parseSolutionBody } from './api/githubSolutions';
import { parseMappingBody } from './api/githubMappings';
import { parsePatternBody } from './api/githubPatterns';
import type { BaseDiscussion, Comment } from './types/GitHub';
import CommentComponent from './components/Comment';
import CommentCreator from './components/CommentCreator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import styles from './components/MappingList.module.scss';
import sidebarStyles from './components/Sidebar.module.scss';

// ExtensionIntegration is a functional component that handles fetching and rendering
const ExtensionIntegration = ({ solutionImplementationNumber }: { solutionImplementationNumber: number }) => {
    const [solutionImplementationDetails, setSolutionImplementationDetails] = useState<SolutionImplementation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [patternDetails, setPatternDetails] = useState<{ [key: number]: { details: Pattern | undefined, isVisible: boolean } }>({});
    const [mappingDiscussions, setMappingDiscussions] = useState<(PatternSolutionMapping | undefined)[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState<{ [key: string]: boolean }>({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        const loadDetails = async () => {
            setIsLoading(true);

            const { repositoryIds: ids } = await browser.storage.local.get('repositoryIds') as { repositoryIds: { patternCategoryId: string; solutionImplementationCategoryId: string; repositoryId: string } | null };
            if (!ids) {
                console.error("Failed to retrieve repository IDs.");
                setIsLoading(false);
                return;
            }

            if (solutionImplementationNumber && ids?.solutionImplementationCategoryId) {
                const solutionDiscussion = await getDiscussionDetails(solutionImplementationNumber) as BaseDiscussion;
                if (!solutionDiscussion) {
                    console.error("Failed to fetch solution discussion details.");
                    setIsLoading(false);
                    return;
                }

                const parsedSolutionBody = parseSolutionBody(solutionDiscussion.body);
                if (!parsedSolutionBody) {
                    console.error("Failed to parse solution body.");
                    setIsLoading(false);
                    return;
                }

                const solutionDetails: SolutionImplementation = {
                    ...solutionDiscussion,
                    solutionRefUrl: parsedSolutionBody.solutionRefUrl || "",
                    description: parsedSolutionBody.description || "",
                    mappings: parsedSolutionBody.mappings || [],
                };

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

                console.log("Fetched mapping discussions:", mappingResults);

                // Fetch all patterns in parallel
                const patternPromises = mappingResults.map(mappingDetails => {
                    const mappingBody = mappingDetails ? parseMappingBody(mappingDetails.body) : null;
                    const patternNumber = mappingBody?.patternDiscussionNumber ? parseInt(mappingBody.patternDiscussionNumber) : null;
                    return patternNumber ? getDiscussionDetails(patternNumber) : Promise.resolve(null);
                });
                const patternResults = await Promise.all(patternPromises);

                const newMappingDiscussions = mappingResults.filter(Boolean).map((mappingDetails: any) => {
                    const parsedBody = parseMappingBody(mappingDetails.body);
                    return {
                        ...mappingDetails,
                        patternDiscussionNumber: parseInt(parsedBody.patternDiscussionNumber),
                        solutionImplementationDiscussionNumber: parseInt(parsedBody.solutionImplementationDiscussionNumber),
                    };
                });

                console.log("Parsed mapping discussions:", newMappingDiscussions);
                setMappingDiscussions(newMappingDiscussions);

                const newPatternDetails: any = {};
                patternResults.forEach((patternDetails: any, index) => {
                    const mappingNumber = mappingNumbers[index];
                    if (patternDetails) {
                        const parsedBody = parsePatternBody(patternDetails.body);
                        newPatternDetails[mappingNumber] = {
                            details: {
                                ...patternDetails,
                                icon: parsedBody.icon || "",
                                description: parsedBody.description || "",
                                patternRef: parsedBody.patternRef || "",
                                mappings: parsedBody.mappings || [],
                            },
                            isVisible: false,
                        };
                    }
                });
                setPatternDetails(newPatternDetails);
                console.log("Parsed pattern details:", newPatternDetails);
            }

            setIsLoading(false);
        };

        loadDetails();
    }, [solutionImplementationNumber]);

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
            console.error("Failed to load comments:", error);
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
                    {isLoading || !solutionImplementationDetails ? (
                        <LoadingSpinner />
                    ) : mappingDiscussions.length === 0 ? (
                        <div className={styles.noItemsContainer}>
                            <p>No mappings found.</p>
                        </div>
                    ) : (
                        <ul className={styles.list}>
                            {mappingDiscussions.map((discussion) => (
                                discussion && (
                                    <li key={discussion.id} className={styles.mappingItem}>
                                        <div
                                            className={styles.mappingHeader}
                                            onClick={() => handleMappingClick(discussion.number)}
                                        >
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
                    )}
                </div>
            </div>
            <div className={`${sidebarStyles.sidebarToggle} ${isSidebarOpen ? sidebarStyles.openToggle : ''}`} onClick={toggleSidebar}>
                <FontAwesomeIcon icon={isSidebarOpen ? faChevronLeft : faChevronRight} />
            </div>
        </>
    );
};

// The main function is the entry point and is called by the background script
export const main = (solutionImplementationNumber: number) => {
    console.log("Content script main function called with solution implementation number:", solutionImplementationNumber);

    // Check if the container already exists to prevent duplicate execution.
    const existingContainer = document.getElementById('extension-react-root');
    if (existingContainer) {
        console.log("React component already exists, not injecting again.");
        return;
    }

    const targetElement = document.body;
    if (targetElement) {
        const container = document.createElement('div');
        container.id = 'extension-react-root';
        targetElement.appendChild(container);

        const root = createRoot(container);
        root.render(<ExtensionIntegration solutionImplementationNumber={solutionImplementationNumber} />);

        console.log("React component has been injected into the page.");
    } else {
        console.log("Could not find a suitable element to inject the component.");
    }
};

// Send a "ready" message as soon as the listener is set up
browser.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' });

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message: any) => {
    if (message.type === 'DISCUSSION_NUMBER_MESSAGE' && message.discussionNumber) {
        console.log("Received discussion number from background script:", message.discussionNumber);
        main(message.discussionNumber);
    }
});