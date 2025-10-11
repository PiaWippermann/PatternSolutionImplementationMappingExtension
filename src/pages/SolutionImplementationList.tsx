import { useEffect, useState, useCallback } from 'react';
import { useDiscussionData } from '../context/DiscussionDataContext';
import Pagination from '../components/Pagination';
import type { SimpleDiscussion, PageInfo } from '../types/GitHub';
import type { ListData } from '../types/DiscussionData';
import '../styles/pages/ListPage.scss';
import solutionImplementationIconUrl from '../assets/solutionImplementations.svg';
import LoadingSpinner from '../components/LoadingSpinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';

interface SolutionImplementationListProps {
    onSelectSolution: (number: number) => void;
    onAddSolutionImplementation?: () => void;
}

const SolutionImplementationList: React.FC<SolutionImplementationListProps> = ({ onSelectSolution, onAddSolutionImplementation }) => {
    const { loading, error, ids, fetchDiscussionList, clearAllCache } = useDiscussionData();

    const [solutionImplementations, setSolutionImplementations] = useState<SimpleDiscussion[]>([]);
    const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);

    const [pageHistory, setPageHistory] = useState<Array<string | null>>([null]);
    const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

    const handleListDataFetched = useCallback((data: ListData) => {
        setSolutionImplementations(data.discussions);
        setPageInfo(data.pageInfo);
    }, []);

    // Use Effect reacts to changing the page index
    useEffect(() => {
        if (!ids.solutionImplementationCategoryId) return;
        const cursor = pageHistory[currentPageIndex];

        // List data are fetched, inside this method it is checked if data can be used from cache
        fetchDiscussionList(ids.solutionImplementationCategoryId, cursor, handleListDataFetched);
    }, [currentPageIndex, pageHistory, fetchDiscussionList, ids, handleListDataFetched]);

    // Handle pagination for loading the next/previous page of solutionImplementations
    const handleNextPage = () => {
        const nextCursor = pageInfo?.endCursor || null;
        if (nextCursor) {
            setPageHistory(prevHistory => [...prevHistory, nextCursor]);
            setCurrentPageIndex(prevIndex => prevIndex + 1);
        }
    };

    const handlePrevPage = () => {
        setCurrentPageIndex(prevIndex => prevIndex - 1);
    };

    const handleRefresh = () => {
        // Clear ALL cache (lists, details, mappings)
        clearAllCache();
        // Reset pagination to first page
        setPageHistory([null]);
        setCurrentPageIndex(0);
        setSolutionImplementations([]);
        setPageInfo(null);
    };

    let content;
    if (loading && solutionImplementations.length === 0) {
        content = <LoadingSpinner />;
    } else if (error) {
        content = <p>Fehler beim Laden: {error}</p>;
    } else if (solutionImplementations.length === 0) {
        content = <p>No SolutionImplementations found.</p>;
    } else {
        content = (
            <ul className="list-content">
                {solutionImplementations.map((solutionImplementation) => (
                    <li
                        key={solutionImplementation.number}
                        className="list-item"
                        onClick={() => onSelectSolution(solutionImplementation.number)}
                    >
                        <div className="item-title">
                            {solutionImplementation.title}
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div className="list-container">
            <div className="header-section">
                <h1 className="page-title">
                    <img src={solutionImplementationIconUrl} className="title-icon" alt="SolutionImplementations Icon" />
                    Solution Implementations
                </h1>
                <div className="header-buttons">
                    <button onClick={handleRefresh} className="refresh-button" disabled={loading} title="Refresh list">
                        <FontAwesomeIcon icon={faArrowsRotate} />
                    </button>
                    <button onClick={onAddSolutionImplementation} className="create-button"><FontAwesomeIcon icon={faPlus} /></button>
                </div>
            </div>

            {content}
            <Pagination
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
                hasNextPage={pageInfo?.hasNextPage || false}
                isBackDisabled={currentPageIndex === 0}
                loading={loading}
            />
        </div>
    );
}

export default SolutionImplementationList;