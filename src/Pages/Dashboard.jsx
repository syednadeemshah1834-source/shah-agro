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
  ReferenceLine
} from "recharts";

import { useNavigate } from "react-router-dom";

import "./Dashboard.css";

const shopId = "mainshop";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="tooltip-entry">
            <span className="tooltip-dot" style={{ backgroundColor: entry.color || entry.fill }}></span>
            <span className="tooltip-name">{entry.name}:</span>
            <span className="tooltip-value">PKR {Number(entry.value).toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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

  const { chartData, avgSales, avgProfit } = useMemo(() => {

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

    let totalS = 0;
    let totalP = 0;

    months.forEach(m => {
      m.profit = m.sales - m.purchases;
      totalS += m.sales;
      totalP += m.profit;
    });

    return { 
      chartData: months, 
      avgSales: totalS / 12, 
      avgProfit: totalP / 12 
    };

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
          <div className="chart-card-header">
            <h3>Monthly Sales Trend</h3>
            <p>Revenue performance over time with average baseline</p>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 700 }}
                dy={12}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 700 }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: 'var(--accent-secondary)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
              />
              <ReferenceLine 
                y={avgSales} 
                label={{ position: 'right', value: 'Avg', fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 800 }} 
                stroke="var(--text-secondary)" 
                strokeDasharray="3 3" 
                strokeOpacity={0.5}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--accent-secondary)"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorSales)"
                animationDuration={2000}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff", fill: "var(--accent-secondary)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Profit & Sales Correlation</h3>
            <p>Earnings vs acquisition volume</p>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={1}/>
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 700 }}
                dy={12}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 700 }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(226, 232, 240, 0.2)' }} />
              <ReferenceLine 
                y={avgProfit} 
                stroke="#10b981" 
                strokeDasharray="3 3" 
                strokeOpacity={0.5}
                label={{ position: 'right', value: 'Goal', fill: '#10b981', fontSize: 10, fontWeight: 800 }}
              />
              <Bar
                dataKey="profit"
                name="Net Profit"
                fill="url(#colorProfit)"
                radius={[4, 4, 0, 0]}
                barSize={24}
                animationDuration={2000}
              />
              <Bar
                dataKey="purchases"
                name="Expenses"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                barSize={12}
                animationDuration={2000}
                opacity={0.4}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>


  );

};

export default Dashboard;
