import React, { useState } from "react";
import { createPattern } from "../api/githubPatterns";
import "../styles/pages/DetailPage.scss";
import { useDiscussionData } from "../context/DiscussionDataContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesLeft } from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../components/LoadingSpinner";

interface PatternCreationProps {
  onClose: () => void;
}

const CreatePattern: React.FC<PatternCreationProps> = ({ onClose }) => {
  const { loading, error, ids, addOrUpdatePatternData } = useDiscussionData();
  // State to manage submission status
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => onClose();

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  const repositoryId = ids?.repositoryId || "";
  const patternCategoryId = ids?.patternCategoryId || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isSubmitting) {
      return;
    }

    if (!repositoryId || !patternCategoryId) {
      alert("Repository ID or Category ID is missing.");
      return;
    }

    if (!title || !description || !referenceUrl) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const patternCreationResponse = await createPattern({
        repositoryId: repositoryId,
        categoryId: patternCategoryId,
        title,
        description,
        referenceUrl,
        iconUrl: iconUrl || undefined,
      });

      if (addOrUpdatePatternData && patternCreationResponse) {
        addOrUpdatePatternData(patternCreationResponse);
      }

      onClose();
    } catch (err) {
      console.error("Error while creating:", err);
      alert("Creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="detail-panel">
      <button onClick={close} className="back-button">
        <FontAwesomeIcon icon={faAnglesLeft} />
        <span className="back-button-text">Back</span>
      </button>

      <div className="content-wrapper">
        <div className="content-header">
          <div className="item-title">
            <span className="title-text">Create New Pattern Reference</span>
          </div>
        </div>
        <div className="content-body">
          <div className="separator"></div>
          <form onSubmit={handleSubmit} className="creation-form">
            <div className="input-field-container">
              <label>Title:</label>
              <input
                className="custom-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="input-field-container">
              <label>Description:</label>
              <textarea
                className="custom-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="input-field-container">
              <label>Reference URL:</label>
              <input
                className="custom-input"
                type="string"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                required
              />
            </div>

            <div className="input-field-container">
              <label>Icon URL (optional):</label>
              <input
                className="custom-input"
                type="url"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
              />
            </div>

            <button className="create-button" type="submit" disabled={isSubmitting || !title}>
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePattern;