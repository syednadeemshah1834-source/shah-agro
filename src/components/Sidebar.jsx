import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import Icon from "../Images/seed10.jpg";

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">

      {/* HEADER */}
      <div className="sidebar-header">
        <img src={Icon} alt="Logo" className="sidebar-logo" />
        <h2 className="sidebar-title">Shah Agro Khwaza Khela</h2>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav">

        <Link
          to="/dashboard"
          className={location.pathname === "/dashboard" || location.pathname === "/" ? "active" : ""}
        >
          Dashboard
        </Link>

        <Link
          to="/farms"
          className={location.pathname === "/farms" ? "active" : ""}
        >
          Farms
        </Link>

        <Link
          to="/seeds"
          className={location.pathname === "/seeds" ? "active" : ""}
        >
          Seeds
        </Link>

        <Link
          to="/fertilizers"
          className={location.pathname === "/fertilizers" ? "active" : ""}
        >
          Fertilizers
        </Link>

        <Link
          to="/duebills"
          className={location.pathname === "/duebills" ? "active" : ""}
        >
          Due Bills
        </Link>

        <Link
          to="/inventory"
          className={location.pathname === "/inventory" ? "active" : ""}
        >
          Inventory
        </Link>

        <Link
          to="/sales"
          className={location.pathname === "/sales" ? "active" : ""}
        >
          Sales
        </Link>

        <Link
          to="/purchase"
          className={location.pathname === "/purchase" ? "active" : ""}
        >
          Purchase
        </Link>

        <Link
          to="/suppliers"
          className={location.pathname === "/suppliers" ? "active" : ""}
        >
          Suppliers
        </Link>

        <Link
          to="/livestocks"
          className={location.pathname === "/livestocks" ? "active" : ""}
        >
          Live Stock
        </Link>

        {/* ✅ FIXED SMART ALERTS LINK */}
        <Link
          to="/smartalerts"
          className={location.pathname === "/smartalerts" ? "active" : ""}
        >
          Smart Alerts
        </Link>

        <Link
          to="/profit-loss"
          className={location.pathname === "/profit-loss" ? "active" : ""}
        >
          Profit & Loss
        </Link>

        <Link
          to="/reports"
          className={location.pathname === "/reports" ? "active" : ""}
        >
          Reports
        </Link>

        <Link
          to="/settings"
          className={location.pathname === "/settings" ? "active" : ""}
        >
          Settings
        </Link>

      </nav>

    </div>
  );
};

export default Sidebar;
