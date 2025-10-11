import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import styles from './ErrorMessage.module.scss';

type ErrorMessageProps = {
    title?: string;
    message: string;
    showBackButton?: boolean;
    onBack?: () => void;
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({
    title = "Error",
    message,
    showBackButton = true,
    onBack
}) => {
    const handleBack = () => {
        if (onBack) {
            onBack();
        }
    };

    return (
        <div className={styles.errorContainer}>
            <div className={styles.errorCard}>
                <div className={styles.errorIcon}>
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                </div>
                <h2 className={styles.errorTitle}>{title}</h2>
                <p className={styles.errorMessage}>{message}</p>
                {showBackButton && onBack && (
                    <button className={styles.backButton} onClick={handleBack}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Go Back</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorMessage;
