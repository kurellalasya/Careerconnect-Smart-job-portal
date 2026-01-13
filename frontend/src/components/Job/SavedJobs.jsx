import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Context } from "../../main";
import { Link } from "react-router-dom";

const SavedJobs = () => {
  const { isAuthorized } = useContext(Context);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const { data } = await axios.get("http://localhost:4000/api/v1/job/saved", { withCredentials: true });
        if (data && data.saved) setSaved(data.saved);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthorized) fetchSaved();
  }, [isAuthorized]);

  if (!isAuthorized) return <div className="container"><h3>Please login to view saved jobs.</h3></div>;

  return (
    <section className="jobs page">
      <div className="container">
        <h1>Your Saved Opportunities</h1>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: "40px" }}>
          Keep track of the roles you're interested in and apply when you're ready.
        </p>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <p>Loading your saved jobs...</p>
          </div>
        ) : saved.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "50px" }}>
            <p>You haven't saved any jobs yet. Explore the "All Jobs" page to find your next role!</p>
          </div>
        ) : (
          <div className="grid">
            {saved.map((element) => (
              <div className="jobCard" key={element._id}>
                <div>
                  <div className="card-header">
                    <div className="company-logo">
                      {element.companyName ? element.companyName.charAt(0) : "J"}
                    </div>
                    <span className="badge">{element.category}</span>
                  </div>
                  <h3>{element.title}</h3>
                  <div className="company-info">
                    <span>🏢 {element.companyName}</span>
                    <span>•</span>
                    <span>📍 {element.city}, {element.country}</span>
                  </div>
                  <p className="description">
                    {element.description
                      ? element.description.slice(0, 120) +
                        (element.description.length > 120 ? "..." : "")
                      : "No description available."}
                  </p>
                </div>

                <div className="card-footer">
                  <div className="salary">
                    {element.fixedSalary ? (
                      <span>₹{element.fixedSalary.toLocaleString()}</span>
                    ) : element.salaryFrom ? (
                      <span>
                        ₹{element.salaryFrom.toLocaleString()} - ₹{element.salaryTo.toLocaleString()}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Salary Negotiable</span>
                    )}
                  </div>
                  <div className="actions">
                    <Link to={`/job/${element._id}`} className="view-btn">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SavedJobs;
