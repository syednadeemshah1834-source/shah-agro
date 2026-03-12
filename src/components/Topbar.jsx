import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import "./Topbar.css";

const Topbar = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h3>Shah Agro System</h3>
      </div>

      <div className="topbar-right">
        <div className="user-info">
          <span className="user-email">{user?.email}</span>
        </div>

        <button className="btn btn-danger logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Topbar;
