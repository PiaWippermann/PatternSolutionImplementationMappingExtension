/**
 * PatternSelector Component
 * Displays a searchable list of patterns for creating new mappings
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesLeft, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import styles from '../../components/MappingList.module.scss';

interface PatternSelectorProps {
    patternMappingOptionList: Array<{ number: number; title: string }>;
    listPageInfo: { hasNextPage: boolean } | null;
    currentListPageIndex: number;
    patternSearchInput: string;
    isSearching: boolean;
    isLoading: boolean;
    onBack: () => void;
    onPatternSelect: (patternNumber: number) => void;
    onSearchInputChange: (value: string) => void;
    onSearchKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onSearchSubmit: (term: string) => void;
    onNextPage: () => void;
    onPrevPage: () => void;
}

export function PatternSelector({
    patternMappingOptionList,
    listPageInfo,
    currentListPageIndex,
    patternSearchInput,
    isSearching,
    isLoading,
    onBack,
    onPatternSelect,
    onSearchInputChange,
    onSearchKeyPress,
    onSearchSubmit,
    onNextPage,
    onPrevPage
}: PatternSelectorProps) {
    return (
        <div className={styles.mappingListContainer}>
            <button onClick={onBack} className="back-button">
                <FontAwesomeIcon icon={faAnglesLeft} />
                <span className="back-button-text">Back</span>
            </button>
            <h3 className={styles.sectionTitle}>Create a new mapping</h3>

            {/* Search Input */}
            <div className="search-input-container" style={{ margin: '16px 0' }}>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search patterns..."
                    value={patternSearchInput}
                    onChange={(e) => onSearchInputChange(e.target.value)}
                    onKeyPress={onSearchKeyPress}
                />
                <button
                    type="button"
                    className="search-button"
                    onClick={() => onSearchSubmit(patternSearchInput)}
                >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
            </div>

            {isLoading && <LoadingSpinner />}

            {!isLoading && patternMappingOptionList.length === 0 && (
                <p>{isSearching ? 'No patterns found matching your search.' : 'No items found.'}</p>
            )}

            {!isLoading && patternMappingOptionList.length > 0 && (
                <ul className={styles.creationList}>
                    {patternMappingOptionList.map(item => (
                        <li key={item.number} onClick={() => onPatternSelect(item.number)}>
                            {item.title}
                        </li>
                    ))}
                </ul>
            )}

            <Pagination
                onPrevPage={onPrevPage}
                onNextPage={onNextPage}
                hasNextPage={listPageInfo?.hasNextPage || false}
                isBackDisabled={currentListPageIndex === 0}
                loading={isLoading}
            />
        </div>
    );
}
