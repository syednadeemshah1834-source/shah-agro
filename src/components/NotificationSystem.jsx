import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const shopId = "mainshop";

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [latestAlert, setLatestAlert] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Listen for Purchases to check Expiries
    const unsubPurchases = onSnapshot(
      collection(db, "shops", shopId, "purchases"),
      (snapshot) => {
        const today = new Date();
        const alerts = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.expiryDate) {
            const expiry = new Date(data.expiryDate);
            const diffDays = (expiry - today) / (1000 * 60 * 60 * 24);
            if (diffDays <= 30 && diffDays > 0) {
              alerts.push({
                id: doc.id,
                type: "expiry",
                title: "Expiry Alert",
                message: `${data.itemName} is expiring in ${Math.ceil(diffDays)} days!`,
                color: "#ef4444"
              });
            }
          }
        });
        updateNotifications("expiry", alerts);
      }
    );

    // 2. Listen for Low Stock (Simulation based on current inventory logic)
    // For now, let's just trigger a welcome notification or a static check
    // In a real app, you'd aggregate stock here. 
    // To keep it light, we'll listen to a "notifications" collection if you had one, 
    // but here we check data patterns.

    return () => unsubPurchases();
  }, []);

  const updateNotifications = (type, newAlerts) => {
    if (newAlerts.length > 0) {
      setLatestAlert(newAlerts[0]);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  if (!showToast || !latestAlert) return null;

  return (
    <div 
      className="global-notification-toast"
      onClick={() => navigate("/smartalerts")}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "white",
        borderLeft: `5px solid ${latestAlert.color}`,
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        zIndex: 9999,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        animation: "slideIn 0.3s ease-out"
      }}
    >
      <div style={{ fontSize: "24px" }}>⚠️</div>
      <div>
        <div style={{ fontWeight: "bold", color: "#1e293b" }}>{latestAlert.title}</div>
        <div style={{ fontSize: "14px", color: "#64748b" }}>{latestAlert.message}</div>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); setShowToast(false); }}
        style={{ background: "none", border: "none", fontSize: "18px", color: "#94a3b8" }}
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default NotificationSystem;
