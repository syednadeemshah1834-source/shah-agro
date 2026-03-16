import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { HiOutlineLogout, HiOutlineUserCircle } from "react-icons/hi";
import "./Topbar.css";

const Topbar = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await signOut(auth);
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h3>Enterprise Performance Management</h3>
      </div>

      <div className="topbar-right">
        <div className="user-profile">
          <div className="user-avatar">
            <HiOutlineUserCircle />
          </div>
          <div className="user-details">
            <span className="user-display-name">Admin User</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>

        <div className="topbar-divider"></div>

        <button className="logout-icon-btn" onClick={handleLogout} title="Logout">
          <HiOutlineLogout />
        </button>
      </div>
    </div>
  );
};

export default Topbar;
