import axios from "axios";
import React, { useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Context } from "../../main";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaFileAlt, FaFileUpload, FaCheckCircle } from "react-icons/fa";

const Application = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [resume, setResume] = useState(null);
  const [useProfileResume, setUseProfileResume] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");

  const { isAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState({});

  useEffect(() => {
    if (!isAuthorized || (user && user.role === "Employer")) {
      navigateTo("/");
    }
  }, [isAuthorized, user, navigateTo]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const { data } = await axios.get(`http://localhost:4000/api/v1/job/${id}`, {
          withCredentials: true,
        });
        setJob(data.job);
      } catch (error) {
        console.error("Error fetching job details");
      }
    };
    fetchJobDetails();

    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.location || "");
      
      // Auto-generate a basic cover letter if bio exists
      if (user.bio && !coverLetter) {
        setCoverLetter(`I am writing to express my interest in the ${job.title || 'position'} at ${job.companyName || 'your company'}. \n\n${user.bio}\n\nMy skills include: ${user.skills?.join(", ")}.`);
      }
    }
  }, [id, user, job.title]);

  // Function to handle file input changes with validation
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileError("");
    
    if (!file) {
      setResume(null);
      return;
    }
    
    // Check file type
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Please select a valid file (PDF or DOCX)");
      setResume(null);
      return;
    }
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFileError("File size should be less than 2MB");
      setResume(null);
      return;
    }
    
    setResume(file);
  };

  const handleApplication = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !email || !phone || !address) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (!resume && !useProfileResume) {
      setFileError("Please upload your resume or use profile resume");
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("coverLetter", coverLetter);
    if (resume) formData.append("resume", resume);
    formData.append("jobId", id);
    formData.append("useProfileResume", useProfileResume);

    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/application/post",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setName("");
      setEmail("");
      setCoverLetter("");
      setPhone("");
      setAddress("");
      setResume(null);
      toast.success(data.message);
      navigateTo("/job/getall");
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        "Something went wrong. Please try again later.";
      toast.error(errorMessage);
      
      // Show specific message for Cloudinary errors
      if (errorMessage.includes("Cloudinary") || errorMessage.includes("api_key")) {
        toast.error("File upload service is currently unavailable. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="application page">
      <div className="container">
        <div className="application-header">
          <h3>Apply for this Position</h3>
          {job.title && (
            <div className="job-brief">
              <p className="job-title">{job.title}</p>
              <p className="company-name">{job.companyName}</p>
            </div>
          )}
        </div>

        <div className="application-content">
          <div className="application-info-sidebar">
            <div className="info-card">
              <h4>Application Tips</h4>
              <ul>
                <li><FaCheckCircle className="check-icon" /> Keep your cover letter concise and relevant.</li>
                <li><FaCheckCircle className="check-icon" /> Highlight your skills that match the job description.</li>
                <li><FaCheckCircle className="check-icon" /> Ensure your resume is up to date.</li>
                <li><FaCheckCircle className="check-icon" /> Double check your contact information.</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleApplication} className="application-form">
            <div className="form-section">
              <h4><FaUser /> Personal Information</h4>
              <div className="form-grid">
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <div className="input-wrapper">
                    <FaPhone className="input-icon" />
                    <input
                      type="number"
                      placeholder="1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Current Address</label>
                  <div className="input-wrapper">
                    <FaMapMarkerAlt className="input-icon" />
                    <input
                      type="text"
                      placeholder="City, Country"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4><FaFileAlt /> Cover Letter (Optional)</h4>
              <div className="input-group">
                <textarea
                  placeholder="Explain why you're a good fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows="8"
                />
              </div>
            </div>

            <div className="form-section">
              <h4><FaFileUpload /> Resume / CV</h4>
              
              {user && user.resume && (
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <input 
                    type="checkbox" 
                    id="useProfileResume" 
                    checked={useProfileResume} 
                    onChange={(e) => {
                      setUseProfileResume(e.target.checked);
                      if (e.target.checked) {
                        setResume(null);
                        setFileError("");
                      }
                    }}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <label htmlFor="useProfileResume" style={{ margin: 0, cursor: 'pointer', color: '#166534', fontWeight: 600 }}>
                    Use resume from my profile
                  </label>
                </div>
              )}

              {!useProfileResume && (
                <div className="file-upload-container">
                  <div className={`file-drop-zone ${resume ? 'has-file' : ''}`}>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload">
                      {resume ? (
                        <div className="file-info">
                          <FaFileAlt className="file-icon" />
                          <span>{resume.name}</span>
                        </div>
                      ) : (
                        <div className="upload-prompt">
                          <FaFileUpload className="upload-icon" />
                          <p>Click to upload or drag and drop</p>
                          <span>PDF or DOCX (Max 2MB)</span>
                        </div>
                      )}
                    </label>
                  </div>
                  {fileError && (
                    <p className="error-message">{fileError}</p>
                  )}
                </div>
              )}
              
              {useProfileResume && (
                <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                  <FaCheckCircle style={{ color: '#22c55e', fontSize: '2rem', marginBottom: '10px' }} />
                  <p style={{ fontWeight: 600, color: '#475569' }}>Profile resume will be used for this application</p>
                  <a href={user.resume} target="_blank" rel="noreferrer" style={{ color: '#2d5649', fontSize: '0.9rem', fontWeight: 700 }}>View Profile Resume</a>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="submit-application-btn"
              disabled={loading}
            >
              {loading ? "Submitting Application..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Application;
