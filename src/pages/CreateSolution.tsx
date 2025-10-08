import React, { useState } from "react";
import { createSolution } from "../api";
import "../styles/pages/DetailPage.scss";
import { useDiscussionData } from "../context/DiscussionDataContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesLeft } from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../components/LoadingSpinner";

interface SolutionImplementationCreationProps {
  onClose: () => void;
}

const CreateSolution: React.FC<SolutionImplementationCreationProps> = ({ onClose }) => {
  const { loading, error, ids, addOrUpdateSolutionImplementationData } = useDiscussionData();
  // State to manage submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [solutionsUrl, setSolutionsUrl] = useState("");

  const close = () => onClose();

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  const repositoryId = ids?.repositoryId || "";
  const solutionImplementationCategoryId = ids?.solutionImplementationCategoryId || "";

  // The following variables are referenced but not defined in the original code:
  // selectedCategoryId, setSelectedCategoryId, solutionCategories
  // You may need to define them or remove the category selection if not needed.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); // Set submitting state to true

    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    if (!repositoryId || !solutionImplementationCategoryId) {
      alert("Repository ID or Category ID is missing.");
      return;
    }

    if (!title || !description || !solutionsUrl) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const solutionImplementationResponse = await createSolution({
        repositoryId: repositoryId,
        categoryId: solutionImplementationCategoryId,
        title,
        description,
        solutionsUrl,
      });
      alert("Solution created successfully!");

      // Add the solution to the discussion data context
      // This ensures the new solution appears in the list without needing a full refresh
      if (addOrUpdateSolutionImplementationData) {
        addOrUpdateSolutionImplementationData(solutionImplementationResponse);
      }

      // redirect back to solutions
      onClose();
    } catch {
      alert("Creation failed.");
    } finally {
      setIsSubmitting(false); // Reset submitting state
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
            <span className="title-text">Create Solution Implementation</span>
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
              <label>Solution URL:</label>
              <input
                className="custom-input"
                type="string"
                value={solutionsUrl}
                onChange={(e) => setSolutionsUrl(e.target.value)}
                required
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

export default CreateSolution;
