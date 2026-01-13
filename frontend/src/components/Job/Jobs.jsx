import React, { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../../main";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [company, setCompany] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [techStack, setTechStack] = useState("");
  const [showMore, setShowMore] = useState(false);
  const { isAuthorized } = useContext(Context);
  const [savedIds, setSavedIds] = useState([]);
  const navigateTo = useNavigate();
  const fetchJobs = async (params = {}) => {
    try {
      const { data } = await axios.get("http://localhost:4000/api/v1/job/getall", {
        params: { ...params, page: currentPage },
        withCredentials: true,
      });
      setJobs(data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchSaved = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/v1/job/saved", { withCredentials: true });
      if (res.data && res.data.saved) {
        setSavedIds(res.data.saved.map((j) => j._id));
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (isAuthorized) fetchSaved();
  }, [isAuthorized]);

  // performSearch builds params and calls fetchJobs
  const performSearch = () => {
    const params = {};
    if (query) params.q = query;
    if (category) params.category = category;
    if (country) params.country = country;
    if (city) params.city = city;
    if (company) params.company = company;
    if (minSalary) params.minSalary = minSalary;
    if (maxSalary) params.maxSalary = maxSalary;
    if (workMode) params.workMode = workMode;
    if (experienceLevel) params.experienceLevel = experienceLevel;
    if (companyType) params.companyType = companyType;
    if (techStack) params.techStack = techStack;
    fetchJobs(params);
  };

  // debounced live search while typing
  const debounceRef = useRef(null);
  useEffect(() => {
    // clear previous timer
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // debounce 450ms
    debounceRef.current = setTimeout(() => {
      performSearch();
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // run when any filter changes
  }, [query, category, country, city, company, minSalary, maxSalary, workMode, experienceLevel, companyType, techStack, currentPage]);

  const handleSearch = (e) => {
    e && e.preventDefault();
    // immediate search on explicit submit
    if (debounceRef.current) clearTimeout(debounceRef.current);
    performSearch();
  };
  if (!isAuthorized) {
    navigateTo("/");
  }

  return (
    <section className="jobs page">
      <div className="container">
        <h1>Explore Opportunities</h1>

        <div className="searchBar">
          <form onSubmit={handleSearch}>
            <input
              className="searchInput"
              placeholder="Job title, keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <input
              className="searchInput"
              placeholder="Company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <input
              className="searchInput"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <select
              className="searchInput"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Graphics & Design">Graphics & Design</option>
              <option value="Mobile App Development">Mobile App Development</option>
              <option value="Frontend Web Development">Frontend Web Development</option>
              <option value="Business Development Executive">Business Development Executive</option>
              <option value="Account & Finance">Account & Finance</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Video Animation">Video Animation</option>
              <option value="MEAN Stack Development">MEAN STACK Development</option>
              <option value="MERN Stack Development">MERN STACK Development</option>
              <option value="Data Entry Operator">Data Entry Operator</option>
            </select>

            <div className="search-buttons">
              <button type="submit" className="view-btn" style={{ border: "none" }}>
                Search
              </button>
              <button
                type="button"
                className="save-btn"
                style={{ background: showMore ? "#2d5649" : "#f1f5f9", color: showMore ? "#fff" : "#475569" }}
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? "Less Options" : "More Options"}
              </button>
              <button
                type="button"
                className="save-btn"
                onClick={() => {
                  setQuery("");
                  setCategory("");
                  setCountry("");
                  setCity("");
                  setCompany("");
                  setMinSalary("");
                  setMaxSalary("");
                  setWorkMode("");
                  setExperienceLevel("");
                  setCompanyType("");
                  setTechStack("");
                  fetchJobs();
                }}
              >
                Reset
              </button>
            </div>

            {showMore && (
              <div className="more-filters" style={{ display: "flex", flexWrap: "wrap", gap: "10px", width: "100%", marginTop: "15px", padding: "15px", background: "#f8fafc", borderRadius: "12px" }}>
                <input
                  className="searchInput"
                  placeholder="Min Salary"
                  type="number"
                  style={{ flex: "1 1 200px" }}
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                />
                <input
                  className="searchInput"
                  placeholder="Max Salary"
                  type="number"
                  style={{ flex: "1 1 200px" }}
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                />
                <select
                  className="searchInput"
                  style={{ flex: "1 1 200px" }}
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                >
                  <option value="">Work Mode</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
                <select
                  className="searchInput"
                  style={{ flex: "1 1 200px" }}
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                >
                  <option value="">Experience Level</option>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="Expert">Expert</option>
                </select>
                <select
                  className="searchInput"
                  style={{ flex: "1 1 200px" }}
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                >
                  <option value="">Company Type</option>
                  <option value="Startup">Startup</option>
                  <option value="MNC">MNC</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  className="searchInput"
                  placeholder="Tech Stack (e.g. React, Node)"
                  style={{ flex: "1 1 100%" }}
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                />
              </div>
            )}
          </form>
        </div>

        <div className="grid">
          {jobs.jobs && jobs.jobs.length ? (
            <>
            {jobs.jobs.map((element) => (
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
                    {element.applicantLimit > 0 && element.applicantsCount >= element.applicantLimit ? (
                      <span className="status-badge rejected" style={{ padding: "8px 16px" }}>Closed</span>
                    ) : (
                      <>
                        {isAuthorized && (
                          <button
                            className={`save-btn ${savedIds.includes(element._id) ? "saved" : ""}`}
                            title={savedIds.includes(element._id) ? "Unsave Job" : "Save Job"}
                            onClick={async () => {
                              try {
                                const r = await axios.post(
                                  `http://localhost:4000/api/v1/job/save/${element._id}`,
                                  {},
                                  { withCredentials: true }
                                );
                                if (r.data && r.data.action) {
                                  if (r.data.action === "saved")
                                    setSavedIds((prev) => Array.from(new Set([...prev, element._id])));
                                  else setSavedIds((prev) => prev.filter((id) => id !== element._id));
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          >
                            {savedIds.includes(element._id) ? "❤️" : "🤍"}
                          </button>
                        )}
                        <Link to={`/job/${element._id}`} className="view-btn">
                          Details
                        </Link>
                      </>
                    )}
                  </div>
                </div>
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
            <div className="jobCard" style={{ gridColumn: "1/-1", textAlign: "center" }}>
              <p>No jobs found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Jobs;
