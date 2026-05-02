import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { logError } from "./utils/logger";
import "./index.css";

// Catch unhandled runtime errors
window.addEventListener("error", (event) => {
  logError(event.message, "Global Runtime Error");
});

// Catch unhandled Promise rejections (like failed network requests)
window.addEventListener("unhandledrejection", (event) => {
  logError(event.reason?.toString() || "Unknown Promise Rejection", "Global Async Error");
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
