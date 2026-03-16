import React from "react";
import "./Settings.css";

const Settings = () => {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>System Configuration & Settings</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Manage your shop profile, user preferences, and system-wide configurations</p>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3><span>🏪</span> Shop Profile</h3>
          <div className="settings-info">
            <p><strong>Shop Name:</strong> Shah Agro (Main Branch)</p>
            <p><strong>Location:</strong> Lahore, Punjab, Pakistan</p>
            <p><strong>Currency:</strong> PKR (₨)</p>
          </div>
          <button className="save-settings-btn">Edit Profile</button>
        </div>

        <div className="settings-card">
          <h3><span>👤</span> User Account</h3>
          <div className="settings-info">
            <p><strong>Administrator:</strong> syednadeemshah</p>
            <p><strong>Email:</strong> admin@shahagro.com</p>
            <p><strong>Role:</strong> Super Admin</p>
          </div>
          <button className="save-settings-btn">Change Password</button>
        </div>

        <div className="settings-card">
          <h3><span>🎨</span> Visual Appearance</h3>
          <div className="settings-info">
            <p>Customize the interface theme to your preference</p>
          </div>
          <div className="theme-buttons-container">
            <button 
              className="theme-btn light-ui" 
              onClick={() => {
                document.documentElement.setAttribute("data-theme", "light");
                localStorage.setItem("app-theme", "light");
              }}
            >
              Light Professional UI
            </button>
            <button 
              className="theme-btn dark-ui" 
              onClick={() => {
                document.documentElement.setAttribute("data-theme", "dark");
                localStorage.setItem("app-theme", "dark");
              }}
            >
              Professional Dark UI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
