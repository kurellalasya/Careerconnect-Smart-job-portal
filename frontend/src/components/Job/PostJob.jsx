import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Context } from "../../main";
import { 
  FaBriefcase, FaBuilding, FaGlobe, FaMapMarkerAlt, FaMoneyBillWave, 
  FaListAlt, FaInfoCircle, FaGraduationCap, FaTasks, FaGift, FaLink, FaUser 
} from "react-icons/fa";

const PostJob = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [fixedSalary, setFixedSalary] = useState("");
  const [salaryType, setSalaryType] = useState("default");
  
  // New fields
  const [jobType, setJobType] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [techStack, setTechStack] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [benefits, setBenefits] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [applicantLimit, setApplicantLimit] = useState(0);

  const { isAuthorized, user } = useContext(Context);

  const handleJobPost = async (e) => {
    e.preventDefault();
    if (salaryType === "Fixed Salary") {
      setSalaryFrom("");
      setSalaryTo("");
    } else if (salaryType === "Ranged Salary") {
      setFixedSalary("");
    } else {
      setSalaryFrom("");
      setSalaryTo("");
      setFixedSalary("");
    }
    const jobData = {
      title,
      description,
      category,
      country,
      city,
      location,
      companyName,
      jobType,
      workMode,
      experienceLevel,
      companyType,
      techStack: techStack.split(",").map(s => s.trim()).filter(s => s !== ""),
      qualifications,
      responsibilities,
      benefits,
      companyWebsite,
      applicantLimit,
    };

    if (salaryType === "Fixed Salary") {
      jobData.fixedSalary = fixedSalary;
    } else {
      jobData.salaryFrom = salaryFrom;
      jobData.salaryTo = salaryTo;
    }

    await axios
      .post(
        "http://localhost:4000/api/v1/job/post",
        jobData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        toast.success(res.data.message);
      })
      .catch((err) => {
        toast.error(err.response.data.message);
      });
  };

  const navigateTo = useNavigate();

  useEffect(() => {
    if (!isAuthorized || (user && user.role !== "Employer")) {
      navigateTo("/");
    }
  }, [isAuthorized, user, navigateTo]);

  return (
    <section className="job_post page">
      <div className="container">
        <div className="post-header">
          <h3>✨ Post a New Job</h3>
          <p>Find your next star employee by providing clear and detailed job information.</p>
        </div>

        <form onSubmit={handleJobPost} className="post-job-form">
          <div className="form-section">
            <h4><FaInfoCircle /> Basic Information</h4>
            <div className="form-grid">
              <div className="input-group">
                <label>Job Title</label>
                <div className="input-wrapper">
                  <FaBriefcase className="input-icon" />
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior React Developer" required />
                </div>
              </div>
              <div className="input-group">
                <label>Company Name</label>
                <div className="input-wrapper">
                  <FaBuilding className="input-icon" />
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Tech Solutions Inc." required />
                </div>
              </div>
              <div className="input-group">
                <label>Category</label>
                <div className="input-wrapper">
                  <FaListAlt className="input-icon" />
                  <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="">Select Category</option>
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
                </div>
              </div>
              <div className="input-group">
                <label>Job Type</label>
                <div className="input-wrapper">
                  <FaBriefcase className="input-icon" />
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)} required>
                    <option value="">Select Job Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Work Mode</label>
                <div className="input-wrapper">
                  <FaBriefcase className="input-icon" />
                  <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} required>
                    <option value="">Select Work Mode</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Company Type</label>
                <div className="input-wrapper">
                  <FaBuilding className="input-icon" />
                  <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} required>
                    <option value="">Select Company Type</option>
                    <option value="Startup">Startup</option>
                    <option value="MNC">MNC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Tech Stack (comma separated)</label>
                <div className="input-wrapper">
                  <FaListAlt className="input-icon" />
                  <input type="text" value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="e.g. React, Node.js, MongoDB" />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4><FaMapMarkerAlt /> Location & Company</h4>
            <div className="form-grid">
              <div className="input-group">
                <label>Country</label>
                <div className="input-wrapper">
                  <FaGlobe className="input-icon" />
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. India" required />
                </div>
              </div>
              <div className="input-group">
                <label>City</label>
                <div className="input-wrapper">
                  <FaMapMarkerAlt className="input-icon" />
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Hyderabad" required />
                </div>
              </div>
              <div className="input-group" style={{ gridColumn: "span 2" }}>
                <label>Full Address / Location</label>
                <div className="input-wrapper">
                  <FaMapMarkerAlt className="input-icon" />
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. HITEC City, Hyderabad" required />
                </div>
              </div>
              <div className="input-group" style={{ gridColumn: "span 2" }}>
                <label>Company Website</label>
                <div className="input-wrapper">
                  <FaLink className="input-icon" />
                  <input type="text" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://example.com" />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4><FaMoneyBillWave /> Salary Details</h4>
            <div className="salary-container">
              <div className="input-group">
                <label>Salary Type</label>
                <select value={salaryType} onChange={(e) => setSalaryType(e.target.value)} required>
                  <option value="default">Select Salary Type</option>
                  <option value="Fixed Salary">Fixed Salary</option>
                  <option value="Ranged Salary">Ranged Salary</option>
                </select>
              </div>
              <div className="salary-inputs">
                {salaryType === "Fixed Salary" ? (
                  <div className="input-group">
                    <label>Fixed Amount (₹)</label>
                    <input type="number" placeholder="e.g. 50000" value={fixedSalary} onChange={(e) => setFixedSalary(e.target.value)} required />
                  </div>
                ) : salaryType === "Ranged Salary" ? (
                  <div className="ranged-inputs">
                    <div className="input-group">
                      <label>From (₹)</label>
                      <input type="number" placeholder="Min" value={salaryFrom} onChange={(e) => setSalaryFrom(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label>To (₹)</label>
                      <input type="number" placeholder="Max" value={salaryTo} onChange={(e) => setSalaryTo(e.target.value)} required />
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "#64748b", fontSize: "0.9rem", fontStyle: "italic" }}>Please select a salary type to enter amounts.</p>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4><FaTasks /> Job Details</h4>
            <div className="form-grid">
              <div className="input-group" style={{ gridColumn: "span 2" }}>
                <label>Applicant Limit (0 for no limit)</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input type="number" value={applicantLimit} onChange={(e) => setApplicantLimit(e.target.value)} placeholder="e.g. 50" />
                </div>
              </div>
              <div className="input-group" style={{ gridColumn: "span 2" }}>
                <label>Experience Level</label>
                <div className="input-wrapper">
                  <FaGraduationCap className="input-icon" />
                  <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} required>
                    <option value="">Select Experience Level</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>
              <div className="input-group" style={{ gridColumn: "span 2" }}>
                <label>Job Description</label>
                <textarea rows="6" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role and expectations..." required />
              </div>
              <div className="input-group" style={{ gridColumn: "span 2" }}>
                <label>Qualifications</label>
                <textarea rows="4" value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="Required education and skills..." required />
              </div>
              <div className="input-group" style={{ gridColumn: "span 2" }}>
                <label>Responsibilities</label>
                <textarea rows="4" value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} placeholder="Key duties and tasks..." required />
              </div>
              <div className="input-group" style={{ gridColumn: "span 2" }}>
                <label>Benefits</label>
                <textarea rows="3" value={benefits} onChange={(e) => setBenefits(e.target.value)} placeholder="Perks, insurance, etc." />
              </div>
            </div>
          </div>

          <button type="submit" className="post-job-btn">🚀 Create Job Posting</button>
        </form>
      </div>
    </section>
  );
};

export default PostJob;
