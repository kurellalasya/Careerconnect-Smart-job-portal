import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";
import { useNavigate } from "react-router-dom";

const ResumeAnalyzer = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [result, setResult] = useState(null);
  const { isAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();

  useEffect(() => {
    if (!isAuthorized || (user && user.role !== "Job Seeker")) {
      navigateTo("/");
    }
  }, [isAuthorized, user, navigateTo]);

  const handleFile = (e) => setResumeFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescription) return toast.error("Provide resume and job description");
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);
    try {
      const { data } = await axios.post("http://localhost:4000/api/v1/analyzer/resume", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Analysis failed");
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return "high";
    if (score >= 50) return "medium";
    return "low";
  };

  return (
    <section className="analyzer page">
      <div className="container">
        <h2>Resume Analyzer (ATS Optimizer)</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Upload Resume (PDF or DOCX)</label>
            <input type="file" accept=".pdf,.docx" onChange={handleFile} />
          </div>
          <div className="input-group">
            <label>Job Description</label>
            <textarea
              rows={8}
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
          <button type="submit">Analyze Resume</button>
        </form>

        {result && (
          <div className="result">
            <div className="score-grid">
              <div className="score-card">
                <h3>ATS Match Score</h3>
                <div className={`score-circle ${getScoreClass(result.score)}`}>
                  {result.score}%
                </div>
                <p style={{ fontSize: "14px", marginTop: "10px", color: "#64748b" }}>
                  Based on keyword matching with JD
                </p>
              </div>
              <div className="score-card">
                <h3>Resume Quality</h3>
                <div className={`score-circle ${getScoreClass(result.resumeQualityScore)}`}>
                  {result.resumeQualityScore}%
                </div>
                <p style={{ fontSize: "14px", marginTop: "10px", color: "#64748b" }}>
                  Based on formatting and content best practices
                </p>
              </div>
            </div>

            {result.analysisSummary && (
              <div className="analysis-summary">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0 }}>Analysis Summary</h4>
                  {result.isAI && (
                    <span className="priority-badge low" style={{ background: '#dcfce7', color: '#166534' }}>
                      ✨ AI Powered
                    </span>
                  )}
                </div>
                <div className="summary-grid">
                  <div className="summary-item">
                    <label>Word Count</label>
                    <p>{result.analysisSummary.wordCount}</p>
                  </div>
                  {!result.isAI ? (
                    <>
                      <div className="summary-item">
                        <label>Quantified Bullets</label>
                        <p>{result.analysisSummary.quantifiedBullets}</p>
                      </div>
                      <div className="summary-item">
                        <label>Action Verbs</label>
                        <p>{result.analysisSummary.actionVerbsCount}</p>
                      </div>
                      <div className="summary-item">
                        <label>Sections Found</label>
                        <p>{result.analysisSummary.sectionsFound?.length}/6</p>
                      </div>
                    </>
                  ) : (
                    <div className="summary-item" style={{ gridColumn: 'span 3' }}>
                      <label>AI Insight</label>
                      <p style={{ fontSize: '1rem' }}>Deep semantic analysis completed</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.summary && (
              <div className="score-grid">
                <div className="analysis-summary" style={{ borderLeft: '4px solid #22c55e' }}>
                  <h4 style={{ color: '#166534', fontSize: '1.1rem' }}>Strengths</h4>
                  <ul style={{ marginTop: '10px', listStyle: 'inside' }}>
                    {result.summary.strengths?.map((s, i) => (
                      <li key={i} style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '5px' }}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="analysis-summary" style={{ borderLeft: '4px solid #ef4444' }}>
                  <h4 style={{ color: '#991b1b', fontSize: '1.1rem' }}>Areas for Growth</h4>
                  <ul style={{ marginTop: '10px', listStyle: 'inside' }}>
                    {result.summary.weaknesses?.map((w, i) => (
                      <li key={i} style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '5px' }}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="keywords-section">
              <h4>Keyword Analysis</h4>
              <div className="keyword-tags">
                {result.matched?.map((kw, i) => (
                  <span key={`m-${i}`} className="tag matched">
                    ✓ {kw}
                  </span>
                ))}
                {result.missingKeywords?.map((kw, i) => (
                  <span key={`ms-${i}`} className="tag missing">
                    + {kw}
                  </span>
                ))}
              </div>
            </div>

            {result.suggestions && result.suggestions.length > 0 && (
              <div className="suggestions-section">
                <h4>Improvement Suggestions</h4>
                {result.suggestions.map((s, idx) => (
                  <div key={idx} className={`suggestion-card ${s.priority}`}>
                    <div className="suggestion-header">
                      <span className="section-name">{s.section}</span>
                      <span className={`priority-badge ${s.priority}`}>{s.priority} Priority</span>
                    </div>
                    <div className="suggestion-issue">{s.issue}</div>
                    <div className="suggestion-text">{s.suggestion}</div>
                    {s.example && <div className="suggestion-example">Example: {s.example}</div>}
                  </div>
                ))}
              </div>
            )}

            {result.resumeUrl && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <a
                  href={`http://localhost:4000${result.resumeUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="applyLink"
                >
                  View Analyzed Resume
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ResumeAnalyzer;
