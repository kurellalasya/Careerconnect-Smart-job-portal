import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Context } from "../../main";
import { RiChat3Line, RiCloseLine, RiSendPlane2Line } from "react-icons/ri";
import toast from "react-hot-toast";

const Chatbot = () => {
  const { isAuthorized, user } = useContext(Context);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your CareerConnect assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isAuthorized || user.role !== "Job Seeker") {
    return null;
  }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/user/chat",
        { messages: [...messages, userMessage] },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      );

      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        throw new Error(data.message || "Failed to get response");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to get response from AI";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container" style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 1000 }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2d5649 0%, #1e3a31 100%)",
            color: "white",
            border: "none",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
            transition: "transform 0.3s"
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <RiChat3Line />
        </button>
      ) : (
        <div
          style={{
            width: "350px",
            height: "500px",
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid #e2e8f0"
          }}
        >
          <div
            style={{
              padding: "20px",
              background: "linear-gradient(135deg, #2d5649 0%, #1e3a31 100%)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <h4 style={{ margin: 0 }}>CareerConnect AI</h4>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button 
                onClick={() => setMessages([{ role: "assistant", content: "Hi! I'm your CareerConnect assistant. How can I help you today?" }])}
                style={{ 
                  background: "rgba(255,255,255,0.2)", 
                  border: "none", 
                  color: "white", 
                  fontSize: "10px", 
                  padding: "4px 8px", 
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
              <RiCloseLine
                style={{ cursor: "pointer", fontSize: "24px" }}
                onClick={() => setIsOpen(false)}
              />
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              background: "#f8fafc"
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "15px 15px 0 15px" : "15px 15px 15px 0",
                  background: msg.role === "user" ? "#2d5649" : "white",
                  color: msg.role === "user" ? "white" : "#1e293b",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  fontSize: "14px",
                  lineHeight: "1.5"
                }}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", color: "#64748b", fontSize: "12px" }}>
                AI is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={handleSend}
            style={{
              padding: "15px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              gap: "10px"
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: "10px 15px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                outline: "none",
                fontSize: "14px"
              }}
            />
            <button
              type="submit"
              style={{
                background: "#2d5649",
                color: "white",
                border: "none",
                borderRadius: "10px",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <RiSendPlane2Line />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
