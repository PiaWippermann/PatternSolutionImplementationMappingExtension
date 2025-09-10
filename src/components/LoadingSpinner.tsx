import React from 'react';
import styles from './LoadingSpinner.module.scss';

const LoadingSpinner: React.FC = () => {
    return (
        <div className={styles.spinnerContainer} aria-label="Loading">
            <div className={styles.dot1}></div>
            <div className={styles.dot2}></div>
            <div className={styles.dot3}></div>
        </div>
    );
};

export default LoadingSpinner;