import { useEffect, useState, useCallback } from 'react';
import { useDiscussionData } from '../context/DiscussionDataContext';
import Pagination from '../components/Pagination';
import type { SimpleDiscussion, PageInfo } from '../types/GitHub';
import type { ListData } from '../types/DiscussionData';
import '../styles/pages/ListPage.scss';
import patternIconUrl from '../assets/patterns.svg';
import LoadingSpinner from '../components/LoadingSpinner';
import { faPlus, faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface PatternListProps {
  onSelectPattern: (number: number) => void;
  onAddPattern?: () => void;
}

const PatternList: React.FC<PatternListProps> = ({ onSelectPattern, onAddPattern }) => {
  const { loading, error, ids, fetchDiscussionList, clearListCache } = useDiscussionData();

  const [patterns, setPatterns] = useState<SimpleDiscussion[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);

  const [pageHistory, setPageHistory] = useState<Array<string | null>>([null]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  const handleListDataFetched = useCallback((data: ListData) => {
    setPatterns(data.discussions);
    setPageInfo(data.pageInfo);
  }, []);

  // Use Effect reacts to changing the page index
  useEffect(() => {
    if (!ids.patternCategoryId) return;
    const cursor = pageHistory[currentPageIndex];

    // List data are fetched, inside this method it is checked if data can be used from cache
    fetchDiscussionList(ids.patternCategoryId, cursor, handleListDataFetched);
  }, [currentPageIndex, pageHistory, fetchDiscussionList, ids, handleListDataFetched]);

  // Handle pagination for loading the next/previous page of patterns
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
    // Clear the cache
    clearListCache('patterns');
    // Reset pagination to first page
    setPageHistory([null]);
    setCurrentPageIndex(0);
    setPatterns([]);
    setPageInfo(null);
  };

  let content;
  if (loading && patterns.length === 0) {
    content = <LoadingSpinner />;
  } else if (error) {
    content = <p>Fehler beim Laden: {error}</p>;
  } else if (patterns.length === 0) {
    content = <p>Keine Patterns gefunden.</p>;
  } else {
    content = (
      <ul className="list-content">
        {patterns.map((pattern) => (
          <li
            key={pattern.number}
            className="list-item"
            onClick={() => onSelectPattern(pattern.number)}
          >
            <div className="item-title">
              {pattern.title}
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
          <img src={patternIconUrl} className="title-icon" alt="Patterns Icon" />
          Patterns
        </h1>
        <div className="header-buttons">
          <button onClick={handleRefresh} className="refresh-button" disabled={loading} title="Refresh list">
            <FontAwesomeIcon icon={faArrowsRotate} />
          </button>
          <button onClick={onAddPattern} className="create-button"><FontAwesomeIcon icon={faPlus} /></button>
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

export default PatternList;