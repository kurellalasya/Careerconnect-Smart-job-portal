import React, { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { Context } from "../../main";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaRobot, FaPaperPlane, FaCheckCircle, FaInfoCircle, FaCode, FaExpand, FaVideo, FaMicrophone, FaDesktop, FaComments, FaTerminal, FaUser, FaPlay } from "react-icons/fa";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import Peer from "peerjs";

const MockInterviewSession = () => {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [code, setCode] = useState("// Write your code here...");
  const [language, setLanguage] = useState("javascript");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [remoteStream, setRemoteStream] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [viewMode, setViewMode] = useState("editor"); // "editor" or "video"
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [userFeedback, setUserFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const { isAuthorized, user, socket } = useContext(Context);
  const navigateTo = useNavigate();

  const socketRef = useRef();
  const peerRef = useRef();
  const myMainVideoRef = useRef();
  const mySideVideoRef = useRef();
  const remoteMainVideoRef = useRef();
  const remoteSideVideoRef = useRef();

  const isFinished = interview?.status === "Completed";

  const stopAllMedia = () => {
    // Stop local camera & mic
    if (myStream) {
      myStream.getTracks().forEach((track) => {
        track.stop();
      });
      setMyStream(null);
    }

    // Stop remote stream reference
    if (remoteStream) {
      remoteStream.getTracks?.().forEach((track) => track.stop());
      setRemoteStream(null);
    }

    // Close all PeerJS connections
    if (peerRef.current) {
      Object.values(peerRef.current.connections || {}).forEach((connList) => {
        connList.forEach((conn) => {
          conn.close();
        });
      });
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Don't disconnect global socket
    if (socketRef.current) {
      socketRef.current.off("code-update");
      socketRef.current.off("receive-message");
      socketRef.current.off("user-connected");
    }

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const fetchInterviewDetails = async () => {
    try {
      const { data } = await axios.get(`http://localhost:4000/api/v1/mock/${id}`, {
        withCredentials: true,
      });
      const interviewData = data.mockInterview || data.interview;
      setInterview(interviewData);

      const firstUnanswered = interviewData?.questions?.findIndex((q) => !q.answer && !q.code);
      if (firstUnanswered !== -1 && firstUnanswered !== undefined) {
        setCurrentQuestionIndex(firstUnanswered);
        if (interviewData.interviewType === "DSA") {
          setCode(interviewData.questions[firstUnanswered].code || "// Write your code here...");
          setLanguage(interviewData.questions[firstUnanswered].language || "javascript");
        } else {
          setAnswer(interviewData.questions[firstUnanswered].answer || "");
        }
      } else {
        setCurrentQuestionIndex(Math.max(0, (interviewData?.questions?.length || 1) - 1));
      }
    } catch (error) {
      console.log(error);
      navigateTo("/mock-interviews");
    }
  };

  useEffect(() => {
    if (!isAuthorized || (user && user.role === "Employer")) {
      navigateTo("/");
      return;
    }
    fetchInterviewDetails();

    if (!socket) return;
    socketRef.current = socket;

    socketRef.current.on("code-update", (data) => {
      const newCode = typeof data === "string" ? data : data.code;
      if (newCode !== undefined) setCode(newCode);
    });

    socketRef.current.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (peerId) => {
      socketRef.current.emit("join-interview", { interviewId: id, peerId });
    });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setMyStream(stream);
      
      peer.on("call", (call) => {
        call.answer(stream);
        call.on("stream", (userRemoteStream) => {
          setRemoteStream(userRemoteStream);
        });
      });

      socketRef.current.on("user-connected", ({ peerId, userId }) => {
        const call = peer.call(peerId, stream);
        call.on("stream", (userRemoteStream) => {
          setRemoteStream(userRemoteStream);
        });
      });
    }).catch(err => {
      console.error("Failed to get local stream", err);
      toast.error("Could not access camera/microphone");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("code-update");
        socketRef.current.off("receive-message");
        socketRef.current.off("user-connected");
      }
      stopAllMedia();
    };
  }, [isAuthorized, user, id, socket]);

  useEffect(() => {
    if (interview?.status === "Completed") {
      stopAllMedia();
    }
  }, [interview?.status]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, interview, isFinished]);


  useEffect(() => {
    if (myStream) {
      if (myMainVideoRef.current) myMainVideoRef.current.srcObject = myStream;
      if (mySideVideoRef.current) mySideVideoRef.current.srcObject = myStream;
    }
  }, [myStream, viewMode]);

  useEffect(() => {
    if (remoteStream) {
      if (remoteMainVideoRef.current) remoteMainVideoRef.current.srcObject = remoteStream;
      if (remoteSideVideoRef.current) remoteSideVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, viewMode]);

  const toggleMic = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOn(videoTrack.enabled);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleRunCode = async () => {
    if (!code) return toast.error("Please write some code first");
    setIsRunning(true);
    setOutput("Compiling and running...");
    setTestResults([]);

    const langMapping = {
      javascript: { language: "javascript", version: "18.15.0" },
      python: { language: "python", version: "3.10.0" },
      cpp: { language: "cpp", version: "10.2.0" },
      java: { language: "java", version: "15.0.2" },
    };

    const selectedLang = langMapping[language] || langMapping.javascript;
    const currentQuestion = interview?.questions?.[currentQuestionIndex];
    const testCases = currentQuestion?.testCases || [];
    
    try {
      const results = [];
      let allPassed = true;

      // Run against each test case (limit to first 3 for performance in "Run")
      const casesToRun = testCases.filter(tc => !tc.isHidden).slice(0, 3);
      
      if (casesToRun.length === 0) {
        // Fallback if no test cases defined
        const { data } = await axios.post("https://emkc.org/api/v2/piston/execute", {
          language: selectedLang.language,
          version: selectedLang.version,
          files: [{ content: code }],
        });
        setOutput(data.run.output || data.run.stderr || "No output");
      } else {
        for (const tc of casesToRun) {
          const { data } = await axios.post("https://emkc.org/api/v2/piston/execute", {
            language: selectedLang.language,
            version: selectedLang.version,
            files: [{ content: code }],
            stdin: tc.input,
          });

          const actualOutput = data.run.output.trim();
          const passed = actualOutput === tc.expectedOutput.trim();
          if (!passed) allPassed = false;

          results.push({
            input: tc.input,
            expected: tc.expectedOutput,
            actual: actualOutput,
            passed,
            error: data.run.stderr
          });
        }
        setTestResults(results);
        setOutput(allPassed ? "✅ All sample test cases passed!" : "❌ Some test cases failed.");
      }
    } catch (error) {
      console.error(error);
      setOutput("Error: Could not connect to code execution server.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (myMainVideoRef.current) myMainVideoRef.current.srcObject = screenStream;
      if (mySideVideoRef.current) mySideVideoRef.current.srcObject = screenStream;

      const videoTrack = screenStream.getVideoTracks()[0];
      
      // Replace track in all outgoing calls
      if (peerRef.current) {
        Object.values(peerRef.current.connections).forEach(connList => {
          connList.forEach(conn => {
            if (conn.peerConnection) {
              const sender = conn.peerConnection.getSenders().find(s => s.track.kind === "video");
              if (sender) sender.replaceTrack(videoTrack);
            }
          });
        });
      }

      videoTrack.onended = () => {
        if (myStream) {
          const originalVideoTrack = myStream.getVideoTracks()[0];
          if (myMainVideoRef.current) myMainVideoRef.current.srcObject = myStream;
          if (mySideVideoRef.current) mySideVideoRef.current.srcObject = myStream;
          if (peerRef.current) {
            Object.values(peerRef.current.connections).forEach(connList => {
              connList.forEach(conn => {
                if (conn.peerConnection) {
                  const sender = conn.peerConnection.getSenders().find(s => s.track.kind === "video");
                  if (sender) sender.replaceTrack(originalVideoTrack);
                }
              });
            });
          }
        }
      };

      toast.success("Screen sharing started");
    } catch (err) {
      console.error(err);
      toast.error("Failed to share screen");
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage) return;
    socketRef.current.emit("send-message", { interviewId: id, message: newMessage, sender: user.name });
    setNewMessage("");
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (interview.interviewType !== "DSA" && !answer) return toast.error("Please provide an answer");
    if (interview.interviewType === "DSA" && !code) return toast.error("Please provide code");
    
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:4000/api/v1/mock/submit",
        {
          interviewId: id,
          questionId: interview?.questions?.[currentQuestionIndex]?._id,
          answer: interview.interviewType === "DSA" ? "Code submitted" : answer,
          code: interview.interviewType === "DSA" ? code : undefined,
          language: interview.interviewType === "DSA" ? language : undefined,
        },
        { withCredentials: true }
      );
      toast.success("Answer submitted!");
      
      // Move to next question if available
      if (currentQuestionIndex < interview.questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        const nextQ = interview.questions[nextIndex];
        if (interview.interviewType === "DSA") {
          setCode(nextQ.code || "// Write your code here...");
          setLanguage(nextQ.language || "javascript");
        } else {
          setAnswer(nextQ.answer || "");
        }
      }
      
      fetchInterviewDetails();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishInterview = async () => {
    try {
      await axios.post(
        "http://localhost:4000/api/v1/mock/finish",
        { interviewId: id },
        { withCredentials: true }
      );

      // HARD STOP EVERYTHING
      stopAllMedia();

      toast.success("Interview finished!");
      navigateTo("/mock-interviews");
    } catch (err) {
      toast.error("Failed to finish interview");
    }
  };

  if (!interview) return <div className="page">Loading...</div>;

  return (
    <section className={`jobs page ${isFullScreen ? "full-screen-mode" : ""}`} style={{ padding: 0, background: "#1a1a1a" }}>
      <div className="container" style={{ maxWidth: "100%", padding: "0", margin: "0" }}>
        {/* Top Navigation Bar (HackerRank Style) */}
        <div style={{ height: "50px", background: "#0e141e", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", borderBottom: "1px solid #323e4f" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <img src="/careerconnect-white.png" alt="Logo" style={{ height: "25px" }} />
            <div style={{ color: "#fff", fontWeight: "600", fontSize: "0.9rem", borderLeft: "1px solid #323e4f", paddingLeft: "20px" }}>
              {interview.title} | {interview.interviewType} Interview
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ color: timeLeft < 300 ? "#ff4d4d" : "#00ff41", fontWeight: "700", fontSize: "1rem", background: "rgba(0,0,0,0.3)", padding: "4px 12px", borderRadius: "4px", fontFamily: "monospace" }}>
              {formatTime(timeLeft)}
            </div>
            <button 
              onClick={() => setViewMode(viewMode === "editor" ? "video" : "editor")}
              style={{ background: "#323e4f", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}
            >
              {viewMode === "editor" ? <><FaVideo /> Video Mode</> : <><FaCode /> Editor Mode</>}
            </button>
            <button className="view-btn" style={{ padding: "6px 15px", fontSize: "0.8rem" }} onClick={handleFinishInterview} disabled={loading || isFinished}>
              {loading ? "Submitting..." : "Finish Interview"}
            </button>
          </div>
        </div>

        <div 
          className="interview-layout" 
          style={{ 
            height: "calc(100vh - 110px)", 
            gridTemplateColumns: viewMode === "editor" ? `${interview.interviewType === "DSA" ? "400px" : "350px"} 1fr ${showSidePanel ? "300px" : "0px"}` : "1fr",
            background: "#f3f7f7",
            position: "relative"
          }}
        >
          {viewMode === "video" ? (
            /* Zoom-like Video Grid */
            <div style={{ height: "100%", background: "#1a1a1a", display: "grid", gridTemplateColumns: remoteStream ? "1fr 1fr" : "1fr", gap: "20px", padding: "20px" }}>
            <div style={{ position: "relative", background: "#2d2d2d", borderRadius: "12px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <video ref={myMainVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                {!isCamOn && <div style={{ position: "absolute", inset: 0, background: "#2d2d2d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "3rem" }}><FaUser /></div>}
                <div style={{ position: "absolute", bottom: "20px", left: "20px", color: "#fff", background: "rgba(0,0,0,0.6)", padding: "5px 15px", borderRadius: "20px", fontSize: "0.9rem" }}>You {isMicOn ? "" : "(Muted)"}</div>
              </div>
              {remoteStream ? (
                <div style={{ position: "relative", background: "#2d2d2d", borderRadius: "12px", overflow: "hidden" }}>
                  <video ref={remoteMainVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", bottom: "20px", left: "20px", color: "#fff", background: "rgba(0,0,0,0.6)", padding: "5px 15px", borderRadius: "20px", fontSize: "0.9rem" }}>Interviewer</div>
                </div>
              ) : (
                <div style={{ background: "#2d2d2d", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "#3e3e3e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", marginBottom: "20px" }}>
                    <FaUser />
                  </div>
                  <h3>Waiting for interviewer to join...</h3>
                  <p style={{ color: "#888" }}>The interview will start as soon as the interviewer connects.</p>
                </div>
              )}
            </div>
          ) : (
            <>
          {/* Left Panel: Problem Statement */}
          <div className="problem-panel" style={{ borderRight: "2px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
              <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaRobot style={{ color: "#2d5649" }} /> Problem Description
              </h2>
              <div style={{ fontSize: "0.9rem", fontWeight: "700", color: timeLeft < 300 ? "#ef4444" : "#2d5649", background: "#f1f5f9", padding: "4px 10px", borderRadius: "20px" }}>
                ⏱️ {formatTime(timeLeft)}
              </div>
            </div>
            
            {!isFinished ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span className="badge" style={{ background: "#e2e8f0", color: "#475569" }}>Question {currentQuestionIndex + 1} of {interview?.questions?.length}</span>
                    <span className="badge" style={{ background: "#dcfce7", color: "#166534" }}>Easy</span>
                  </div>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button 
                      disabled={currentQuestionIndex === 0}
                      onClick={() => {
                        const prevIndex = currentQuestionIndex - 1;
                        setCurrentQuestionIndex(prevIndex);
                        const prevQ = interview.questions[prevIndex];
                        if (interview.interviewType === "DSA") {
                          setCode(prevQ.code || "// Write your code here...");
                          setLanguage(prevQ.language || "javascript");
                        } else {
                          setAnswer(prevQ.answer || "");
                        }
                      }}
                      style={{ padding: "2px 8px", fontSize: "0.7rem", background: "#e2e8f0", border: "none", borderRadius: "4px", cursor: currentQuestionIndex === 0 ? "not-allowed" : "pointer" }}
                    >
                      Prev
                    </button>
                    <button 
                      disabled={currentQuestionIndex === (interview?.questions?.length || 1) - 1}
                      onClick={() => {
                        const nextIndex = currentQuestionIndex + 1;
                        setCurrentQuestionIndex(nextIndex);
                        const nextQ = interview.questions[nextIndex];
                        if (interview.interviewType === "DSA") {
                          setCode(nextQ.code || "// Write your code here...");
                          setLanguage(nextQ.language || "javascript");
                        } else {
                          setAnswer(nextQ.answer || "");
                        }
                      }}
                      style={{ padding: "2px 8px", fontSize: "0.7rem", background: "#e2e8f0", border: "none", borderRadius: "4px", cursor: currentQuestionIndex === (interview?.questions?.length || 1) - 1 ? "not-allowed" : "pointer" }}
                    >
                      Next
                    </button>
                  </div>
                </div>
                <h3 style={{ marginTop: "0", fontSize: "1.4rem", color: "#0f172a", fontWeight: "800" }}>{interview?.questions?.[currentQuestionIndex]?.question}</h3>
                <div style={{ whiteSpace: "pre-line", marginTop: "20px", color: "#334155", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  {interview?.questions?.[currentQuestionIndex]?.problemStatement || "No problem statement provided."}
                </div>
                
                {interview.interviewType === "DSA" && (
                  <div style={{ marginTop: "30px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
                    <div style={{ marginBottom: "20px" }}>
                      <strong style={{ color: "#1e293b", fontSize: "0.9rem" }}>Constraints</strong>
                      <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", color: "#475569", marginTop: "8px", border: "1px solid #e2e8f0", fontFamily: "monospace" }}>
                        {interview?.questions?.[currentQuestionIndex]?.constraints}
                      </div>
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                      <strong style={{ color: "#1e293b", fontSize: "0.9rem" }}>Input Format</strong>
                      <p style={{ fontSize: "0.9rem", color: "#475569", marginTop: "8px", lineHeight: "1.5" }}>{interview?.questions?.[currentQuestionIndex]?.inputFormat}</p>
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                      <strong style={{ color: "#1e293b", fontSize: "0.9rem" }}>Output Format</strong>
                      <p style={{ fontSize: "0.9rem", color: "#475569", marginTop: "8px", lineHeight: "1.5" }}>{interview?.questions?.[currentQuestionIndex]?.outputFormat}</p>
                    </div>
                    <div>
                      <strong style={{ color: "#1e293b", fontSize: "0.9rem" }}>Sample Test Cases</strong>
                      <pre style={{ background: "#1e293b", color: "#e2e8f0", padding: "15px", borderRadius: "8px", fontSize: "0.85rem", marginTop: "10px", overflowX: "auto" }}>
                        {interview?.questions?.[currentQuestionIndex]?.sampleTestCases}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <FaCheckCircle style={{ fontSize: "3rem", color: "#22c55e", marginBottom: "15px" }} />
                <h3>Completed!</h3>
                <p>Review your results in the history section.</p>
                
                {!feedbackSubmitted ? (
                  <div style={{ marginTop: "30px", textAlign: "left", padding: "20px", background: "#f8fafc", borderRadius: "12px" }}>
                    <h4>Interview Feedback</h4>
                    <p style={{ fontSize: "0.8rem", color: "#64748b" }}>How was your experience?</p>
                    <div style={{ margin: "15px 0" }}>
                      <label style={{ display: "block", marginBottom: "5px" }}>Rating (1-5):</label>
                      <input type="range" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} style={{ width: "100%" }} />
                    </div>
                    <textarea 
                      className="searchInput" 
                      placeholder="Any comments..." 
                      value={userFeedback} 
                      onChange={(e) => setUserFeedback(e.target.value)}
                      style={{ height: "80px", marginBottom: "15px" }}
                    />
                    <button className="view-btn" onClick={() => {
                      toast.success("Thank you for your feedback!");
                      setFeedbackSubmitted(true);
                    }}>Submit Feedback</button>
                  </div>
                ) : (
                  <p style={{ color: "#22c55e", fontWeight: "bold", marginTop: "20px" }}>Feedback Submitted! ✅</p>
                )}
              </div>
            )}
          </div>

          {/* Middle Panel: Editor & Compiler */}
          <div className="editor-panel">
            <div style={{ padding: "10px 20px", background: "#2d2d2d", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <FaCode />
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ background: "#3e3e3e", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px" }}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="save-btn" 
                  style={{ padding: "4px 12px", fontSize: "0.8rem", background: "#444", color: "#fff" }} 
                  onClick={() => setShowSidePanel(!showSidePanel)}
                >
                  {showSidePanel ? "Hide Interviewer" : "Show Interviewer"}
                </button>
                <button className="save-btn" style={{ padding: "4px 12px", fontSize: "0.8rem", background: "#444", color: "#fff" }} onClick={handleRunCode} disabled={isRunning || isFinished}>
                  {isRunning ? "Running..." : <><FaPlay /> Run Code</>}
                </button>
                <button className="view-btn" style={{ padding: "4px 12px", fontSize: "0.8rem" }} onClick={handleSubmitAnswer} disabled={loading || isFinished}>
                  {loading ? "Submitting..." : "Submit Code"}
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                value={code}
                onChange={(value) => setCode(value)}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  readOnly: isFinished || isRunning,
                  cursorBlinking: "blink",
                  cursorSmoothCaretAnimation: true
                }}
              />
            </div>

            <div style={{ height: "250px", background: "#1e1e1e", color: "#d4d4d4", padding: "15px", borderTop: "1px solid #333", overflowY: "auto" }}>
              <div style={{ fontSize: "0.7rem", color: "#888", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                <FaTerminal /> CONSOLE & TEST RESULTS
              </div>
              
              {output && (
                <div style={{ marginBottom: "15px", padding: "10px", background: "#2d2d2d", borderRadius: "4px", borderLeft: `4px solid ${output.includes("✅") ? "#22c55e" : output.includes("❌") ? "#ef4444" : "#3b82f6"}` }}>
                  <pre style={{ margin: 0, fontSize: "0.9rem", fontFamily: "monospace", color: output.includes("✅") ? "#4ade80" : "#d4d4d4", whiteSpace: "pre-wrap" }}>
                    {output}
                  </pre>
                </div>
              )}

              {testResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {testResults.map((res, idx) => (
                    <div key={idx} style={{ background: "#2d2d2d", padding: "10px", borderRadius: "6px", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontWeight: "bold" }}>Test Case {idx + 1}</span>
                        <span style={{ color: res.passed ? "#4ade80" : "#ef4444" }}>{res.passed ? "Passed" : "Failed"}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <div style={{ color: "#888", fontSize: "0.7rem" }}>INPUT</div>
                          <pre style={{ margin: 0, background: "#1e1e1e", padding: "5px" }}>{res.input}</pre>
                        </div>
                        <div>
                          <div style={{ color: "#888", fontSize: "0.7rem" }}>EXPECTED OUTPUT</div>
                          <pre style={{ margin: 0, background: "#1e1e1e", padding: "5px" }}>{res.expected}</pre>
                        </div>
                      </div>
                      {!res.passed && (
                        <div style={{ marginTop: "5px" }}>
                          <div style={{ color: "#ef4444", fontSize: "0.7rem" }}>ACTUAL OUTPUT</div>
                          <pre style={{ margin: 0, background: "#1e1e1e", padding: "5px", color: "#ef4444" }}>{res.actual || "(no output)"}</pre>
                        </div>
                      )}
                      {res.error && (
                        <div style={{ marginTop: "5px" }}>
                          <div style={{ color: "#ef4444", fontSize: "0.7rem" }}>ERROR</div>
                          <pre style={{ margin: 0, background: "#1e1e1e", padding: "5px", color: "#ef4444" }}>{res.error}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {!output && !testResults.length && (
                <p style={{ color: "#666", fontSize: "0.9rem" }}>Run your code to see the output and test results here...</p>
              )}
            </div>
          </div>

          {/* Right Panel: Video & Chat */}
          <div className="side-panel" style={{ display: showSidePanel ? "flex" : "none", overflow: "hidden", background: "#fff" }}>
            <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="video-container" style={{ height: "160px", margin: 0, background: "#000", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
                <video ref={mySideVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                {!isCamOn && <div style={{ position: "absolute", inset: 0, background: "#2d2d2d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><FaUser /></div>}
                <div style={{ position: "absolute", bottom: "5px", left: "5px", color: "#fff", fontSize: "0.6rem", background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: "4px" }}>You</div>
              </div>
              
              <div className="video-container" style={{ height: "160px", margin: 0, background: "#000", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
                {remoteStream ? (
                  <video ref={remoteSideVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                    <FaUser style={{ fontSize: "1.2rem", marginBottom: "5px" }} />
                    <p style={{ fontSize: "0.6rem" }}>Waiting for interviewer...</p>
                  </div>
                )}
                <div style={{ position: "absolute", bottom: "5px", left: "5px", color: "#fff", fontSize: "0.6rem", background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: "4px" }}>Interviewer</div>
              </div>
            </div>

            <div className="chat-panel">
              <div style={{ padding: "10px 15px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaComments /> <strong>Chat</strong>
              </div>
              <div style={{ flex: 1, padding: "15px", overflowY: "auto", background: "#fff" }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ marginBottom: "12px", textAlign: m.sender === user.name ? "right" : "left" }}>
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginBottom: "2px" }}>{m.sender}</div>
                    <div style={{ display: "inline-block", padding: "6px 10px", borderRadius: "8px", background: m.sender === user.name ? "#2d5649" : "#f1f5f9", color: m.sender === user.name ? "#fff" : "#1e293b", fontSize: "0.85rem", maxWidth: "90%" }}>
                      {m.message}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} style={{ padding: "10px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "5px" }}>
                <input 
                  type="text" 
                  className="searchInput" 
                  style={{ margin: 0, padding: "6px 10px", fontSize: "0.8rem" }} 
                  placeholder="Message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="view-btn" style={{ padding: "6px" }}><FaPaperPlane /></button>
              </form>
            </div>

            <div style={{ padding: "15px", borderTop: "1px solid #e2e8f0" }}>
              <button className="save-btn" style={{ width: "100%", marginBottom: "10px" }} onClick={handleScreenShare}>
                <FaDesktop /> Share Screen
              </button>
              <button className="save-btn" style={{ width: "100%" }} onClick={toggleFullScreen}>
                <FaExpand /> {isFullScreen ? "Exit Full Screen" : "Full Screen"}
              </button>
            </div>
          </div>
          </>
          )}
        </div>

        {/* Bottom Control Bar (Zoom Style) */}
        <div style={{ height: "60px", background: "#0e141e", display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", borderTop: "1px solid #323e4f" }}>
          <button 
            onClick={toggleMic}
            style={{ width: "45px", height: "45px", borderRadius: "50%", border: "none", background: isMicOn ? "#323e4f" : "#ff4d4d", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}
            title={isMicOn ? "Mute Mic" : "Unmute Mic"}
          >
            {isMicOn ? <FaMicrophone /> : <FaMicrophone style={{ textDecoration: "line-through" }} />}
          </button>
          <button 
            onClick={toggleCam}
            style={{ width: "45px", height: "45px", borderRadius: "50%", border: "none", background: isCamOn ? "#323e4f" : "#ff4d4d", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}
            title={isCamOn ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isCamOn ? <FaVideo /> : <FaVideo style={{ textDecoration: "line-through" }} />}
          </button>
          <button 
            onClick={handleScreenShare}
            style={{ width: "45px", height: "45px", borderRadius: "50%", border: "none", background: "#323e4f", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}
            title="Share Screen"
          >
            <FaDesktop />
          </button>
          <div style={{ width: "1px", height: "30px", background: "#323e4f", margin: "0 10px" }}></div>
          <button 
            onClick={() => setShowSidePanel(!showSidePanel)}
            style={{ width: "45px", height: "45px", borderRadius: "50%", border: "none", background: showSidePanel ? "#00ff41" : "#323e4f", color: showSidePanel ? "#000" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}
            title="Toggle Chat & Video Panel"
          >
            <FaComments />
          </button>
          <button 
            onClick={toggleFullScreen}
            style={{ width: "45px", height: "45px", borderRadius: "50%", border: "none", background: "#323e4f", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}
            title="Toggle Full Screen"
          >
            <FaExpand />
          </button>
        </div>
      </div>
    </section>
  );
};

export default MockInterviewSession;
