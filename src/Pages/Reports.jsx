import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Reports.css";

const shopId = "mainshop";

const Reports = () => {

  const navigate = useNavigate();

  /* ================= STATES ================= */

  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [dueBills, setDueBills] = useState([]);

  /* ================= FETCH FIRESTORE ================= */

  useEffect(() => {

    const unsubSales = onSnapshot(
      collection(db, "shops", shopId, "sales"),
      snap => setSales(snap.docs.map(doc => doc.data()))
    );

    const unsubPurchase = onSnapshot(
      collection(db, "shops", shopId, "purchases"),
      snap => setPurchases(snap.docs.map(doc => doc.data()))
    );

    const unsubDue = onSnapshot(
      collection(db, "shops", shopId, "dueBills"),
      snap => setDueBills(snap.docs.map(doc => doc.data()))
    );

    return () => {
      unsubSales();
      unsubPurchase();
      unsubDue();
    };

  }, []);

  /* ================= TOTAL SALES ================= */

  const totalSales = useMemo(() => {
    return sales.reduce(
      (sum, s) => sum + Number(s.totalAmount || 0),
      0
    );
  }, [sales]);

  /* ================= TOTAL PURCHASE ================= */

  const totalPurchase = useMemo(() => {
    return purchases.reduce(
      (sum, p) => sum + Number(p.total || 0),
      0
    );
  }, [purchases]);

  /* ================= PROFIT ================= */

  const totalProfit = totalSales - totalPurchase;

  /* ================= TOTAL DUE ================= */

  const totalDue = useMemo(() => {
    return dueBills.reduce(
      (sum, d) => sum + Number(d.remainingAmount || 0),
      0
    );
  }, [dueBills]);

  /* ================= INVENTORY COUNT ================= */

  const inventoryCount = useMemo(() => {

    const map = {};

    purchases.forEach(p => {
      const name = p.itemName;
      map[name] = (map[name] || 0) + Number(p.quantity);
    });

    sales.forEach(s => {
      const name = s.itemName;
      map[name] = (map[name] || 0) - Number(s.quantity);
    });

    return Object.keys(map).length;

  }, [purchases, sales]);

  /* ================= EXPIRY ITEMS ================= */

  const expiryCount = useMemo(() => {

    const today = new Date();

    return purchases.filter(p => {

      if (!p.expiryDate) return false;

      const diff =
        (new Date(p.expiryDate) - today) /
        (1000 * 60 * 60 * 24);

      return diff <= 30 && diff >= 0;

    }).length;

  }, [purchases]);

  /* ================= UI ================= */

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>Intelligence & Business Reports</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Select a category to view detailed analytical breakdown and historical data</p>
      </div>

      <div className="reports-grid">
        {/* SALES */}
        <div className="report-card sales" onClick={() => navigate("/sales")}>
          <h3>Total Sales Transactions</h3>
          <div className="report-value">PKR {totalSales.toLocaleString()}</div>
        </div>

        {/* PURCHASE */}
        <div className="report-card purchase" onClick={() => navigate("/purchase")}>
          <h3>Stock Acquisition Volume</h3>
          <div className="report-value">PKR {totalPurchase.toLocaleString()}</div>
        </div>

        {/* PROFIT */}
        <div className="report-card profit" onClick={() => navigate("/profit-loss")}>
          <h3>Operational Profitability</h3>
          <div className="report-value">PKR {totalProfit.toLocaleString()}</div>
        </div>

        {/* INVENTORY */}
        <div className="report-card inventory" onClick={() => navigate("/inventory")}>
          <h3>Product Catalog Health</h3>
          <div className="report-value">{inventoryCount} Active SKUs</div>
        </div>

        {/* DUE */}
        <div className="report-card due" onClick={() => navigate("/duebills")}>
          <h3>Outstanding Receivables</h3>
          <div className="report-value">PKR {totalDue.toLocaleString()}</div>
        </div>

        {/* EXPIRY */}
        <div className="report-card expiry" onClick={() => navigate("/smartalerts")}>
          <h3>Risk Assessment (Expiries)</h3>
          <div className="report-value">{expiryCount} Critical Items</div>
        </div>
      </div>
    </div>
  );

};

export default Reports;
