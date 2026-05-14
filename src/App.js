import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Footer from "./components/Footer";
import NotificationSystem from "./components/NotificationSystem";

import Login from "./Pages/Login";

/* ===== ALL PAGES ===== */

import Dashboard from "./Pages/Dashboard";
import Farms from "./Pages/Farms";
import Seeds from "./Pages/Seeds";
import Fertilizers from "./Pages/Fertilizers";
import DueBills from "./Pages/DueBills";
import Inventory from "./Pages/Inventory";
import Sales from "./Pages/Sales";
import Purchase from "./Pages/Purchase";
import Livestocks from "./Pages/Livestocks";
import Smartalerts from "./Pages/Smartalerts";
import ProfitLoss from "./Pages/ProfitLoss";
import Reports from "./Pages/Reports";
import Settings from "./Pages/Settings";
import Logs from "./Pages/Logs";

import "./App.css";

const App = () => {
  React.useEffect(() => {
    const loadConfig = () => {
      const savedConfig = JSON.parse(localStorage.getItem("app-config")) || {
        name: localStorage.getItem("app-name") || "Shah Agro",
        theme: localStorage.getItem("app-theme") || "light"
      };
      document.documentElement.setAttribute("data-theme", savedConfig.theme);
      document.title = savedConfig.name;
    };

    loadConfig();
    // Listen for storage changes to update UI instantly across tabs if needed
    window.addEventListener("storage", loadConfig);
    return () => window.removeEventListener("storage", loadConfig);
  }, []);

  const location = useLocation();

  /* ✅ SAFE USER PARSE */
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  /* ===============================
     🔐 AUTH PROTECTION
  =============================== */

  if (!user) {

    return (
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              state={{ from: location }}
              replace
            />
          }
        />

      </Routes>
    );

  }

  /* ===============================
     ✅ MAIN APP
  =============================== */

  return (

    <div className="app">

      <Sidebar />
      <NotificationSystem />

      <div className="main-content">

        <Topbar />

        <div className="page-content">

          <Routes>

            {/* DEFAULT */}

            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />

            {/* MAIN PAGES */}

            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/farms" element={<Farms />} />

            <Route path="/seeds" element={<Seeds />} />

            <Route path="/fertilizers" element={<Fertilizers />} />

            <Route path="/duebills" element={<DueBills />} />

            <Route path="/inventory" element={<Inventory />} />

            <Route path="/sales" element={<Sales />} />

            <Route path="/purchase" element={<Purchase />} />

            <Route path="/livestocks" element={<Livestocks />} />

            {/* ✅ SMART ALERTS */}

            <Route
              path="/smartalerts"
              element={<Smartalerts />}
            />

            <Route
              path="/profit-loss"
              element={<ProfitLoss />}
            />

            <Route path="/reports" element={<Reports />} />

            <Route path="/settings" element={<Settings />} />

            <Route path="/logs" element={<Logs />} />

            {/* BLOCK LOGIN WHEN LOGGED IN */}

            <Route
              path="/login"
              element={<Navigate to="/dashboard" replace />}
            />

            {/* FALLBACK */}

            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />

          </Routes>

        </div>

        <Footer />

      </div>

    </div>

  );

};

export default App;
