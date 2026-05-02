import React, { useState } from "react";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import "./Settings.css";

const Settings = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const shopId = user?.shopId || "mainshop";
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Dynamic Branding
  const [appName, setAppName] = useState(localStorage.getItem("app-name") || "Shah Agro");
  
  const handleBrandingChange = (e) => {
    const newName = e.target.value;
    setAppName(newName);
    localStorage.setItem("app-name", newName);
    document.title = newName;
    // Trigger storage event for other components
    window.dispatchEvent(new Event("storage"));
  };

  const handleThemeChange = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
    // Trigger storage event
    window.dispatchEvent(new Event("storage"));
  };

  /* ===============================
     💾 BACKUP LOGIC (EXPORT)
  =============================== */
  const handleExportBackup = async () => {
    setIsBackingUp(true);

    try {
      const collectionsToBackup = [
        "sales", 
        "purchases", 
        "inventory", 
        "seeds", 
        "fertilizers", 
        "livestocks", 
        "duebills", 
        "suppliers", 
        "farms",
        "notifications"
      ];

      const backupData = {
        meta: {
          shopName: "Shah Agro",
          shopId: shopId,
          exportedBy: user?.name || "Admin",
          timestamp: new Date().toISOString(),
          version: "1.0"
        },
        data: {}
      };

      // Sequentially fetch all data
      for (const colName of collectionsToBackup) {
        const colRef = collection(db, "shops", shopId, colName);
        const snapshot = await getDocs(colRef);
        
        backupData.data[colName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Convert to JSON and Trigger Download
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().split('T')[0];
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `ShahAgro_FullBackup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("🎉 Backup generated and downloaded successfully!");
      
    } catch (error) {
      console.error("Backup Error:", error);
      alert("❌ Backup failed: " + error.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  /* ===============================
     🗑️ DANGER ZONE (DELETE ALL DATA)
  =============================== */
  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    setShowConfirmModal(false);
    
    try {
      const collectionsToDelete = [
        "sales", 
        "purchases", 
        "inventory", 
        "seeds", 
        "fertilizers", 
        "livestocks", 
        "duebills", 
        "suppliers", 
        "farms",
        "notifications"
      ];

      // 1. Fetch all collections in parallel to save network time
      const snapshots = await Promise.all(
        collectionsToDelete.map(colName => getDocs(collection(db, "shops", shopId, colName)))
      );

      // 2. Use Firestore Batches (up to 500 ops per batch) for extremely fast deletion
      let batch = writeBatch(db);
      let opCount = 0;
      const batchPromises = [];

      snapshots.forEach((snapshot, index) => {
        const colName = collectionsToDelete[index];
        snapshot.docs.forEach(document => {
          const docRef = doc(db, "shops", shopId, colName, document.id);
          batch.delete(docRef);
          opCount++;

          // Commit batch if it hits the 500 limit
          if (opCount === 500) {
            batchPromises.push(batch.commit());
            batch = writeBatch(db);
            opCount = 0;
          }
        });
      });

      // Commit any remaining operations
      if (opCount > 0) {
        batchPromises.push(batch.commit());
      }

      // Execute all batch commits concurrently
      await Promise.all(batchPromises);

      alert("🚨 All data has been successfully deleted from the system.");
      window.location.reload();
      
    } catch (error) {
      console.error("Deletion Error:", error);
      alert("❌ Failed to delete data: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>System Configuration & Settings</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Manage your shop profile, user preferences, and system-wide configurations</p>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3><span>🏪</span> System Branding</h3>
          <div className="settings-info">
            <p>Change the application name displayed in the sidebar and browser tab.</p>
            <div className="branding-input-group" style={{ marginTop: "15px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "5px" }}>App Display Name</label>
              <input 
                type="text" 
                value={appName} 
                onChange={handleBrandingChange}
                className="settings-input"
                placeholder="Enter App Name"
              />
            </div>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Changes are applied instantly system-wide.</p>
        </div>

        <div className="settings-card highlight-card">
          <h3><span>💾</span> Data & Backup</h3>
          <div className="settings-info">
            <p>Last local backup: <strong>Not checked</strong></p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px" }}>
              Export all your sales, purchase, and inventory records into a portable JSON file for offline safety.
            </p>
          </div>
          <button 
            className={`save-settings-btn backup-btn ${isBackingUp ? "loading" : ""}`}
            onClick={handleExportBackup}
            disabled={isBackingUp}
          >
            {isBackingUp ? "Generating Backup..." : "Generate Full Data Backup"}
          </button>
        </div>

        <div className="settings-card">
          <h3><span>👤</span> User Account</h3>
          <div className="settings-info">
            <p><strong>Administrator:</strong> {user?.name || "syednadeemshah"}</p>
            <p><strong>Email:</strong> {user?.email || "admin@shahagro.com"}</p>
            <p><strong>Role:</strong> {user?.role || "Super Admin"}</p>
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
              onClick={() => handleThemeChange("light")}
            >
              Light Professional UI
            </button>
            <button 
              className="theme-btn obsidian-ui" 
              onClick={() => handleThemeChange("obsidian")}
            >
              Obsidian Gold UI
            </button>
            <button 
              className="theme-btn midnight-ui" 
              onClick={() => handleThemeChange("midnight")}
            >
              Midnight Executive UI
            </button>
          </div>
        </div>

        {/* DANGER ZONE */}
        <div className="settings-card danger-card">
          <h3 style={{ color: "#ef4444" }}><span>⚠️</span> Danger Zone</h3>
          <div className="settings-info">
            <p style={{ color: "#ef4444", fontWeight: 600 }}>This action cannot be undone.</p>
            <p>Permanently delete all sales, purchases, inventory, and other records from your shop.</p>
          </div>
          <button 
            className={`save-settings-btn danger-btn ${isDeleting ? "loading" : ""}`}
            onClick={() => setShowConfirmModal(true)}
            disabled={isDeleting || isBackingUp}
          >
            {isDeleting ? "Deleting..." : "Delete All Data"}
          </button>
        </div>

      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ borderTop: "4px solid #ef4444" }}>
            <h3 style={{ color: "#ef4444" }}>⚠️ Warning: Irreversible Action</h3>
            <p style={{ margin: "16px 0", lineHeight: "1.5", color: "var(--text-secondary)" }}>
              You are about to permanently delete <strong>ALL</strong> data for this shop. This includes all inventory items, sales records, purchases, due bills, and farm data.
              <br/><br/>
              This action <strong>CANNOT</strong> be undone. Are you absolutely sure?
            </p>
            <div className="modal-buttons" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button 
                className="save-settings-btn danger-btn" 
                style={{ flex: 1, margin: 0 }}
                onClick={handleDeleteAllData}
              >
                Yes, Delete Everything
              </button>
              <button 
                className="cancel-btn" 
                style={{ flex: 1, padding: "14px" }}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
