/**
 * MappingListView Component
 * Displays the list of existing pattern mappings with comments
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import type { PatternSolutionMapping, Pattern } from '../../types/DiscussionData';
import type { Comment } from '../../types/GitHub';
import CommentComponent from '../../components/Comment';
import CommentCreator from '../../components/CommentCreator';
import styles from '../../components/MappingList.module.scss';
import sidebarStyles from '../../components/Sidebar.module.scss';

interface PatternDetailsMap {
    [key: number]: {
        details: Pattern;
        isVisible: boolean;
    };
}

interface MappingListViewProps {
    mappingDiscussions: (PatternSolutionMapping | undefined)[];
    patternDetails: PatternDetailsMap;
    isLoadingComments: { [key: string]: boolean };
    onMappingClick: (mappingNumber: number) => void;
    onAddMapping: () => void;
    onAddComment: (discussionId: string, comment: Comment) => void;
    onLoadComments: (discussionId: string | undefined) => void;
}

export function MappingListView({
    mappingDiscussions,
    patternDetails,
    isLoadingComments,
    onMappingClick,
    onAddMapping,
    onAddComment,
    onLoadComments
}: MappingListViewProps) {
    return (
        <>
            <h3 className={styles.mappingListTitle}>Mapped Patterns</h3>
            <ul className={styles.list}>
                <button className={sidebarStyles.addMappingButton} onClick={onAddMapping}>
                    Add Mapping
                </button>
                {mappingDiscussions.map((discussion) => (
                    discussion && (
                        <li key={discussion.id} className={styles.mappingItem}>
                            <div
                                className={styles.mappingHeader}
                                onClick={() => onMappingClick(discussion.number)}
                            >
                                <img 
                                    src={patternDetails[discussion.number]?.details?.icon} 
                                    alt={`${patternDetails[discussion.number]?.details?.title} Icon`} 
                                    className={sidebarStyles.icon} 
                                />
                                <span className={sidebarStyles.mappingTitle}>
                                    {patternDetails[discussion.number]?.details?.title}
                                </span>
                                <span className={`${styles.toggleIcon} ${patternDetails[discussion.number]?.isVisible ? styles.toggled : ''}`}>
                                    <FontAwesomeIcon icon={patternDetails[discussion.number]?.isVisible ? faChevronUp : faChevronDown} />
                                </span>
                            </div>
                            {patternDetails[discussion.number]?.isVisible && (
                                <div className={styles.linkedDetailsContainer}>
                                    <p>{patternDetails[discussion.number]?.details?.description}</p>
                                    <div className={styles.separator}></div>
                                    <h4 className={styles.commentsTitle}>Comments</h4>
                                    <ul>
                                        <li>
                                            <CommentCreator
                                                discussionId={discussion.id}
                                                onCommentSubmit={(comment) => onAddComment(discussion.id, comment)}
                                            />
                                        </li>
                                    </ul>
                                    {discussion.comments?.pageInfo?.hasNextPage && (
                                        <button
                                            onClick={() => onLoadComments(discussion.id)}
                                            className={styles.loadCommentButton}
                                            disabled={isLoadingComments[discussion.id]}
                                        >
                                            {isLoadingComments[discussion.id] ? 'Loading...' : 'Load More Comments'}
                                        </button>
                                    )}
                                    {!discussion.comments?.nodes?.length && !isLoadingComments[discussion.id] && (
                                        <button
                                            onClick={() => onLoadComments(discussion.id)}
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
    );
}
