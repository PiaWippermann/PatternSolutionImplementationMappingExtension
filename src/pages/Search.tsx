import React, { useState } from "react";
import { searchDiscussions } from "../api/queries/discussions";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { faAnglesLeft } from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDiscussionData } from '../context/DiscussionDataContext';
import '../styles/pages/Search.scss';

type SearchingResult = {
    id: string;
    title: string;
    number: number;
    categoryId?: string;
}

interface SearchProps {
    onClose: () => void;
    onDiscussionSelected?: (result: { discussionNumber: number, viewName: string }) => void;
}

const Search: React.FC<SearchProps> = ({ onClose, onDiscussionSelected }) => {
    const { ids } = useDiscussionData();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchResults, setSearchResults] = useState<SearchingResult[] | null>(
        null
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentCursor, setCurrentCursor] = useState<string | null>(null);
    const [hasNextPage, setHasNextPage] = useState<boolean>(false);
    const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);
    const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);

    const handleSearch = async (e: React.FormEvent, cursor: string | null = null) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (searchTerm.trim() === "") {
            setError("Please enter a search term.");
            setIsLoading(false);
            return;
        }

        try {
            // Search in Patterns and Solution Implementations (excludes Mapping category)
            const mappingCategoryName = "Pattern - Solution Implementation Mapping";
            const data = await searchDiscussions(searchTerm, mappingCategoryName, 10, cursor);


            const formattedResults = data.nodes.map(node => ({
                id: node.id,
                title: node.title,
                number: node.number,
                categoryId: node.category.id
            }));

            setSearchResults(formattedResults);
            setHasNextPage(data.pageInfo.hasNextPage);
            setCurrentCursor(data.pageInfo.endCursor);
            
            // Reset history when new search is performed (no cursor)
            if (!cursor) {
                setCursorHistory([null]);
                setHasPrevPage(false);
            }
        } catch (err) {
            setError("An error occurred during the search. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextPage = async () => {
        if (!hasNextPage || !currentCursor) return;
        
        // Add current cursor to history before moving to next page
        setCursorHistory(prev => [...prev, currentCursor]);
        setHasPrevPage(true);
        
        const mockEvent = { preventDefault: () => {} } as React.FormEvent;
        await handleSearch(mockEvent, currentCursor);
    };

    const handlePrevPage = async () => {
        if (!hasPrevPage) return;
        
        // Get previous cursor from history
        const newHistory = [...cursorHistory];
        newHistory.pop(); // Remove current cursor
        const prevCursor = newHistory[newHistory.length - 1] || null;
        
        setCursorHistory(newHistory);
        setHasPrevPage(newHistory.length > 1);
        
        const mockEvent = { preventDefault: () => {} } as React.FormEvent;
        await handleSearch(mockEvent, prevCursor);
    };

    const onResultClick = (result: SearchingResult) => {
        const categoryId = result.categoryId;

        if (onDiscussionSelected && ids && ids.patternCategoryId && ids.solutionImplementationCategoryId && categoryId) {
            if (categoryId === ids.patternCategoryId) {
                // Call the onDiscussionSelected prop with the number and the view name set to patternDetail
                onDiscussionSelected({ discussionNumber: result.number, viewName: 'patternDetail' });
            } else if (categoryId === ids.solutionImplementationCategoryId) {
                // Call the onDiscussionSelected prop with the number and the view name set to solutionImplementationDetail
                onDiscussionSelected({ discussionNumber: result.number, viewName: 'solutionImplementationDetail' });
            }
        }
    }

    return (
        <div className="search-page-container">
            <button onClick={onClose} className="back-button">
                <FontAwesomeIcon icon={faAnglesLeft} />
                <span className="back-button-text">Back</span>
            </button>

            <h3 className="search-title">Search Discussions</h3>

            <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-container">
                    <input
                        type="text"
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for patterns or solutions..."
                    />
                    <button type="submit" className="search-button">
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </button>
                </div>
            </form>

            <div className="search-results-container">
                {isLoading && <LoadingSpinner />}
                {error && <div className="search-error">{error}</div>}

                {searchResults && searchResults.length > 0 && (
                    <>
                        <div className="results-list">
                            <ul>
                                {searchResults.map((result) => (
                                    <li key={result.id} className="search-result-item" onClick={() => onResultClick(result)}>
                                        {result.title}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="pagination-container">
                            <Pagination
                                onPrevPage={handlePrevPage}
                                onNextPage={handleNextPage}
                                hasNextPage={hasNextPage}
                                isBackDisabled={!hasPrevPage}
                                loading={isLoading}
                            />
                        </div>
                    </>
                )}

                {searchResults && searchResults.length === 0 && (
                    <div className="no-results-message">No results found.</div>
                )}
            </div>
        </div>
    );
};


export default Search;