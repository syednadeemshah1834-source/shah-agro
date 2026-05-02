import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { 
  MdDashboard, 
  MdInventory, 
  MdOutlineSell, 
  MdOutlineShoppingBag, 
  MdOutlineNotificationsActive, 
  MdOutlineSettings,
  MdHistory
} from "react-icons/md";
import { 
  GiFarmer, 
  GiChemicalDrop, 
  GiCow 
} from "react-icons/gi";
import { 
  HiOutlineReceiptTax, 
  HiOutlineDocumentReport 
} from "react-icons/hi";
import { PiPlant } from "react-icons/pi";
import { TbReportMoney } from "react-icons/tb";
import "./Sidebar.css";
import Icon from "../Images/seed10.jpg";

const Sidebar = () => {
  const location = useLocation();
  const [appName, setAppName] = React.useState(localStorage.getItem("app-name") || "Shah Agro");
  const [mobileOpen, setMobileOpen] = useState(false);

  React.useEffect(() => {
    const handleStorage = () => {
      setAppName(localStorage.getItem("app-name") || "Shah Agro");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <MdDashboard /> },
    { path: "/farms", label: "Farms", icon: <GiFarmer /> },
    { path: "/seeds", label: "Seeds", icon: <PiPlant /> },
    { path: "/fertilizers", label: "Fertilizers", icon: <GiChemicalDrop /> },
    { path: "/duebills", label: "Due Bills", icon: <HiOutlineReceiptTax /> },
    { path: "/inventory", label: "Inventory", icon: <MdInventory /> },
    { path: "/sales", label: "Sales", icon: <MdOutlineSell /> },
    { path: "/purchase", label: "Purchase", icon: <MdOutlineShoppingBag /> },
    { path: "/livestocks", label: "Live Stock", icon: <GiCow /> },
    { path: "/smartalerts", label: "Smart Alerts", icon: <MdOutlineNotificationsActive /> },
    { path: "/profit-loss", label: "Profit & Loss", icon: <TbReportMoney /> },
    { path: "/reports", label: "Reports", icon: <HiOutlineDocumentReport /> },
    { path: "/logs", label: "Activity Logs", icon: <MdHistory /> },
    { path: "/settings", label: "Settings", icon: <MdOutlineSettings /> },
  ];

  return (
    <>
      {/* Hamburger button - visible only on mobile */}
      <button
        className="hamburger-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle Menu"
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Overlay backdrop for mobile */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`sidebar ${mobileOpen ? "mobile-active" : ""}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img src={Icon} alt="Logo" className="sidebar-logo" />
        </div>
        <h1 className="sidebar-title">{appName}</h1>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={location.pathname === item.path || (item.path === "/dashboard" && location.pathname === "/") ? "active" : ""}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
    </>
  );
};

export default Sidebar;
