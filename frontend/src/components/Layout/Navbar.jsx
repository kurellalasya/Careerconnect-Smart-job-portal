import React, { useContext, useState } from "react";
import { Context } from "../../main";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { GiHamburgerMenu } from "react-icons/gi";
import { AiOutlineClose, AiOutlineHome, AiOutlineUser, AiOutlineLogout } from "react-icons/ai";
import { FaUserShield } from "react-icons/fa";
import { MdOutlineWorkOutline, MdOutlinePostAdd, MdOutlineSaveAlt } from "react-icons/md";
import { TbAnalyze } from "react-icons/tb";
import { HiOutlineClipboardList } from "react-icons/hi";
import { RiChatSmile2Line, RiRobotLine } from "react-icons/ri";
import API_BASE_URL from "../../config";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const { isAuthorized, setIsAuthorized, user, setUser } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/user/logout`,
        {
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
      setIsAuthorized(false);
      setUser({});
      navigateTo("/login");
    } catch (error) {
      toast.error(error.response.data.message);
      setIsAuthorized(true);
    }
  };

  return (
    <nav className={isAuthorized ? "navbarShow" : "navbarHide"}>
      <div className="container">
        <div className="logo">
          <img src="/careerconnect-white.png" alt="logo" />
        </div>
        <ul className={!show ? "menu" : "show-menu menu"}>
          <li>
            <Link to={"/"} onClick={() => setShow(false)}>
              <AiOutlineHome /> HOME
            </Link>
          </li>
          <li>
            <Link to={"/job/getall"} onClick={() => setShow(false)}>
              <MdOutlineWorkOutline /> ALL JOBS
            </Link>
          </li>
          {user && user.role && user.role.toLowerCase() !== "admin" ? (
            <li>
              <Link to={"/applications/me"} onClick={() => setShow(false)}>
                <HiOutlineClipboardList /> {user.role === "Employer"
                  ? "APPLICANTS"
                  : "MY APPLICATIONS"}
              </Link>
            </li>
          ) : null}
          {user && user.role === "Employer" ? (
            <>
              <li>
                <Link to={"/job/post"} onClick={() => setShow(false)}>
                  <MdOutlinePostAdd /> POST JOB
                </Link>
              </li>
              <li>
                <Link to={"/job/me"} onClick={() => setShow(false)}>
                  <MdOutlineWorkOutline /> MY JOBS
                </Link>
              </li>
            </>
          ) : null}

          {user && user.role && user.role.toLowerCase() === "admin" ? (
            <li>
              <Link to={"/admin/dashboard"} onClick={() => setShow(false)}>
                <FaUserShield /> ADMIN
              </Link>
            </li>
          ) : null}

          {user && user.role === "Job Seeker" ? (
            <>
              <li>
                <Link to={"/analyzer"} onClick={() => setShow(false)}>
                  <TbAnalyze /> ANALYZER
                </Link>
              </li>
              <li>
                <Link to={"/saved"} onClick={() => setShow(false)}>
                  <MdOutlineSaveAlt /> SAVED
                </Link>
              </li>
              <li>
                <Link to={"/experiences"} onClick={() => setShow(false)}>
                  <RiChatSmile2Line /> EXPERIENCES
                </Link>
              </li>
              <li>
                <Link to={"/mock-interviews"} onClick={() => setShow(false)}>
                  <RiRobotLine /> MOCK INTERVIEW
                </Link>
              </li>
            </>
          ) : null}

          <li>
            <Link to={"/profile"} onClick={() => setShow(false)}>
              <AiOutlineUser /> PROFILE
            </Link>
          </li>
          <button className="logout-btn" onClick={handleLogout}>
            <AiOutlineLogout /> LOGOUT
          </button>
        </ul>
        <div className="hamburger" onClick={() => setShow(!show)}>
          {show ? <AiOutlineClose /> : <GiHamburgerMenu />}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
