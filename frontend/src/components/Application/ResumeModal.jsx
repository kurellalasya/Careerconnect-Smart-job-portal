import React from "react";

const ResumeModal = ({ imageUrl, onClose }) => {
  const isPDF = imageUrl && imageUrl.toLowerCase().endsWith(".pdf");
  const fullImageUrl = imageUrl && !imageUrl.startsWith("http") 
    ? `http://localhost:4000${imageUrl}` 
    : imageUrl;

  return (
    <div className="resume-modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        {isPDF ? (
          <iframe
            src={fullImageUrl}
            width="100%"
            height="100%"
            title="Resume PDF"
            style={{ border: "none" }}
          />
        ) : (
          <img src={fullImageUrl} alt="resume" />
        )}
      </div>
    </div>
  );
};

export default ResumeModal;
