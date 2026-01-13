import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Context } from "../../main";
import { 
  FaBriefcase, FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, 
  FaCalendarAlt, FaInfoCircle, FaTasks, FaGraduationCap, FaGift, FaLink 
} from "react-icons/fa";

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState({});
  const [applicationStatus, setApplicationStatus] = useState(null);
  const navigateTo = useNavigate();

  const { isAuthorized, user } = useContext(Context);

  useEffect(() => {
    axios
      .get(`http://localhost:4000/api/v1/job/${id}`, {
        withCredentials: true,
      })
      .then((res) => {
        setJob(res.data.job);
        // if user is job seeker, check if already applied
        if (user && user.role !== "Employer") {
          axios
            .get(`http://localhost:4000/api/v1/application/check?jobId=${id}`, {
              withCredentials: true,
            })
            .then((r) => {
              if (r.data && r.data.applied) {
                setApplicationStatus({ applied: true, status: r.data.status, applicationId: r.data.applicationId });
              } else {
                setApplicationStatus({ applied: false });
              }
            })
            .catch(() => {
              setApplicationStatus({ applied: false });
            });
        }
      })
      .catch((error) => {
        navigateTo("/notfound");
      });
  }, []);

  if (!isAuthorized) {
    navigateTo("/login");
  }

  return (
    <section className="jobDetail page">
      <div className="container">
        <div className="job-details-wrapper">
          <div className="job-header">
            <div className="company-logo-placeholder">
              {job.companyName ? job.companyName.charAt(0).toUpperCase() : "J"}
            </div>
            <div className="job-title-info">
              <h3>{job.title}</h3>
              <p className="company-name">
                <FaBuilding /> {job.companyName} 
                {job.companyWebsite && (
                  <a href={job.companyWebsite} target="_blank" rel="noreferrer" className="company-link">
                    <FaLink /> Website
                  </a>
                )}
              </p>
              <div className="job-meta">
                <span><FaMapMarkerAlt /> {job.city}, {job.country}</span>
                <span><FaBriefcase /> {job.jobType || "Full-time"} ({job.workMode})</span>
                <span><FaCalendarAlt /> Posted on: {job.jobPostedOn ? new Date(job.jobPostedOn).toLocaleDateString() : "-"}</span>
              </div>
            </div>
            <div className="job-action">
              {user && user.role === "Employer" ? (
                <div className="employer-badge">Employer View</div>
              ) : user && user.role === "Admin" ? (
                <div className="employer-badge" style={{ background: "#e2e8f0", color: "#475569" }}>Admin View</div>
              ) : job.applicantLimit > 0 && job.applicantsCount >= job.applicantLimit ? (
                <span className="status-badge rejected" style={{ padding: "14px 30px", fontSize: "1.1rem" }}>Job Closed</span>
              ) : applicationStatus && applicationStatus.applied ? (
                <button className="applied-btn" disabled>
                  Applied: {applicationStatus.status || "In Review"}
                </button>
              ) : (
                <Link to={`/application/${job._id}`} className="apply-now-btn">Apply Now</Link>
              )}
            </div>
          </div>

          <div className="job-content-grid">
            <div className="main-content">
              <div className="content-section">
                <h4><FaInfoCircle /> Description</h4>
                <p>{job.description}</p>
              </div>

              <div className="content-section">
                <h4><FaTasks /> Responsibilities</h4>
                <p style={{ whiteSpace: 'pre-line' }}>{job.responsibilities || "No specific responsibilities listed."}</p>
              </div>

              <div className="content-section">
                <h4><FaGraduationCap /> Qualifications</h4>
                <p style={{ whiteSpace: 'pre-line' }}>{job.qualifications || "No specific qualifications listed."}</p>
              </div>
            </div>

            <div className="sidebar-content">
              <div className="sidebar-card">
                <h4>Job Overview</h4>
                <div className="overview-item">
                  <label>Salary</label>
                  <p>
                    <FaMoneyBillWave /> {job.fixedSalary ? (
                      `$${job.fixedSalary}`
                    ) : (
                      `$${job.salaryFrom} - $${job.salaryTo}`
                    )}
                  </p>
                </div>
                <div className="overview-item">
                  <label>Experience Level</label>
                  <p>{job.experienceLevel || "Not specified"}</p>
                </div>
                <div className="overview-item">
                  <label>Company Type</label>
                  <p>{job.companyType || "Not specified"}</p>
                </div>
                <div className="overview-item">
                  <label>Category</label>
                  <p>{job.category}</p>
                </div>
                <div className="overview-item">
                  <label>Location</label>
                  <p>{job.location}</p>
                </div>
              </div>

              {job.techStack && job.techStack.length > 0 && (
                <div className="sidebar-card">
                  <h4>Tech Stack</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                    {job.techStack.map((tech, index) => (
                      <span key={index} style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.benefits && (
                <div className="sidebar-card benefits-card">
                  <h4><FaGift /> Benefits</h4>
                  <p style={{ whiteSpace: 'pre-line' }}>{job.benefits}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JobDetails;
