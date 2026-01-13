import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FaUsers, FaBriefcase, FaFileAlt, FaUserShield, FaTrash, FaCheck, FaTimes, FaChartLine } from "react-icons/fa";

const AdminDashboard = () => {
  const { isAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthorized || (user && user.role && user.role.toLowerCase() !== "admin")) {
      navigateTo("/");
      return;
    }
    fetchData();
  }, [isAuthorized, user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "stats") {
        const { data } = await axios.get("http://localhost:4000/api/v1/user/admin/stats", { withCredentials: true });
        setStats(data.stats);
      } else if (activeTab === "users") {
        const { data } = await axios.get("http://localhost:4000/api/v1/user/admin/users", { withCredentials: true });
        setUsers(data.users);
      } else if (activeTab === "jobs") {
        const { data } = await axios.get("http://localhost:4000/api/v1/job/admin/jobs", { withCredentials: true });
        setJobs(data.jobs);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:4000/api/v1/user/admin/user/status/${id}`, { status }, { withCredentials: true });
      toast.success(`User status updated to ${status}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/v1/user/admin/user/${id}`, { withCredentials: true });
      toast.success("User deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleUpdateJobStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:4000/api/v1/job/admin/job/status/${id}`, { status }, { withCredentials: true });
      toast.success(`Job status updated to ${status}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/v1/job/admin/job/${id}`, { withCredentials: true });
      toast.success("Job deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  if (loading && !stats && !users.length && !jobs.length) return <div className="page">Loading...</div>;

  return (
    <section className="jobs page" style={{ background: "#f1f5f9", minHeight: "100vh", padding: "0" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <div style={{ 
          width: "280px", 
          background: "#0f172a", 
          padding: "40px 20px", 
          display: "flex", 
          flexDirection: "column", 
          gap: "30px",
          position: "fixed",
          top: "80px",
          height: "calc(100vh - 80px)",
          zIndex: 10,
          overflowY: "auto"
        }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: "800", margin: 0 }}>Admin Panel</h2>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "5px" }}>CareerConnect Management</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button 
              onClick={() => setActiveTab("stats")}
              style={{ 
                padding: "14px 20px", 
                borderRadius: "12px", 
                border: "none", 
                background: activeTab === "stats" ? "#2d5649" : "transparent",
                color: activeTab === "stats" ? "#fff" : "#94a3b8",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.3s ease",
                textAlign: "left",
                fontSize: "0.95rem"
              }}
            >
              <FaChartLine /> Overview
            </button>
            <button 
              onClick={() => setActiveTab("users")}
              style={{ 
                padding: "14px 20px", 
                borderRadius: "12px", 
                border: "none", 
                background: activeTab === "users" ? "#2d5649" : "transparent",
                color: activeTab === "users" ? "#fff" : "#94a3b8",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.3s ease",
                textAlign: "left",
                fontSize: "0.95rem"
              }}
            >
              <FaUsers /> User Management
            </button>
            <button 
              onClick={() => setActiveTab("jobs")}
              style={{ 
                padding: "14px 20px", 
                borderRadius: "12px", 
                border: "none", 
                background: activeTab === "jobs" ? "#2d5649" : "transparent",
                color: activeTab === "jobs" ? "#fff" : "#94a3b8",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.3s ease",
                textAlign: "left",
                fontSize: "0.95rem"
              }}
            >
              <FaBriefcase /> Job Moderation
            </button>
          </div>

          <div style={{ marginTop: "auto", padding: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }}></div>
              <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "600" }}>System Online</span>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.75rem", margin: 0 }}>v1.0.4 Stable Build</p>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, marginLeft: "280px", padding: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              {activeTab === "stats" ? "Dashboard Overview" : activeTab === "users" ? "User Management" : "Job Moderation"}
            </h1>
            <div style={{ color: "#64748b", fontWeight: "600" }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

        {activeTab === "stats" && stats && (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "25px" }}>
            <div className="jobCard" style={{ textAlign: "center", padding: "30px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
              <div style={{ width: "60px", height: "60px", background: "rgba(45, 86, 73, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <FaUsers style={{ fontSize: "1.8rem", color: "#2d5649" }} />
              </div>
              <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "0 0 5px 0" }}>{stats.totalUsers}</h3>
              <p style={{ color: "#64748b", fontWeight: "600", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Users</p>
            </div>
            <div className="jobCard" style={{ textAlign: "center", padding: "30px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
              <div style={{ width: "60px", height: "60px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <FaUserShield style={{ fontSize: "1.8rem", color: "#3b82f6" }} />
              </div>
              <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "0 0 5px 0" }}>{stats.totalEmployers}</h3>
              <p style={{ color: "#64748b", fontWeight: "600", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Employers</p>
            </div>
            <div className="jobCard" style={{ textAlign: "center", padding: "30px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
              <div style={{ width: "60px", height: "60px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <FaUsers style={{ fontSize: "1.8rem", color: "#10b981" }} />
              </div>
              <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "0 0 5px 0" }}>{stats.totalJobSeekers}</h3>
              <p style={{ color: "#64748b", fontWeight: "600", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Job Seekers</p>
            </div>
            <div className="jobCard" style={{ textAlign: "center", padding: "30px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
              <div style={{ width: "60px", height: "60px", background: "rgba(245, 158, 11, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <FaBriefcase style={{ fontSize: "1.8rem", color: "#f59e0b" }} />
              </div>
              <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "0 0 5px 0" }}>{stats.totalJobs}</h3>
              <p style={{ color: "#64748b", fontWeight: "600", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Jobs</p>
            </div>
            <div className="jobCard" style={{ textAlign: "center", padding: "30px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
              <div style={{ width: "60px", height: "60px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <FaFileAlt style={{ fontSize: "1.8rem", color: "#ef4444" }} />
              </div>
              <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "0 0 5px 0" }}>{stats.totalApplications}</h3>
              <p style={{ color: "#64748b", fontWeight: "600", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Applications</p>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
            {users.map(u => (
              <div className="jobCard" key={u._id} style={{ maxWidth: "100%", marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{u.name}</h3>
                    <p style={{ margin: "5px 0", color: "#666" }}>{u.email} | {u.role}</p>
                    <span className={`badge ${u.status === "Active" ? "accepted" : u.status === "Blocked" ? "rejected" : "applied"}`} style={{ background: u.status === "Active" ? "#dcfce7" : u.status === "Blocked" ? "#fee2e2" : "#dbeafe" }}>
                      {u.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {u.status !== "Active" && (
                      <button onClick={() => handleUpdateUserStatus(u._id, "Active")} className="save-btn" style={{ background: "#dcfce7", color: "#166534" }}><FaCheck /> Unblock</button>
                    )}
                    {u.status !== "Blocked" && (
                      <button onClick={() => handleUpdateUserStatus(u._id, "Blocked")} className="save-btn" style={{ background: "#fee2e2", color: "#991b1b" }}><FaTimes /> Block</button>
                    )}
                    <button onClick={() => handleDeleteUser(u._id)} className="delete-btn"><FaTrash /> Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
            {jobs.map(j => (
              <div className="jobCard" key={j._id} style={{ maxWidth: "100%", marginBottom: "15px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>{j.title}</h3>
                    <p style={{ margin: "5px 0", color: "#64748b", fontSize: "0.9rem" }}>{j.companyName} | {j.location}</p>
                    <span className={`badge ${j.status === "Approved" ? "accepted" : j.status === "Rejected" ? "rejected" : "applied"}`} style={{ background: j.status === "Approved" ? "#dcfce7" : j.status === "Rejected" ? "#fee2e2" : "#dbeafe", fontSize: "0.75rem" }}>
                      {j.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {j.status !== "Approved" && (
                      <button onClick={() => handleUpdateJobStatus(j._id, "Approved")} className="save-btn" style={{ background: "#dcfce7", color: "#166534", padding: "8px 16px", fontSize: "0.85rem" }}><FaCheck /> Approve</button>
                    )}
                    {j.status !== "Rejected" && (
                      <button onClick={() => handleUpdateJobStatus(j._id, "Rejected")} className="save-btn" style={{ background: "#fee2e2", color: "#991b1b", padding: "8px 16px", fontSize: "0.85rem" }}><FaTimes /> Reject</button>
                    )}
                    <button onClick={() => handleDeleteJob(j._id)} className="delete-btn" style={{ padding: "8px 16px", fontSize: "0.85rem" }}><FaTrash /> Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;
