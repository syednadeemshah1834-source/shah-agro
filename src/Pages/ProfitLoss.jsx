import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "./ProfitLoss.css";

const shopId = "mainshop";

const ProfitLoss = () => {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const unsubSales = onSnapshot(
      collection(db, "shops", shopId, "sales"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSales(data);
      }
    );

    const unsubPurchase = onSnapshot(
      collection(db, "shops", shopId, "purchases"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPurchases(data);
      }
    );

    return () => {
      unsubSales();
      unsubPurchase();
    };
  }, []);

  /* ================= COST PRICE MAP ================= */
  const purchasePriceMap = useMemo(() => {
    const map = {};
    purchases.forEach((p) => {
      if (p.name && p.price) {
        map[p.name] = Number(p.price);
      }
    });
    return map;
  }, [purchases]);

  /* ================= MONTHLY CALCULATION ================= */
  const monthlyData = useMemo(() => {
    const grouped = {};

    sales.forEach((sale) => {
      if (!sale.createdAt?.toDate) return;

      const date = sale.createdAt.toDate();
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;

      const saleTotal = Number(sale.totalAmount || 0);
      const costPrice = Number(purchasePriceMap[sale.itemName] || 0);
      const costTotal = costPrice * Number(sale.quantity || 0);

      if (!grouped[monthYear]) {
        grouped[monthYear] = {
          sales: 0,
          cost: 0,
        };
      }

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

  /* ================= GRAND TOTAL ================= */
  const grandSales = monthlyData.reduce(
    (sum, m) => sum + m.totalSales,
    0
  );

  const grandCost = monthlyData.reduce(
    (sum, m) => sum + m.totalCost,
    0
  );

  const grandProfit = grandSales - grandCost;

  return (
    <div className="profit-container">
      <h1>📊 Monthly Profit & Loss Report</h1>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="summary-grid">

        <div className="summary-card sales-card">
          <h3>Total Sales</h3>
          <h2>PKR {grandSales.toLocaleString()}</h2>
        </div>

        <div className="summary-card cost-card">
          <h3>Total Cost</h3>
          <h2>PKR {grandCost.toLocaleString()}</h2>
        </div>

        <div className={`summary-card ${grandProfit >= 0 ? "profit-card" : "loss-card"}`}>
          <h3>{grandProfit >= 0 ? "Net Profit" : "Net Loss"}</h3>
          <h2>PKR {Math.abs(grandProfit).toLocaleString()}</h2>
        </div>

      </div>

      {/* ===== MONTHLY TABLE ===== */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Total Sales</th>
              <th>Total Cost</th>
              <th>Net Profit / Loss</th>
            </tr>
          </thead>

          <tbody>
            {monthlyData.map((m, index) => (
              <tr key={index}>
                <td>{m.month}</td>
                <td>PKR {m.totalSales.toLocaleString()}</td>
                <td>PKR {m.totalCost.toLocaleString()}</td>
                <td className={m.netProfit >= 0 ? "profit" : "loss"}>
                  PKR {m.netProfit.toLocaleString()}
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
