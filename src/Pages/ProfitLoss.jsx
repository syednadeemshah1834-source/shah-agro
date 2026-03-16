import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "./ProfitLoss.css";

const shopId = "mainshop";

const ProfitLoss = () => {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    const unsubSales = onSnapshot(collection(db, "shops", shopId, "sales"), (snapshot) => {
      setSales(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    const unsubPurchase = onSnapshot(collection(db, "shops", shopId, "purchases"), (snapshot) => {
      setPurchases(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubSales();
      unsubPurchase();
    };
  }, []);

  const purchasePriceMap = useMemo(() => {
    const map = {};
    purchases.forEach((p) => {
      if ((p.name || p.itemName) && p.price) {
        map[p.name || p.itemName] = Number(p.price);
      }
    });
    return map;
  }, [purchases]);

  const monthlyData = useMemo(() => {
    const grouped = {};
    sales.forEach((sale) => {
      if (!sale.createdAt?.toDate) return;
      const date = sale.createdAt.toDate();
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const saleTotal = Number(sale.totalAmount || 0);
      const costPrice = Number(purchasePriceMap[sale.itemName] || 0);
      const costTotal = costPrice * Number(sale.quantity || 0);
      if (!grouped[monthYear]) grouped[monthYear] = { sales: 0, cost: 0 };
      grouped[monthYear].sales += saleTotal;
      grouped[monthYear].cost += costTotal;
    });
    return Object.entries(grouped).map(([month, values]) => ({
      month,
      totalSales: values.sales,
      totalCost: values.cost,
      netProfit: values.sales - values.cost,
    }));
  }, [sales, purchasePriceMap]);

  const grandSales = monthlyData.reduce((sum, m) => sum + m.totalSales, 0);
  const grandCost = monthlyData.reduce((sum, m) => sum + m.totalCost, 0);
  const grandProfit = grandSales - grandCost;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>📊 Monthly Profit & Loss Analytics</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Consolidated report based on current sales and purchase records</p>
      </div>
      <div className="summary-grid">
        <div className="summary-card sales-card">
          <h3>Total Revenue</h3>
          <h2>PKR {grandSales.toLocaleString()}</h2>
        </div>
        <div className="summary-card cost-card">
          <h3>Total COGS</h3>
          <h2>PKR {grandCost.toLocaleString()}</h2>
        </div>
        <div className={`summary-card ${grandProfit >= 0 ? "profit-card" : "loss-card"}`}>
          <h3>{grandProfit >= 0 ? "Net Operational Profit" : "Net Operational Loss"}</h3>
          <h2>PKR {Math.abs(grandProfit).toLocaleString()}</h2>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fiscal Month</th>
              <th>Revenue (PKR)</th>
              <th>Cost of Goods (PKR)</th>
              <th>Net Margin (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((m, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 600 }}>{m.month}</td>
                <td>{m.totalSales.toLocaleString()}</td>
                <td>{m.totalCost.toLocaleString()}</td>
                <td className={m.netProfit >= 0 ? "profit-text" : "loss-text"}>
                  {m.netProfit >= 0 ? "+" : "-"} {Math.abs(m.netProfit).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLoss;
