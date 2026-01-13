import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const VerifyPending = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("Email not found");
      return;
    }
    setResending(true);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/user/resend-verification",
        { email }
      );
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Resend failed");
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="authPage">
      <div className="container">
        <div className="header">
          <h3>Email Verification Required</h3>
        </div>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: "18px" }}>📧 A verification email has been sent to:</p>
          <p style={{ fontSize: "16px", fontWeight: "bold", margin: "10px 0" }}>{email}</p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Please click the link in the email to verify your account.
          </p>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "20px" }}>
            Link expires in 24 hours.
          </p>
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              marginTop: "30px",
              background: "#0f766e",
              color: "#fff",
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              cursor: resending ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            {resending ? "Sending..." : "Resend Verification Email"}
          </button>
          <p style={{ marginTop: "20px" }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "none",
                border: "none",
                color: "#0f766e",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default VerifyPending;
