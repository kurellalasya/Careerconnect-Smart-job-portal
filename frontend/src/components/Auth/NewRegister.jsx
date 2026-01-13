import React, { useContext, useState, useEffect } from "react";
import { FaRegUser, FaPencilAlt } from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";

const NewRegister = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const { isAuthorized } = useContext(Context);

  useEffect(() => {
    if (!isAuthorized) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("");
    }
  }, [isAuthorized]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const passwordPolicy = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>\/?`~]).{8,}$/;
    if (!passwordPolicy.test(password)) {
      toast.error("Password must be at least 8 characters and include an uppercase letter, a number, and a special character.");
      return;
    }
    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/user/register",
        { name, email, role, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success(data.message || "Registration successful!");
      navigate("/verify-email", { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  if (isAuthorized) {
    return <Navigate to={'/'} />
  }

  return (
    <section className="authPage" style={{ 
      background: "url('/heroS.jpg') center/cover no-repeat", 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "20px",
      position: "relative"
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.7)",
        zIndex: 1
      }}></div>
      <div className="container" style={{ 
        background: "rgba(255, 255, 255, 0.92)", 
        padding: "30px 35px", 
        borderRadius: "20px", 
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)", 
        maxWidth: "400px", 
        width: "90%",
        backdropFilter: "blur(10px)",
        zIndex: 2,
        border: "1px solid rgba(255, 255, 255, 0.4)",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        <div className="header" style={{ textAlign: "center", marginBottom: "25px" }}>
          <img src="/careerconnect-white.png" alt="logo" style={{ width: "150px", marginBottom: "15px", filter: "invert(1) brightness(0.2)" }} />
          <h3 style={{ fontSize: "24px", color: "#0f172a", fontWeight: "800", marginBottom: "8px", letterSpacing: "-0.5px" }}>Join CareerConnect</h3>
          <p style={{ color: "#475569", fontSize: "14px", fontWeight: "500" }}>Create your account</p>
        </div>
        <form onSubmit={handleRegister} autoComplete="off">
          <div className="inputTag" style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", color: "#1e293b", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Register As</label>
            <div style={{ position: "relative" }}>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                autoComplete="off"
                style={{ 
                  width: "100%", 
                  padding: "12px 45px 12px 15px", 
                  borderRadius: "10px", 
                  border: "2px solid #e2e8f0", 
                  appearance: "none",
                  fontSize: "14px",
                  transition: "all 0.3s",
                  outline: "none",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  fontWeight: "600",
                  color: "#1e293b"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2d5649";
                  e.target.style.boxShadow = "0 0 0 4px rgba(45, 86, 73, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="">Select Role</option>
                <option value="Employer">Employer</option>
                <option value="Job Seeker">Job Seeker</option>
              </select>
              <FaRegUser style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "18px" }} />
            </div>
          </div>
          <div className="inputTag" style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", color: "#1e293b", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Name</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                style={{ 
                  width: "100%", 
                  padding: "12px 45px 12px 15px", 
                  borderRadius: "10px", 
                  border: "2px solid #e2e8f0",
                  fontSize: "14px",
                  transition: "all 0.3s",
                  outline: "none",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  fontWeight: "600",
                  color: "#1e293b"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2d5649";
                  e.target.style.boxShadow = "0 0 0 4px rgba(45, 86, 73, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
              />
              <FaPencilAlt style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "18px" }} />
            </div>
          </div>
          <div className="inputTag" style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", color: "#1e293b", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                style={{ 
                  width: "100%", 
                  padding: "12px 45px 12px 15px", 
                  borderRadius: "10px", 
                  border: "2px solid #e2e8f0",
                  fontSize: "14px",
                  transition: "all 0.3s",
                  outline: "none",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  fontWeight: "600",
                  color: "#1e293b"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2d5649";
                  e.target.style.boxShadow = "0 0 0 4px rgba(45, 86, 73, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
              />
              <MdOutlineMailOutline style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "18px" }} />
            </div>
          </div>
          <div className="inputTag" style={{ marginBottom: "25px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", color: "#1e293b", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                style={{ 
                  width: "100%", 
                  padding: "12px 45px 12px 15px", 
                  borderRadius: "10px", 
                  border: "2px solid #e2e8f0",
                  fontSize: "14px",
                  transition: "all 0.3s",
                  outline: "none",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  fontWeight: "600",
                  color: "#1e293b"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2d5649";
                  e.target.style.boxShadow = "0 0 0 4px rgba(45, 86, 73, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
              />
              <RiLock2Fill style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "18px" }} />
            </div>
          </div>
          <button type="submit" style={{ 
            width: "100%", 
            padding: "14px", 
            background: "linear-gradient(135deg, #2d5649 0%, #1e3a31 100%)", 
            color: "#fff", 
            border: "none", 
            borderRadius: "10px", 
            fontSize: "15px", 
            fontWeight: "800", 
            cursor: "pointer", 
            transition: "all 0.3s ease",
            boxShadow: "0 10px 15px -3px rgba(45, 86, 73, 0.3)",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 20px 25px -5px rgba(45, 86, 73, 0.4)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 10px 15px -3px rgba(45, 86, 73, 0.3)";
          }}
          >
            Create Account
          </button>
          <div style={{ textAlign: "center", marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "15px" }}>
            <span style={{ color: "#64748b", fontSize: "13px", fontWeight: "500" }}>Already have an account? </span>
            <Link to={"/login"} style={{ color: "#2d5649", fontWeight: "800", textDecoration: "none", fontSize: "13px", transition: "color 0.2s" }}
              onMouseOver={(e) => e.target.style.color = "#1e3a31"}
              onMouseOut={(e) => e.target.style.color = "#2d5649"}
            >Sign In</Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default NewRegister;
