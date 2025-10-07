import styles from "./Comment.module.scss";
import type { Comment } from "../types/GitHub";
import { reactionEmojiMap } from "../utils/reactionMap";
import { useEffect } from "react";

export default function CommentComponent({
  commentData,
}: {
  commentData: Comment;
}) {
  const groupedReactions = commentData.reactions.nodes.reduce<
    Record<string, number>
  >((acc, reaction) => {
    const type = reaction.content;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => {
    // This effect runs when the component mounts or when commentData changes
  }, [commentData]);

  return (
    <div className={styles.commentCard}>
      <div className={styles.commentHeader}>
        <img
          src={commentData.author.avatarUrl}
          alt={`${commentData.author.login}'s avatar`}
          className={styles.avatar}
        />
        <span className={styles.author}>{commentData.author.login}</span>
        <span className={styles.date}>
          {new Date(commentData.publishedAt).toLocaleDateString()}
        </span>
      </div>
      <div className={styles.commentBody}>
        <p>{commentData.body}</p>
      </div>
      <div className={styles.commentFooter}>
        <div className={styles.reactions}>
          {Object.entries(groupedReactions).map(([type, count]) => (
            <span key={type} className={styles.reaction}>
              {reactionEmojiMap[type] || type} {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
