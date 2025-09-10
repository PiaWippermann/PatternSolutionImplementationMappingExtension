import { useEffect, useState } from "react";
import "../styles/pages/DetailPage.scss";
import { useDiscussionData } from "../context/DiscussionDataContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesLeft } from "@fortawesome/free-solid-svg-icons";
import MappingList from "../components/MappingList";
import LoadingSpinner from "../components/LoadingSpinner";
import type { SolutionImplementation } from "../types/DiscussionData";

interface SolutionImplementationDetailProps {
    solutionImplementationNumber: number;
    onClose: () => void;
}

const SolutionImplementationDetail: React.FC<SolutionImplementationDetailProps> = ({ solutionImplementationNumber, onClose }) => {
    // use params to get the pattern number from the URL 
    console.log("solutionImplementationNumber", solutionImplementationNumber);
    const { loading, error, fetchDiscussionDetailsByNumber, ids } = useDiscussionData();

    // State for loaded details
    const [solutionImplementationDetails, setSolutionImplementationDetails] = useState<SolutionImplementation | null>(null);

    useEffect(() => {
        const loadDetails = async () => {
            if (solutionImplementationNumber && ids?.solutionImplementationCategoryId) {
                const details = await fetchDiscussionDetailsByNumber(ids.solutionImplementationCategoryId, solutionImplementationNumber) as SolutionImplementation | null;

                if (details) {
                    setSolutionImplementationDetails(details);
                }
            }
        };
        loadDetails();
    }, [solutionImplementationNumber, ids, fetchDiscussionDetailsByNumber]);

    const close = () => onClose();

    if (loading && !solutionImplementationDetails) return <LoadingSpinner />;
    if (error) return <div>Error: {error}</div>;
    if (!solutionImplementationDetails) return <p>Solution implementation not found.</p>;


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
