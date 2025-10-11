import { useEffect, useState } from "react";
import "../styles/pages/DetailPage.scss";
import { useDiscussionData } from "../context/DiscussionDataContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesLeft } from "@fortawesome/free-solid-svg-icons";
import MappingList from "../components/MappingList";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import type { SolutionImplementation } from "../types/DiscussionData";

interface SolutionImplementationDetailProps {
    solutionImplementationNumber: number;
    onClose: () => void;
}

const SolutionImplementationDetail: React.FC<SolutionImplementationDetailProps> = ({ solutionImplementationNumber, onClose }) => {
    const { fetchDiscussionDetailsByNumber, ids, clearListCache } = useDiscussionData();

    // State for loaded details
    const [solutionImplementationDetails, setSolutionImplementationDetails] = useState<SolutionImplementation | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDetails = async () => {
            if (solutionImplementationNumber && ids?.solutionImplementationCategoryId) {
                try {
                    setIsLoading(true);
                    setError(null);

                    const details = await fetchDiscussionDetailsByNumber(ids.solutionImplementationCategoryId, solutionImplementationNumber) as SolutionImplementation | null;

                    if (details) {
                        setSolutionImplementationDetails(details);
                    } else {
                        setError("Solution Implementation not found");
                    }
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to load solution implementation");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadDetails();

        // Cleanup function to reset state when component unmounts
        return () => {
            setError(null);
            setSolutionImplementationDetails(null);
            setIsLoading(true);
        };
    }, [solutionImplementationNumber, ids, fetchDiscussionDetailsByNumber]);

    const close = () => {
        // Only clear cache if there was an error (discussion might have been deleted)
        if (error) {
            clearListCache('solutionImplementations');
        }
        onClose();
    };

    if (isLoading) return <LoadingSpinner />;

    if (error || !solutionImplementationDetails) return (
        <ErrorMessage
            title={error ? "Error Loading Solution" : "Solution Not Found"}
            message={error
                ? "The solution implementation could not be loaded. It may have been deleted or you may not have access to it."
                : `Solution Implementation #${solutionImplementationNumber} could not be found. It may have been deleted or you may not have access to it.`}
            onBack={close}
        />
    );


    return (
        <div className="detail-panel">
            <button onClick={close} className="back-button">
                <FontAwesomeIcon icon={faAnglesLeft} />
                <span className="back-button-text">Back</span>
            </button>

            <div className="content-wrapper">
                <div className="content-header">
                    <div className="entity-category">
                        <span dangerouslySetInnerHTML={{ __html: solutionImplementationDetails.category.emojiHTML }} />
                        <span className="category-name">{solutionImplementationDetails.category.name}</span>
                    </div>
                    <div className="item-title">
                        <span className="title-text">{solutionImplementationDetails.title}</span>
                    </div>
                </div>

                <div className="content-body">
                    <div className="separator"></div>

                    <div className="section">
                        <h2 className="section-title">Description</h2>
                        <div className="description-text" dangerouslySetInnerHTML={{ __html: solutionImplementationDetails.description || "No description available." }} />
                    </div>

                    <div className="separator"></div>

                    <div className="section">
                        <h2 className="section-title">
                            Mapped Patterns
                        </h2>
                        <MappingList
                            sourceDiscussion={solutionImplementationDetails}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolutionImplementationDetail;
