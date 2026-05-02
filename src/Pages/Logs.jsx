import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "../firebase";
import "./Logs.css";

const Logs = () => {
  const shopId = "mainshop";
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "shops", shopId, "logs"),
      orderBy("createdAt", "desc"),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(logData);
    });

    return () => unsubscribe();
  }, [shopId]);

  const filteredLogs = logs.filter(
    (log) =>
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>System Activity Logs</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Track all changes and actions performed in the system.</p>
      </div>

      <div className="search-container">
        <input
          className="search-input"
          placeholder="Search logs by action, user, or details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>User</th>
              <th>Module</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => {
              const dateStr = log.createdAt?.toDate 
                ? log.createdAt.toDate().toLocaleString() 
                : log.createdAt?.seconds 
                  ? new Date(log.createdAt.seconds * 1000).toLocaleString()
                  : "Just now";

              return (
                <tr key={log.id}>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{dateStr}</td>
                  <td style={{ fontWeight: 600 }}>{log.userName}</td>
                  <td>
                    <span className={`log-badge ${log.category?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {log.category}
                    </span>
                  </td>
                  <td>
                    <span className={`log-action ${log.action?.toLowerCase()}`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{log.details}</td>
                </tr>
              );
            })}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                  No activity logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Logs;
