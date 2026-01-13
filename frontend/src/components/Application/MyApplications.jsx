import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ResumeModal from "./ResumeModal";

const MyApplications = () => {
  const { user } = useContext(Context);
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeImageUrl, setResumeImageUrl] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [expFilter, setExpFilter] = useState("");

  const { isAuthorized } = useContext(Context);
  const navigateTo = useNavigate();

  useEffect(() => {
    if (!isAuthorized) {
      navigateTo("/");
    }
  }, [isAuthorized, navigateTo]);

  useEffect(() => {
    try {
      if (user && user.role === "Employer") {
        const delayDebounceFn = setTimeout(() => {
          axios
            .get("http://localhost:4000/api/v1/application/employer/getall", {
              params: { skills: skillFilter, experience: expFilter },
              withCredentials: true,
            })
            .then((res) => {
              setApplications(res.data.applications);
            });
        }, 450);
        return () => clearTimeout(delayDebounceFn);
      } else {
        axios
          .get("http://localhost:4000/api/v1/application/jobseeker/getall", {
            withCredentials: true,
          })
          .then((res) => {
            setApplications(res.data.applications);
          });
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }, [isAuthorized, skillFilter, expFilter]);

  if (!isAuthorized) {
    navigateTo("/");
  }

  const deleteApplication = (id) => {
    try {
      axios
        .delete(`http://localhost:4000/api/v1/application/delete/${id}`, {
          withCredentials: true,
        })
        .then((res) => {
          toast.success(res.data.message);
          setApplications((prevApplication) =>
            prevApplication.filter((application) => application._id !== id)
          );
        });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const openModal = (imageUrl) => {
    setResumeImageUrl(imageUrl);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // Group applications by job ID for Employer view
  const groupedApplications = applications.reduce((acc, app) => {
    const jobId = app.job?._id || app.job || "unknown";
    const jobTitle = app.jobTitle || (app.job && app.job.title) || "Unknown Job";
    if (!acc[jobId]) acc[jobId] = { title: jobTitle, apps: [] };
    acc[jobId].apps.push(app);
    return acc;
  }, {});

  return (
    <section className="my_applications page">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "20px" }}>
          <h1 style={{ margin: 0 }}>
            {user && user.role === "Job Seeker"
              ? "My Applications"
              : "Applicant Management"}
          </h1>
          {user && user.role === "Employer" && (
            <div style={{ display: "flex", gap: "15px" }}>
              <input
                type="text"
                className="searchInput"
                placeholder="Filter by skills..."
                style={{ margin: 0, width: "200px" }}
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
              />
              <input
                type="text"
                className="searchInput"
                placeholder="Filter by experience..."
                style={{ margin: 0, width: "200px" }}
                value={expFilter}
                onChange={(e) => setExpFilter(e.target.value)}
              />
            </div>
          )}
        </div>

        {applications.length <= 0 ? (
          <div className="application-card" style={{ textAlign: "center", padding: "50px" }}>
            <h4>No Applications Found</h4>
            <p style={{ color: "#64748b", marginTop: "10px" }}>
              {user && user.role === "Job Seeker"
                ? "You haven't applied to any jobs yet."
                : "No one has applied to your job postings yet."}
            </p>
          </div>
        ) : user && user.role === "Job Seeker" ? (
          <div className="application-grid">
            {applications.map((element) => (
              <JobSeekerCard
                element={element}
                key={element._id}
                deleteApplication={deleteApplication}
                openModal={openModal}
              />
            ))}
          </div>
        ) : (
          <div className="employer-applications">
            {Object.values(groupedApplications).map((group, index) => (
              <div key={index} className="job-group" style={{ marginBottom: "40px" }}>
                <h2 style={{ 
                  fontSize: "1.5rem", 
                  color: "#2d5649", 
                  borderBottom: "2px solid #2d5649", 
                  paddingBottom: "10px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span>💼 {group.title}</span>
                  <span style={{ 
                    fontSize: "0.9rem", 
                    background: "#eaf6f2", 
                    padding: "2px 12px", 
                    borderRadius: "999px",
                    color: "#2d5649",
                    fontWeight: 700
                  }}>
                    {group.apps.length} Applicants
                  </span>
                </h2>
                <div className="application-grid">
                  {group.apps.map((element) => (
                    <EmployerCard
                      element={element}
                      key={element._id}
                      openModal={openModal}
                      onStatusChange={async (id, status, interviewDate, interviewStatus, zoomLink) => {
                        try {
                          const res = await axios.put(
                            `http://localhost:4000/api/v1/application/status/${id}`,
                            { status, interviewDate, interviewStatus, zoomLink },
                            { withCredentials: true }
                          );
                          toast.success(res.data.message);
                          setApplications((prev) =>
                            prev.map((a) => (a._id === id ? res.data.application : a))
                          );
                        } catch (err) {
                          toast.error(err?.response?.data?.message || "Status update failed");
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modalOpen && <ResumeModal imageUrl={resumeImageUrl} onClose={closeModal} />}
    </section>
  );
};

export default MyApplications;

const JobSeekerCard = ({ element, deleteApplication, openModal }) => {
  const getAppliedDate = (el) => {
    if (el.createdAt) return new Date(el.createdAt);
    try {
      const ts = parseInt(el._id.toString().substring(0, 8), 16) * 1000;
      return new Date(ts);
    } catch (e) {
      return null;
    }
  };

  const appliedDate = getAppliedDate(element);
  const statusClass = (element.status || "applied").toLowerCase().replace(/\s+/g, "-");
  const interviewStatusClass = (element.interviewStatus || "pending").toLowerCase();

  return (
    <div className="application-card">
      <div className="card-header">
        <div className="role-info">
          <h3>{element.jobTitle || element.title || "Position"}</h3>
          <p>🏢 {element.companyName || "Company"}</p>
        </div>
        <span className={`status-badge ${statusClass}`}>
          {element.status || "Applied"}
        </span>
      </div>
      <div className="card-body">
        <div className="info-row">
          <span>Applied:</span>
          <span>{appliedDate ? appliedDate.toLocaleDateString() : "-"}</span>
        </div>
        <div className="info-row">
          <span>Location:</span>
          <span>{element.city || "Remote"}</span>
        </div>
        {element.interviewDate && (
          <div className="interview-info" style={{ marginTop: "10px", padding: "10px", background: "#f0fdf4", borderRadius: "8px" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: "bold", color: "#166534" }}>
              🗓️ Interview: {new Date(element.interviewDate).toLocaleString()}
            </p>
            {element.zoomLink && (
              <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem" }}>
                🔗 <a href={element.zoomLink} target="_blank" rel="noreferrer" style={{ color: "#0f766e", fontWeight: "bold" }}>Join Zoom Meeting</a>
              </p>
            )}
            <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "#15803d" }}>
              Status: <span className={`status-badge ${interviewStatusClass}`} style={{ fontSize: "0.7rem", padding: "2px 8px" }}>{element.interviewStatus}</span>
            </p>
          </div>
        )}
      </div>
      <div className="card-footer">
        <div className="resume-link" onClick={() => openModal(element.resume.url)}>
          📄 View My Resume
        </div>
        <button className="delete-btn" onClick={() => deleteApplication(element._id)}>
          Withdraw
        </button>
      </div>
    </div>
  );
};

const EmployerCard = ({ element, openModal, onStatusChange }) => {
  const [interviewDate, setInterviewDate] = useState(element.interviewDate ? element.interviewDate.substring(0, 16) : "");
  const [interviewStatus, setInterviewStatus] = useState(element.interviewStatus || "Pending");
  const [zoomLink, setZoomLink] = useState(element.zoomLink || "");

  useEffect(() => {
    setInterviewDate(element.interviewDate ? element.interviewDate.substring(0, 16) : "");
    setInterviewStatus(element.interviewStatus || "Pending");
    setZoomLink(element.zoomLink || "");
  }, [element]);

  const handleChange = (e) => {
    onStatusChange(element._id, e.target.value, interviewDate, interviewStatus, zoomLink);
  };

  const handleSchedule = () => {
    onStatusChange(element._id, element.status, interviewDate, interviewStatus, zoomLink);
  };

  const statusClass = (element.status || "applied").toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="application-card">
      <div className="card-header">
        <div className="role-info">
          <h3>{element.name}</h3>
          <p>📧 {element.email}</p>
        </div>
        <span className={`status-badge ${statusClass}`}>
          {element.status || "Applied"}
        </span>
      </div>
      <div className="card-body">
        <div className="info-row">
          <span>Phone:</span>
          <span>{element.phone}</span>
        </div>
        <div className="info-row">
          <span>Address:</span>
          <span>{element.address}</span>
        </div>
        <div className="cover-letter">
          <strong>Cover Letter:</strong>
          <p>{element.coverLetter}</p>
        </div>
      </div>
      <div className="card-footer">
        <div className="resume-link" onClick={() => openModal(element.resume.url)}>
          📄 View Resume
        </div>
        <select 
          className="status-select" 
          value={element.status || "Applied"} 
          onChange={handleChange}
        >
          <option value="Applied">Applied</option>
          <option value="In Review">In Review</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      <div className="interview-scheduling" style={{ marginTop: "15px", padding: "15px", background: "#f8fafc", borderRadius: "12px" }}>
        <h4 style={{ fontSize: "0.9rem", marginBottom: "10px" }}>Interview Scheduling</h4>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input 
            type="datetime-local" 
            className="searchInput" 
            style={{ flex: "1 1 150px", margin: 0, fontSize: "0.8rem" }}
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
          />
          <select 
            className="status-select" 
            style={{ flex: "1 1 100px", fontSize: "0.8rem" }}
            value={interviewStatus}
            onChange={(e) => setInterviewStatus(e.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <input 
            type="text" 
            className="searchInput" 
            placeholder="Zoom Link"
            style={{ flex: "1 1 100%", margin: 0, fontSize: "0.8rem" }}
            value={zoomLink}
            onChange={(e) => setZoomLink(e.target.value)}
          />
          <button 
            className="view-btn" 
            style={{ padding: "5px 15px", fontSize: "0.8rem" }}
            onClick={handleSchedule}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};
