import React, { useContext, useEffect, lazy, Suspense } from "react";
import "./App.css";
import { Context } from "./main";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import { io } from "socket.io-client";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import Chatbot from "./components/Layout/Chatbot";
import API_BASE_URL from "./config";

const Login = lazy(() => import("./components/Auth/NewLogin"));
const Register = lazy(() => import("./components/Auth/NewRegister"));
const Home = lazy(() => import("./components/Home/Home"));
const Jobs = lazy(() => import("./components/Job/Jobs"));
const JobDetails = lazy(() => import("./components/Job/JobDetails"));
const Application = lazy(() => import("./components/Application/Application"));
const MyApplications = lazy(() => import("./components/Application/MyApplications"));
const PostJob = lazy(() => import("./components/Job/PostJob"));
const NotFound = lazy(() => import("./components/NotFound/NotFound"));
const MyJobs = lazy(() => import("./components/Job/MyJobs"));
const Profile = lazy(() => import("./components/Auth/Profile"));
const ResumeAnalyzer = lazy(() => import("./components/Analyzer/ResumeAnalyzer"));
const Recommended = lazy(() => import("./components/Job/Recommended"));
const SavedJobs = lazy(() => import("./components/Job/SavedJobs"));
const VerifyEmail = lazy(() => import("./components/Auth/VerifyEmail"));
const VerifyPending = lazy(() => import("./components/Auth/VerifyPending"));
const Experiences = lazy(() => import("./components/Experience/Experiences"));
const MockInterviews = lazy(() => import("./components/MockInterview/MockInterviews"));
const MockInterviewSession = lazy(() => import("./components/MockInterview/MockInterviewSession"));
const AdminDashboard = lazy(() => import("./components/Admin/AdminDashboard"));

const App = () => {
  const { isAuthorized, setIsAuthorized, setUser, user, setSocket, socket } = useContext(Context);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/user/getuser`,
          {
            withCredentials: true,
          }
        );
        setUser(response.data.user);
        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);
        setUser({});
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (isAuthorized && user?._id) {
      const newSocket = io(API_BASE_URL, {
        auth: {
          userId: user._id,
          name: user.name,
        },
        withCredentials: true,
      });
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [isAuthorized, user?._id]);

  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route path="/job/getall" element={<Jobs />} />
            <Route path="/job/:id" element={<JobDetails />} />
            <Route path="/application/:id" element={<Application />} />
            <Route path="/applications/me" element={<MyApplications />} />
            <Route path="/job/post" element={<PostJob />} />
            <Route path="/job/me" element={<MyJobs />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/analyzer" element={<ResumeAnalyzer />} />
            <Route path="/recommended" element={<Recommended />} />
            <Route path="/saved" element={<SavedJobs />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/mock-interviews" element={<MockInterviews />} />
          <Route path="/mock-interview/:id" element={<MockInterviewSession />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Footer />
        <Chatbot />
        <Toaster />
      </BrowserRouter>
    </>
  );
};

export default App;
