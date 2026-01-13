import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Context } from "../../main";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaBuilding, FaUser, FaCalendarAlt, FaComments, FaPaperPlane, FaChevronDown, FaChevronUp } from "react-icons/fa";

const Experiences = () => {
  const [experiences, setExperiences] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const { isAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();

  const fetchExperiences = async (q = "") => {
    try {
      const { data } = await axios.get("http://localhost:4000/api/v1/experience/getall", {
        params: { q, page: currentPage },
        withCredentials: true,
      });
      setExperiences(data.experiences);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!isAuthorized || (user && user.role === "Employer")) {
      navigateTo("/");
    } else {
      const delayDebounceFn = setTimeout(() => {
        fetchExperiences(searchQuery);
      }, 450);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [isAuthorized, user, searchQuery, currentPage]);

  const handlePostExperience = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/experience/post",
        { title, company, description },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(data.message);
      setTitle("");
      setCompany("");
      setDescription("");
      setShowForm(false);
      fetchExperiences();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const handleAddComment = async (e, expId) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const { data } = await axios.post(
        `http://localhost:4000/api/v1/experience/comment/${expId}`,
        { comment: commentText },
        { withCredentials: true }
      );
      toast.success("Comment added!");
      setCommentText("");
      // Update local state to show new comment
      setExperiences(prev => prev.map(exp => exp._id === expId ? data.experience : exp));
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <section className="jobs page">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "20px" }}>
          <h1>Job Seeker Experiences</h1>
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <input
              type="text"
              className="searchInput"
              placeholder="Search experiences..."
              style={{ margin: 0, width: "300px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              onClick={() => setShowForm(!showForm)}
              style={{
                background: showForm ? "#ef4444" : "linear-gradient(135deg, #2d5649 0%, #1e3a31 100%)",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "12px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
            >
              {showForm ? "Cancel" : <><FaPlus /> Share Experience</>}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="searchBar" style={{ marginBottom: "40px" }}>
            <form onSubmit={handlePostExperience} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <input
                className="searchInput"
                placeholder="Experience Title (e.g. My Interview at Google)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                className="searchInput"
                placeholder="Company Name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
              <textarea
                className="searchInput"
                placeholder="Describe your experience..."
                rows="5"
                style={{ height: "auto", padding: "12px" }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <button type="submit" className="view-btn" style={{ width: "fit-content" }}>
                Post Experience
              </button>
            </form>
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
          {experiences.length > 0 ? (
            <>
            {experiences.map((exp) => (
              <div className="jobCard" key={exp._id} style={{ maxWidth: "100%", marginBottom: "20px" }}>
                <div className="card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div className="company-logo">{exp.company.charAt(0)}</div>
                    <div>
                      <h3 style={{ margin: 0 }}>{exp.title}</h3>
                      <div className="company-info" style={{ margin: 0 }}>
                        <span><FaBuilding /> {exp.company}</span>
                        <span>•</span>
                        <span><FaUser /> {exp.userName}</span>
                        <span>•</span>
                        <span><FaCalendarAlt /> {new Date(exp.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <span className="badge">Experience</span>
                </div>
                
                <p className="description" style={{ 
                  whiteSpace: "pre-line", 
                  marginTop: "15px",
                  maxHeight: expandedId === exp._id ? "none" : "100px",
                  overflow: "hidden",
                  position: "relative"
                }}>
                  {exp.description}
                  {expandedId !== exp._id && exp.description.length > 200 && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40px", background: "linear-gradient(transparent, #fff)" }}></div>
                  )}
                </p>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
                  <button 
                    onClick={() => setExpandedId(expandedId === exp._id ? null : exp._id)}
                    style={{ background: "none", border: "none", color: "#2d5649", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    {expandedId === exp._id ? <><FaChevronUp /> Show Less</> : <><FaChevronDown /> Read More</>}
                  </button>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", color: "#666", fontSize: "0.9rem" }}>
                    <span><FaComments /> {exp.comments?.length || 0} Comments</span>
                  </div>
                </div>

                {expandedId === exp._id && (
                  <div className="comments-section" style={{ marginTop: "20px", background: "#f9f9f9", padding: "20px", borderRadius: "8px" }}>
                    <h4 style={{ marginBottom: "15px" }}>Discussion</h4>
                    
                    <div className="comments-list" style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "20px" }}>
                      {exp.comments && exp.comments.length > 0 ? (
                        exp.comments.map((c, idx) => (
                          <div key={idx} style={{ background: "#fff", padding: "12px", borderRadius: "6px", border: "1px solid #eee" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                              <strong style={{ fontSize: "0.9rem", color: "#2d5649" }}>{c.userName}</strong>
                              <span style={{ fontSize: "0.75rem", color: "#999" }}>{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "#444" }}>{c.comment}</p>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: "0.9rem", color: "#888", fontStyle: "italic" }}>No comments yet. Be the first to reply!</p>
                      )}
                    </div>

                    <form onSubmit={(e) => handleAddComment(e, exp._id)} style={{ display: "flex", gap: "10px" }}>
                      <input
                        className="searchInput"
                        placeholder="Write a reply..."
                        style={{ margin: 0, flex: 1 }}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <button 
                        type="submit" 
                        className="view-btn" 
                        style={{ padding: "0 20px" }}
                        disabled={submittingComment}
                      >
                        {submittingComment ? "..." : <FaPaperPlane />}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
            <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "center", gap: "10px", marginTop: "30px" }}>
              <button 
                className="save-btn" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              <span style={{ display: "flex", alignItems: "center", fontWeight: "bold" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="save-btn" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
            </>
          ) : (
            <p>No experiences shared yet.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Experiences;
