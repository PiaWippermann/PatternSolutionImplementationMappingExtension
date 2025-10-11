import { useEffect, useState } from "react";
import { useDiscussionData } from "../context/DiscussionDataContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesLeft } from "@fortawesome/free-solid-svg-icons";
import MappingList from "../components/MappingList";
import "../styles/pages/DetailPage.scss";
import type { Pattern } from "../types/DiscussionData";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

interface PatternDetailProps {
  patternNumber: number;
  onClose: () => void;
}

const PatternDetail: React.FC<PatternDetailProps> = ({ patternNumber, onClose }) => {
  const { fetchDiscussionDetailsByNumber, ids, clearListCache } = useDiscussionData();

  const [patternDetails, setPatternDetails] = useState<Pattern | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      if (patternNumber && ids?.patternCategoryId) {
        try {
          setIsLoading(true);
          setError(null);

          const details = await fetchDiscussionDetailsByNumber(ids.patternCategoryId, patternNumber) as Pattern | null;

          if (details) {
            setPatternDetails(details);
          } else {
            setError("Pattern not found");
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load pattern");
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadDetails();

    // Cleanup function to reset state when component unmounts
    return () => {
      setError(null);
      setPatternDetails(null);
      setIsLoading(true);
    };
  }, [patternNumber, ids, fetchDiscussionDetailsByNumber]);

  const close = () => {
    // Only clear cache if there was an error (discussion might have been deleted)
    if (error) {
      clearListCache('patterns');
    }
    onClose();
  };

  if (isLoading) return <LoadingSpinner />;

  if (error || !patternDetails) return (
    <ErrorMessage
      title={error ? "Error Loading Pattern" : "Pattern Not Found"}
      message={error
        ? "The pattern could not be loaded. It may have been deleted or you may not have access to it."
        : `Pattern #${patternNumber} could not be found. It may have been deleted or you may not have access to it.`}
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
            <span dangerouslySetInnerHTML={{ __html: patternDetails.category.emojiHTML }} />
            <span className="category-name">{patternDetails.category.name}</span>
          </div>
          <div className="item-title">
            {patternDetails.icon && <img src={patternDetails.icon} alt={`${patternDetails.title} Icon`} className="item-icon" />}
            <span className="title-text">{patternDetails.title}</span>
          </div>
        </div>

        <div className="content-body">
          <div className="separator"></div>

          <div className="section">
            <h2 className="section-title">Pattern Language</h2>
            <div className="description-text" dangerouslySetInnerHTML={{ __html: patternDetails.patternLanguage || "No pattern language specified." }} />
          </div>

          <div className="separator"></div>

          <div className="section">
            <h2 className="section-title">Description</h2>
            <div className="description-text" dangerouslySetInnerHTML={{ __html: patternDetails.description || "No description available." }} />
          </div>

          <div className="separator"></div>

          <div className="section">
            <h2 className="section-title">Mapped Solution Implementations</h2>
            <MappingList
              sourceDiscussion={patternDetails}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternDetail;