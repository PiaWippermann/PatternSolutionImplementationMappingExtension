import React, { useEffect, useState } from 'react';
import { useDiscussionData } from '../context/DiscussionDataContext';
import CommentComponent from './Comment';
import type { PatternSolutionMapping, SolutionImplementation, Pattern } from '../types/DiscussionData';
import type { Comment } from '../types/GitHub';
import CommentCreator from './CommentCreator';
import styles from './MappingList.module.scss';
import LoadingSpinner from './LoadingSpinner';
import { fetchDiscussionComments } from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

type MappingListProps = {
    sourceDiscussion: Pattern | SolutionImplementation;
};

const MappingList: React.FC<MappingListProps> = ({ sourceDiscussion }) => {
    const { loading, error, ids, fetchDiscussionDetailsByNumber, fetchMappingDiscussionByNumber, addOrUpdateMappingData } = useDiscussionData();

    // State to hold mapping discussions and their details which is the pattern or solution implementation discussion data
    // mappingDiscussions is always initialized with the mapping discussions given in the source discussion's mapping
    const [mappingDiscussions, setMappingDiscussions] = useState<(PatternSolutionMapping | undefined)[]>([]);
    // mappingTargetDetails holds the details of the target discussions for each mapping and is only populated when the mapping is expanded
    const [mappingTargetDetails, setMappingTargetDetails] = useState<{ [key: number]: { details: SolutionImplementation | Pattern | undefined, isVisible: boolean } }>({});

    // State variables for managing loading states
    const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
    const [isLoadingComments, setIsLoadingComments] = useState<{ [key: string]: boolean }>({});

    // Variable to hold the info if the source discussion is a pattern or solution implementation
    const isSourcePattern = !!(sourceDiscussion as Pattern).patternRef;

    // Initial loading of mapping discussions
    useEffect(() => {
        const loadMappedDiscussions = async () => {
            // Init the mapping discussions given by the source discussion's mapping property
            if (!sourceDiscussion || !sourceDiscussion.mappings || sourceDiscussion.mappings.length === 0) {
                setMappingDiscussions([]);
                return;
            }

            // Use Promise.allSettled instead of Promise.all to handle individual failures
            const fetchPromises = sourceDiscussion.mappings.map(async (discussionNumber) => {
                try {
                    return await fetchMappingDiscussionByNumber(discussionNumber);
                } catch (error) {
                    console.error(`Error loading mapping discussion #${discussionNumber}:`, error);
                    return null;
                }
            });

            try {
                const results = await Promise.allSettled(fetchPromises);
                const validDiscussions = results
                    .filter(result => result.status === 'fulfilled' && result.value !== null)
                    .map(result => (result as PromiseFulfilledResult<any>).value);
                setMappingDiscussions(validDiscussions);
            } catch (error) {
                console.error('Error loading linked discussions:', error);
                // Don't crash, just show empty list
                setMappingDiscussions([]);
            }
        };

        loadMappedDiscussions();
    }, [sourceDiscussion, fetchMappingDiscussionByNumber]);

    /**
     * 
     * @param discussion 
     * @returns 
     */
    const handleMappingClick = async (discussion: PatternSolutionMapping | undefined) => {
        if (!discussion) return;

        // Get a reference to the existing details for this discussion number
        const existingDetails = mappingTargetDetails[discussion.number];

        if (existingDetails) {
            // Create a new object for the updated details, change only visibility
            const updatedDetails = {
                ...existingDetails,
                isVisible: !existingDetails.isVisible,
            };

            // Create a new object for the entire mappingTargetDetails state
            setMappingTargetDetails(prevDetails => ({
                ...prevDetails,
                [discussion.number]: updatedDetails, // Update discussion details
            }));

        } else {
            // No existing details, fetch them
            setIsLoadingDetails(true);

            try {
                // get the number of the target discussion from the mapping discussion
                const targetDiscussionNumber = discussion.patternDiscussionNumber == sourceDiscussion.number ? discussion.solutionImplementationDiscussionNumber : discussion.patternDiscussionNumber;
                // get the category id for the target discussion
                if (!ids) {
                    setIsLoadingDetails(false);
                    return;
                }
                const targetCategoryId = isSourcePattern ? ids.solutionImplementationCategoryId : ids.patternCategoryId;

                const details = await fetchDiscussionDetailsByNumber(targetCategoryId, targetDiscussionNumber);

                // Create a new object to represent the state update
                setMappingTargetDetails(prevDetails => ({
                    ...prevDetails,
                    [discussion.number]: {
                        isVisible: true,
                        details
                    },
                }));
            } catch (error) {
                console.error(`Error loading mapping target details for discussion #${discussion.number}:`, error);
                // Set details as undefined but still mark as visible so user sees it failed
                setMappingTargetDetails(prevDetails => ({
                    ...prevDetails,
                    [discussion.number]: {
                        isVisible: true,
                        details: undefined
                    },
                }));
            } finally {
                setIsLoadingDetails(false);
            }
        }
    };

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

        const updatedMappingData = updatedDiscussions.find(d => d?.id === discussionId);
        if (updatedMappingData) {
            addOrUpdateMappingData(updatedMappingData);
        }
    };

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
            console.error('Failed to load comments:', error);
        } finally {
            // Set the loading state for this discussion to false
            setIsLoadingComments(prev => ({ ...prev, [discussionId]: false }));
        }
    };

    // Check if the current state is "loading"
    if (loading && mappingDiscussions.length === 0) {
        return <LoadingSpinner />;
    }

    // Check if the current state is "error"
    if (error) {
        return <p>Error loading mappings: {error}</p>;
    }

    // Check if there are no existing mapping discussions
    if (mappingDiscussions.length === 0) {
        return (
            <div className={styles.noItemsContainer}>
                <p>No mappings found.</p>
            </div>
        );
    }

    // In this case mappingDiscussions is not empty and we show the list
    // Option to get details for each mapping including comments
    return (
        <div className={styles.mappingListContainer}>
            <ul className={styles.list}>
                {mappingDiscussions.map((discussion) => (
                    (discussion && (
                        <li key={discussion?.id} className={styles.mappingItem}>
                            <div
                                className={styles.mappingHeader}
                                onClick={() => handleMappingClick(discussion)}
                            >
                                <span className={styles.mappingTitle}>{discussion?.title}</span>
                                <span className={`${styles.toggleIcon} ${mappingTargetDetails[discussion?.number]?.isVisible ? styles.toggled : ''}`}>
                                    <FontAwesomeIcon icon={mappingTargetDetails[discussion?.number]?.isVisible ? faChevronUp : faChevronDown} />
                                </span>
                            </div>

                            {mappingTargetDetails[discussion?.number] && mappingTargetDetails[discussion?.number].isVisible && (
                                <div className={styles.linkedDetailsContainer}>
                                    {isLoadingDetails ? (
                                        <LoadingSpinner />
                                    ) : mappingTargetDetails[discussion?.number]?.details ? (
                                        <>
                                            <div className={styles.linkedTitle}>
                                                <h3>{mappingTargetDetails[discussion?.number].details?.title}</h3>
                                                {isSourcePattern && mappingTargetDetails[discussion?.number].details && (
                                                    <a href={(mappingTargetDetails[discussion?.number].details as SolutionImplementation).solutionRefUrl} target="_blank" rel="noopener noreferrer">
                                                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                                                    </a>
                                                )}
                                            </div>
                                            <p>
                                                {mappingTargetDetails[discussion?.number].details?.description}
                                            </p>

                                            <div className={styles.separator}></div>
                                            <h4>Comments</h4>
                                            {/* Show the create comment section always */}
                                            <ul>
                                                <li>
                                                    <CommentCreator
                                                        discussionId={discussion?.id}
                                                        onCommentSubmit={(comment) => {
                                                            if (discussion?.id) {
                                                                onAddedComment(discussion.id, comment);
                                                            }
                                                        }}
                                                    />
                                                </li>
                                            </ul>

                                            {/* Load comments */}
                                            {/* Show 'Load More Comments' button if there are more comments to load */}
                                            {discussion?.comments?.pageInfo?.hasNextPage && (
                                                <button
                                                    onClick={() => onLoadDiscussionComments(discussion?.id)}
                                                    className={styles.loadCommentButton}
                                                    disabled={isLoadingComments[discussion?.id || '']}
                                                >
                                                    {isLoadingComments[discussion?.id || ''] ? 'Loading...' : 'Load More Comments'}
                                                </button>
                                            )}

                                            {/* Show 'Load Comments' button if no comments are loaded yet */}
                                            {!discussion?.comments?.nodes?.length && !isLoadingComments[discussion?.id || ''] && (
                                                <button
                                                    onClick={() => onLoadDiscussionComments(discussion?.id)}
                                                    className={styles.loadCommentButton}
                                                >
                                                    Load Comments
                                                </button>
                                            )}

                                            {/* Show comments */}
                                            <ul className={styles.commentList}>
                                                {discussion?.comments?.nodes?.map((comment) => (
                                                    <li key={comment.id}>
                                                        <CommentComponent commentData={comment} />
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        <div className={styles.errorNote}>
                                            <p>Failed to load details for this mapping. The linked discussion may have been deleted.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    ))))}
            </ul>
        </div>
    );
};

export default MappingList;