import React from 'react';
import styles from './Pagination.module.scss';

type PaginationProps = {
    onPrevPage: () => void;
    onNextPage: () => void;
    hasNextPage: boolean;
    isBackDisabled: boolean;
    loading: boolean;
};

const Pagination: React.FC<PaginationProps> = ({
    onPrevPage,
    onNextPage,
    hasNextPage,
    isBackDisabled,
    loading
}) => {
    return (
        <div className={styles.paginationContainer}>
            <button
                className={styles.paginationButton}
                onClick={onPrevPage}
                disabled={isBackDisabled || loading}
            >
                Back
            </button>

            <button
                className={styles.paginationButton}
                onClick={onNextPage}
                disabled={!hasNextPage || loading}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;