import React, { useContext, useState, useEffect } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FaUser, FaEnvelope, FaPhone, FaUserTag, FaFilePdf, FaEdit, FaSave, FaTimes, 
  FaMapMarkerAlt, FaLinkedin, FaGithub, FaGlobe, FaGraduationCap, FaBriefcase, FaTools 
} from "react-icons/fa";

const Profile = () => {
  const { user, setUser } = useContext(Context);
  const [editing, setEditing] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  
  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [education, setEducation] = useState([{ institution: "", degree: "", year: "" }]);
  const [experience, setExperience] = useState([{ company: "", role: "", duration: "" }]);
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setSkills(user.skills ? user.skills.join(", ") : "");
      setLinkedin(user.linkedin || "");
      setGithub(user.github || "");
      setPortfolio(user.portfolio || "");
      setEducation(user.education && user.education.length > 0 ? user.education : [{ institution: "", degree: "", year: "" }]);
      setExperience(user.experience && user.experience.length > 0 ? user.experience : [{ company: "", role: "", duration: "" }]);
      
      // Calculate completeness
      const fields = [
        user.name, user.email, user.phone, user.bio, user.location, 
        user.skills?.length > 0, user.resume, user.linkedin, user.github,
        user.education?.length > 0, user.experience?.length > 0
      ];
      const filledFields = fields.filter(f => f && f !== "").length;
      setCompleteness(Math.round((filledFields / fields.length) * 100));
    }
  }, [user]);

  if (!user || !user.name) {
    return (
      <section className="profilePage">
        <div className="container">
          <h2>No profile available</h2>
        </div>
      </section>
    );
  }

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleAddEducation = () => {
    setEducation([...education, { institution: "", degree: "", year: "" }]);
  };

  const handleEducationChange = (index, field, value) => {
    const newEducation = [...education];
    newEducation[index][field] = value;
    setEducation(newEducation);
  };

  const handleAddExperience = () => {
    setExperience([...experience, { company: "", role: "", duration: "" }]);
  };

  const handleExperienceChange = (index, field, value) => {
    const newExperience = [...experience];
    newExperience[index][field] = value;
    setExperience(newExperience);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("bio", bio);
      formData.append("location", location);
      formData.append("skills", skills);
      formData.append("linkedin", linkedin);
      formData.append("github", github);
      formData.append("portfolio", portfolio);
      formData.append("education", JSON.stringify(education));
      formData.append("experience", JSON.stringify(experience));
      
      if (resumeFile) formData.append("resume", resumeFile);

      const { data } = await axios.put(
        "http://localhost:4000/api/v1/user/update",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success(data.message || "Profile updated");
      setUser(data.user);
      setEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  return (
    <section className="profilePage page">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h2 style={{ margin: 0 }}>My Profile</h2>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontWeight: "bold", color: "#2d5649" }}>Profile Completeness: {completeness}%</p>
            <div style={{ width: "200px", height: "10px", background: "#e2e8f0", borderRadius: "5px", marginTop: "5px", overflow: "hidden" }}>
              <div style={{ width: `${completeness}%`, height: "100%", background: "#2d5649", transition: "width 0.5s ease-in-out" }}></div>
            </div>
          </div>
        </div>
        <div className="profileCard">
          {!editing ? (
            <div className="view-mode">
              <div className="profile-header">
                <div className="avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h3>{user.name}</h3>
                  <p className="role-badge">{user.role}</p>
                  {user.location && <p className="location"><FaMapMarkerAlt /> {user.location}</p>}
                </div>
              </div>

              {user.bio && (
                <div className="section bio-section">
                  <h4>About Me</h4>
                  <p>{user.bio}</p>
                </div>
              )}
              
              <div className="info-grid">
                <div className="info-item">
                  <FaEnvelope className="icon" />
                  <div>
                    <label>Email Address</label>
                    <p>{user.email}</p>
                  </div>
                </div>
                <div className="info-item">
                  <FaPhone className="icon" />
                  <div>
                    <label>Phone Number</label>
                    <p>{user.phone || "Not provided"}</p>
                  </div>
                </div>
              </div>

              <div className="section skills-section">
                <h4><FaTools /> Skills</h4>
                {user.skills && user.skills.length > 0 ? (
                  <div className="skills-list">
                    {user.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No skills added yet. Edit your profile to add skills!</p>
                )}
              </div>

              <div className="grid-sections">
                <div className="section">
                  <h4><FaGraduationCap /> Education</h4>
                  {user.education && user.education.length > 0 ? (
                    user.education.map((edu, index) => (
                      <div key={index} className="list-item">
                        <p className="item-title">{edu.degree}</p>
                        <p className="item-subtitle">{edu.institution}</p>
                        <p className="item-date">{edu.year}</p>
                      </div>
                    ))
                  ) : <p className="no-data">No education details added.</p>}
                </div>

                <div className="section">
                  <h4><FaBriefcase /> Experience</h4>
                  {user.experience && user.experience.length > 0 ? (
                    user.experience.map((exp, index) => (
                      <div key={index} className="list-item">
                        <p className="item-title">{exp.role}</p>
                        <p className="item-subtitle">{exp.company}</p>
                        <p className="item-date">{exp.duration}</p>
                      </div>
                    ))
                  ) : <p className="no-data">No experience details added.</p>}
                </div>
              </div>

              <div className="section social-section">
                <h4>Online Presence</h4>
                <div className="social-links">
                  {user.linkedin && <a href={user.linkedin} target="_blank" rel="noreferrer"><FaLinkedin /> LinkedIn</a>}
                  {user.github && <a href={user.github} target="_blank" rel="noreferrer"><FaGithub /> GitHub</a>}
                  {user.portfolio && <a href={user.portfolio} target="_blank" rel="noreferrer"><FaGlobe /> Portfolio</a>}
                </div>
              </div>

              <div className="resume-section">
                <label>Resume / CV</label>
                {user.resume ? (
                  <div className="resume-box">
                    <FaFilePdf className="pdf-icon" />
                    <div className="resume-info">
                      <p>Your uploaded resume</p>
                      <a 
                        href={user.resume.startsWith("http") ? user.resume : `http://localhost:4000${user.resume}`} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        View Document
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="no-resume">No resume uploaded yet.</p>
                )}
              </div>
              
              <button className="edit-btn" onClick={() => setEditing(true)}>
                <FaEdit /> Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="edit-form">
              <h3>Edit Your Profile</h3>
              
              <div className="form-grid">
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <FaUser className="input-icon" />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <div className="input-wrapper">
                    <FaPhone className="input-icon" />
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Location</label>
                  <div className="input-wrapper">
                    <FaMapMarkerAlt className="input-icon" />
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Skills (comma separated)</label>
                  <div className="input-wrapper">
                    <FaTools className="input-icon" />
                    <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node, CSS" />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows="4"></textarea>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>LinkedIn URL</label>
                  <div className="input-wrapper">
                    <FaLinkedin className="input-icon" />
                    <input type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                  </div>
                </div>
                <div className="input-group">
                  <label>GitHub URL</label>
                  <div className="input-wrapper">
                    <FaGithub className="input-icon" />
                    <input type="text" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
                  </div>
                </div>
              </div>

              <div className="dynamic-section">
                <h4>Education</h4>
                {education.map((edu, index) => (
                  <div key={index} className="dynamic-inputs">
                    <input placeholder="Institution" value={edu.institution} onChange={(e) => handleEducationChange(index, "institution", e.target.value)} />
                    <input placeholder="Degree" value={edu.degree} onChange={(e) => handleEducationChange(index, "degree", e.target.value)} />
                    <input placeholder="Year" value={edu.year} onChange={(e) => handleEducationChange(index, "year", e.target.value)} />
                  </div>
                ))}
                <button type="button" className="add-btn" onClick={handleAddEducation}>+ Add Education</button>
              </div>

              <div className="dynamic-section">
                <h4>Experience</h4>
                {experience.map((exp, index) => (
                  <div key={index} className="dynamic-inputs">
                    <input placeholder="Company" value={exp.company} onChange={(e) => handleExperienceChange(index, "company", e.target.value)} />
                    <input placeholder="Role" value={exp.role} onChange={(e) => handleExperienceChange(index, "role", e.target.value)} />
                    <input placeholder="Duration" value={exp.duration} onChange={(e) => handleExperienceChange(index, "duration", e.target.value)} />
                  </div>
                ))}
                <button type="button" className="add-btn" onClick={handleAddExperience}>+ Add Experience</button>
              </div>

              <div className="input-group">
                <label>Update Resume (PDF / DOCX)</label>
                <div className="file-input-wrapper">
                  <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="save-btn"><FaSave /> Save Changes</button>
                <button type="button" className="cancel-btn" onClick={() => setEditing(false)}><FaTimes /> Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Profile;
