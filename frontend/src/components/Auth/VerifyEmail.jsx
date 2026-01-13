import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MdOutlineMailOutline } from "react-icons/md";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const email = location.state?.email || "";

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the verification code");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/user/verify-email",
        { email, otp },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      toast.success(res.data.message);
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/user/resend-verification",
        { email }
      );
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Resend failed");
    }
  };

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
          <h3 style={{ fontSize: "24px", color: "#0f172a", fontWeight: "800", marginBottom: "8px", letterSpacing: "-0.5px" }}>Email Verification</h3>
          <p style={{ color: "#475569", fontSize: "14px", fontWeight: "500" }}>Please enter the 6-digit code sent to <br/><strong>{email}</strong></p>
        </div>
        <form onSubmit={handleVerify}>
          <div className="inputTag" style={{ marginBottom: "25px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", color: "#1e293b", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Verification Code</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
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
                  color: "#1e293b",
                  letterSpacing: "2px",
                  textAlign: "center"
                }}
              />
              <MdOutlineMailOutline style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "18px" }} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ 
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
          }}>
            {loading ? "Verifying..." : "Verify Email"}
          </button>
          <div style={{ textAlign: "center", marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "15px" }}>
            <p style={{ color: "#64748b", fontSize: "13px", fontWeight: "500" }}>Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              style={{
                background: "none",
                border: "none",
                color: "#2d5649",
                cursor: "pointer",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "800",
                marginTop: "5px"
              }}
            >
              Resend Code
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default VerifyEmail;
