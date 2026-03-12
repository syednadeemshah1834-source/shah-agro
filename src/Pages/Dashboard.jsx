import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

import { useNavigate } from "react-router-dom";

import "./Dashboard.css";

const shopId = "mainshop";

const Dashboard = () => {

  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [dueBills, setDueBills] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  /* ================= FIRESTORE ================= */

  useEffect(() => {

    const unsubSales = onSnapshot(
      collection(db, "shops", shopId, "sales"),
      (snapshot) => {
        setSales(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }
    );

    const unsubPurchases = onSnapshot(
      collection(db, "shops", shopId, "purchases"),
      (snapshot) => {
        setPurchases(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }
    );

    const unsubDue = onSnapshot(
      collection(db, "shops", shopId, "dueBills"),
      (snapshot) => {
        setDueBills(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }
    );

    return () => {
      unsubSales();
      unsubPurchases();
      unsubDue();
    };

  }, []);

  /* ================= MONTHLY DATA ================= */

  const chartData = useMemo(() => {

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString("default", { month: "short" }),
      sales: 0,
      purchases: 0,
      profit: 0
    }));

    sales.forEach(s => {
      if (!s.createdAt?.toDate) return;
      const m = s.createdAt.toDate().getMonth();
      months[m].sales += Number(s.totalAmount || 0);
    });

    purchases.forEach(p => {
      if (!p.createdAt?.toDate) return;
      const m = p.createdAt.toDate().getMonth();
      months[m].purchases += Number(p.total || 0);
    });

    months.forEach(m => {
      m.profit = m.sales;
    });

    return months;

  }, [sales, purchases]);

  const currentMonthData = chartData[selectedMonth] || {
    sales: 0,
    purchases: 0,
    profit: 0
  };

  /* ================= TOTAL DUE ================= */

  const totalDue = dueBills.reduce(
    (sum, d) => sum + Number(d.remainingAmount || 0),
    0
  );

  /* ================= CUSTOMERS ================= */

  const totalCustomers = useMemo(() => {

    const set = new Set();

    sales.forEach(s => {
      if (s.customerName) set.add(s.customerName);
    });

    dueBills.forEach(d => {
      if (d.customerName) set.add(d.customerName);
    });

    return set.size;

  }, [sales, dueBills]);

  /* ================= COUNTER ================= */

  const useCounter = (value) => {

    const [count, setCount] = useState(0);

    useEffect(() => {

      let start = 0;
      const duration = 800;
      const step = value / (duration / 16);

      const timer = setInterval(() => {

        start += step;

        if (start >= value) {
          setCount(value);
          clearInterval(timer);
        }
        else {
          setCount(Math.floor(start));
        }

      }, 16);

      return () => clearInterval(timer);

    }, [value]);

    return count;

  };

  const animatedSales = useCounter(currentMonthData.sales);
  const animatedProfit = useCounter(currentMonthData.profit);
  const animatedDue = useCounter(totalDue);

  /* ================= NAVIGATION FUNCTIONS ================= */

  const goToSales = () => navigate("/sales");

  const goToProfit = () => navigate("/profit-loss");

  const goToCustomers = () => navigate("/duebills");

  const goToDue = () => navigate("/duebills");

  /* ================= UI ================= */

  return (

    <div className="dashboard-wrapper">

      <div className="dashboard-header">
        <h1>Enterprise Business Dashboard</h1>
        <p>Real-Time Financial Intelligence</p>
      </div>

      {/* MONTH SELECTOR */}

      <div className="month-selector">

        {chartData.map((m, index) => (

          <button
            key={index}
            className={
              selectedMonth === index
                ? "active-month"
                : ""
            }
            onClick={() =>
              setSelectedMonth(index)
            }
          >
            {m.month}
          </button>

        ))}

      </div>

      {/* KPI CARDS */}

      <div className="dashboard-cards">

        {/* SALES */}

        <div
          className="dashboard-card sales clickable"
          onClick={goToSales}
        >
          <h4>Total Sales</h4>
          <h2>
            PKR {animatedSales.toLocaleString()}
          </h2>
        </div>

        {/* PROFIT */}

        <div
          className="dashboard-card profit clickable"
          onClick={goToProfit}
        >
          <h4>Net Profit</h4>
          <h2>
            PKR {animatedProfit.toLocaleString()}
          </h2>
        </div>

        {/* CUSTOMERS */}

        <div
          className="dashboard-card customers clickable"
          onClick={goToCustomers}
        >
          <h4>Total Customers</h4>
          <h2>
            {totalCustomers}
          </h2>
        </div>

        {/* DUE */}

        <div
          className="dashboard-card due clickable"
          onClick={goToDue}
        >
          <h4>Total Due</h4>
          <h2>
            PKR {animatedDue.toLocaleString()}
          </h2>
        </div>

      </div>

      {/* CHARTS */}

      <div className="dashboard-charts">

        <div className="chart-card">

          <h3>Monthly Sales Trend</h3>

          <ResponsiveContainer width="100%" height={300}>

            <AreaChart data={chartData}>

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="sales"
                stroke="#6366f1"
                fill="#6366f1"
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

        <div className="chart-card">

          <h3>Monthly Profit Overview</h3>

          <ResponsiveContainer width="100%" height={300}>

            <BarChart data={chartData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="profit"
                fill="#10b981"
                radius={[6,6,0,0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>

  );

};

export default Dashboard;
