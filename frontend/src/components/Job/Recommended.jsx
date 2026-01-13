import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Context } from "../../main";

const Recommended = () => {
  const { isAuthorized } = useContext(Context);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/job/recommendations",
          { withCredentials: true }
        );
        if (data && data.recommendations) setRecs(data.recommendations);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthorized) fetchRecs();
  }, [isAuthorized]);

  if (!isAuthorized) return <div className="container"><h3>Please login to see recommendations.</h3></div>;

  return (
    <section className="recommended page">
      <div className="container">
        <h1>Recommended Jobs For You</h1>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: "40px" }}>
          AI-powered recommendations based on your resume skills and experience.
        </p>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <p>Analyzing your profile and finding the best matches...</p>
          </div>
        ) : recs.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "50px" }}>
            <p>No recommendations found yet. Make sure your profile has a resume uploaded!</p>
          </div>
        ) : (
          <div className="grid">
            {recs.map((r) => (
              <div key={r.jobId} className="jobCard">
                <div>
                  <div className="card-header">
                    <div className="company-logo">
                      {r.companyName ? r.companyName.charAt(0) : "J"}
                    </div>
                    <span className="badge">{r.category}</span>
                  </div>
                  <h3>{r.title}</h3>
                  <div className="company-info">
                    <span>🏢 {r.companyName}</span>
                    <span>•</span>
                    <span>📍 {r.location}</span>
                    {r.isExternal && (
                      <>
                        <span>•</span>
                        <span className="badge" style={{ background: "#0077b5", color: "white" }}>{r.source}</span>
                      </>
                    )}
                  </div>
                  
                  <div style={{ marginTop: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Match Score</span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: r.score > 70 ? "#166534" : "#854d0e" }}>{r.score}%</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${r.score}%`, height: "100%", background: r.score > 70 ? "#22c55e" : "#eab308" }}></div>
                    </div>
                  </div>

                  {r.matchedSkills && r.matchedSkills.length > 0 && (
                    <div style={{ marginTop: "15px" }}>
                      <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Matched Skills</p>
                      <div className="keyword-tags">
                        {r.matchedSkills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="tag matched" style={{ fontSize: "0.75rem" }}>{skill}</span>
                        ))}
                        {r.matchedSkills.length > 5 && <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>+{r.matchedSkills.length - 5} more</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  {r.isExternal ? (
                    <a href={r.link} target="_blank" rel="noreferrer" className="view-btn" style={{ width: "100%", textAlign: "center", background: "#0077b5" }}>
                      Apply on {r.source}
                    </a>
                  ) : (
                    <Link to={`/job/${r.jobId}`} className="view-btn" style={{ width: "100%", textAlign: "center" }}>
                      View Opportunity
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Recommended;
