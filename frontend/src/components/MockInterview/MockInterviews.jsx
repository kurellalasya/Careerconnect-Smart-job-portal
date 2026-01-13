import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Context } from "../../main";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlay, FaHistory, FaRobot, FaCheckCircle, FaUserFriends, FaSignal, FaPaperPlane } from "react-icons/fa";

const MockInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [category, setCategory] = useState("");
  const [interviewType, setInterviewType] = useState("General");
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const { isAuthorized, user, socket } = useContext(Context);
  const navigateTo = useNavigate();

  const fetchInterviews = async () => {
    try {
      const { data } = await axios.get("http://localhost:4000/api/v1/mock/my", {
        withCredentials: true,
      });
      setInterviews(data.interviews);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data } = await axios.get("http://localhost:4000/api/v1/user/available-job-seekers", {
        withCredentials: true,
      });
      setAvailableUsers(data.users);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!isAuthorized || (user && user.role === "Employer")) {
      navigateTo("/");
    } else {
      fetchInterviews();
      fetchAvailableUsers();
      setIsAvailable(user.isAvailableForMockInterview);
    }
  }, [isAuthorized, user]);

  useEffect(() => {
    if (!socket) return;

    const handleRequestReceived = ({ senderId, senderName }) => {
      toast((t) => (
        <span>
          <b>{senderName}</b> wants to connect for a mock interview!
          <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
            <button 
              onClick={() => {
                handleAcceptRequest(senderId, senderName);
                toast.dismiss(t.id);
              }}
              style={{ background: "#2d5649", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
            >
              Accept
            </button>
            <button 
              onClick={() => toast.dismiss(t.id)}
              style={{ background: "#ef4444", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
            >
              Decline
            </button>
          </div>
        </span>
      ), { duration: 10000 });
    };

    const handleRequestAccepted = ({ receiverName }) => {
      toast.success(`${receiverName} accepted your request! Starting session...`);
    };

    const handleNavigation = (interviewId) => {
      navigateTo(`/mock-interview/${interviewId}`);
    };

    socket.on("interview-request-received", handleRequestReceived);
    socket.on("interview-request-accepted", handleRequestAccepted);
    socket.on("navigate-to-interview", handleNavigation);

    return () => {
      socket.off("interview-request-received", handleRequestReceived);
      socket.off("interview-request-accepted", handleRequestAccepted);
      socket.off("navigate-to-interview", handleNavigation);
    };
  }, [socket, navigateTo]);

  const handleToggleAvailability = async () => {
    try {
      const { data } = await axios.put("http://localhost:4000/api/v1/user/availability", {}, {
        withCredentials: true,
      });
      setIsAvailable(data.isAvailableForMockInterview);
      toast.success(data.message);
      fetchAvailableUsers();
    } catch (error) {
      toast.error("Failed to update availability");
    }
  };

  const handleSendRequest = (receiverId) => {
    if (!socket) return toast.error("Socket not connected");
    socket.emit("send-interview-request", {
      senderId: user._id,
      senderName: user.name,
      receiverId
    });
    toast.success("Interview request sent!");
  };

  const handleAcceptRequest = async (senderId, senderName) => {
    if (!socket) return toast.error("Socket not connected");
    
    setLoading(true);
    try {
      // Create a peer interview session
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/mock/start-peer",
        { 
          category: "Full Stack Development", // Default or ask user
          interviewType: "General",
          interviewerId: senderId 
        },
        { withCredentials: true }
      );

      socket.emit("accept-interview-request", {
        senderId,
        interviewId: data.mockInterview._id
      });

      toast.success("Connecting...");
    } catch (error) {
      toast.error("Failed to start peer interview");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!category) return toast.error("Please select a category");
    setLoading(true);
    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/mock/start",
        { category, interviewType },
        { withCredentials: true }
      );
      toast.success("Interview started!");
      navigateTo(`/mock-interview/${data.mockInterview._id}`);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="jobs page">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1><FaRobot /> AI Mock Interviews</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", background: "#f8fafc", padding: "10px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>Peer Interview Status</span>
              <span style={{ fontSize: "0.9rem", color: isAvailable ? "#22c55e" : "#ef4444", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px" }}>
                <FaSignal /> {isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
            <button 
              onClick={handleToggleAvailability}
              className="view-btn" 
              style={{ padding: "6px 15px", fontSize: "0.8rem", background: isAvailable ? "#ef4444" : "#2d5649" }}
            >
              {isAvailable ? "Go Offline" : "Go Online"}
            </button>
          </div>
        </div>
        <p style={{ color: "#64748b", marginBottom: "30px" }}>
          Practice your interview skills with our AI-powered mock assessments.
        </p>

        <div className="searchBar" style={{ marginBottom: "40px" }}>
          <form onSubmit={handleStartInterview} style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
            <select
              className="searchInput"
              style={{ margin: 0, flex: "1 1 200px" }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select Job Category</option>
              <option value="Frontend Web Development">Frontend Web Development</option>
              <option value="Backend Web Development">Backend Web Development</option>
              <option value="Full Stack Development">Full Stack Development</option>
              <option value="Mobile App Development">Mobile App Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="UI/UX Design">UI/UX Design</option>
            </select>
            <select
              className="searchInput"
              style={{ margin: 0, flex: "1 1 200px" }}
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              required
            >
              <option value="General">General Interview</option>
              <option value="DSA">DSA / Coding Round</option>
            </select>
            <button type="submit" className="view-btn" style={{ flex: "1 1 200px" }} disabled={loading}>
              {loading ? "Generating..." : <><FaPlay /> Start New Interview</>}
            </button>
          </form>
        </div>

        <div style={{ marginBottom: "50px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <FaUserFriends style={{ color: "#2d5649" }} /> Online Job Seekers
          </h2>
          <div className="grid">
            {availableUsers.length > 0 ? (
              availableUsers.map((u) => (
                <div className="jobCard" key={u._id} style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{u.name}</h3>
                      <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "5px" }}>{u.skills?.slice(0, 3).join(", ")}</p>
                    </div>
                    <span className="badge accepted" style={{ fontSize: "0.7rem" }}>Online</span>
                  </div>
                  <div style={{ marginTop: "15px" }}>
                    <button 
                      onClick={() => handleSendRequest(u._id)}
                      className="view-btn" 
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                      <FaPaperPlane /> Request Interview
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #e2e8f0" }}>
                <FaUserFriends style={{ fontSize: "2rem", color: "#cbd5e1", marginBottom: "10px" }} />
                <p style={{ color: "#64748b" }}>No other job seekers are currently available for mock interviews.</p>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Try toggling your availability to let others find you!</p>
              </div>
            )}
          </div>
        </div>

        <h2><FaHistory /> Your Interview History</h2>
        <div className="grid" style={{ marginTop: "20px" }}>
          {interviews.length > 0 ? (
            interviews.map((interview) => (
              <div className="jobCard" key={interview._id}>
                <div className="card-header">
                  <div className="company-logo"><FaRobot /></div>
                  <span className={`badge ${interview.status === "Completed" ? "accepted" : "applied"}`}>
                    {interview.status}
                  </span>
                </div>
                <h3>{interview.category} ({interview.interviewType})</h3>
                <div className="company-info">
                  <span><FaCheckCircle /> Score: {interview.overallScore}%</span>
                  <span>•</span>
                  <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="card-footer">
                  <Link to={`/mock-interview/${interview._id}`} className="view-btn">
                    {interview.status === "Completed" ? "View Results" : "Continue"}
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p>No interview history found.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default MockInterviews;
