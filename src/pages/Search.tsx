import React, { useState } from "react";
import { searchDiscussions } from "../api/githubQueries";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { faAnglesLeft } from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../components/LoadingSpinner";
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

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSearchResults(null);

        const repoName = "GitHubDiscussionsTesting";
        const mappingCategoryName = "Pattern - Solution Implementation Mapping";

        if (searchTerm.trim() === "") {
            setError("Please enter a search term.");
            setIsLoading(false);
            return;
        }

        try {
            const data = await searchDiscussions(
                searchTerm,
                10,
                repoName,
                mappingCategoryName
            );

            console.log("Search results:", data);

            const formattedResults = data.nodes.map(node => ({
                id: node.id,
                title: node.title,
                number: node.number,
                categoryId: node.category?.id
            }));

            setSearchResults(formattedResults);
        } catch (err) {
            console.error("Error during search:", err);
            setError("An error occurred during the search. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const onResultClick = (result: SearchingResult) => {
        const categoryId = result.categoryId;

        if (onDiscussionSelected && ids && ids.patternCategoryId && ids.solutionImplementationCategoryId && categoryId) {
            if (categoryId === ids.patternCategoryId) {

            } else if (categoryId === ids.solutionImplementationCategoryId) {
                // Call the onDiscussionSelected prop with the number and the view name set to solutionImplementationDetail
                onDiscussionSelected({ discussionNumber: result.number, viewName: 'solutionImplementationDetail' });
            } else {
                // Call the onDiscussionSelected prop with the number and the view name set to patterns
                onDiscussionSelected({ discussionNumber: result.number, viewName: 'patternDetail' });
            }
        }
    }

    return (
        <div className="search-page-container">
            <button onClick={onClose} className="back-button">
                <FontAwesomeIcon icon={faAnglesLeft} />
                <span className="back-button-text">Back</span>
            </button>

            <h3>Search Discussions</h3>

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
                    <div className="results-list">
                        <ul>
                            {searchResults.map((result) => (
                                <li key={result.id} className="search-result-item" onClick={() => onResultClick(result)}>
                                    {result.title}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {searchResults && searchResults.length === 0 && (
                    <div className="no-results-message">No results found.</div>
                )}
            </div>
        </div>
    );
};


export default Search;