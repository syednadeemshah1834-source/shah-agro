import React from 'react';
import { logError } from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    logError(error.toString(), "React Crash");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-primary)", fontFamily: "Inter, sans-serif" }}>
          <h2 style={{ color: "#ef4444", marginBottom: "16px" }}>⚠️ Application Encountered an Error</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
            The system crashed unexpectedly. We have automatically saved the error details into the Activity Logs so you can review it.
          </p>
          <button 
            style={{ padding: "12px 24px", background: "var(--accent-primary)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
