/**
 * PatternDetailView Component
 * Shows details of a selected pattern before creating a mapping
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesLeft } from '@fortawesome/free-solid-svg-icons';
import type { Pattern } from '../../types/DiscussionData';
import styles from '../../components/MappingList.module.scss';
import sidebarStyles from '../../components/Sidebar.module.scss';

interface PatternDetailViewProps {
    selectedPattern: Pattern;
    onBack: () => void;
    onCreateMapping: () => void;
}

export function PatternDetailView({
    selectedPattern,
    onBack,
    onCreateMapping
}: PatternDetailViewProps) {
    return (
        <div className={styles.mappingListContainer}>
            <button onClick={onBack} className="back-button">
                <FontAwesomeIcon icon={faAnglesLeft} />
                <span className="back-button-text">Back</span>
            </button>
            <h3 className={styles.sectionTitle}>Pattern Details</h3>
            <div className={styles.selectedPatternDetails}>
                <img
                    src={selectedPattern.icon}
                    alt={`${selectedPattern.title} Icon`}
                    className={sidebarStyles.icon}
                />
                <h3>{selectedPattern.title}</h3>
                <button className={styles.createButton} onClick={onCreateMapping}>
                    Create Mapping
                </button>
            </div>
            <div className={styles.linkedDetailsContainer}>
                <p>{selectedPattern.description}</p>
            </div>
        </div>
    );
}
