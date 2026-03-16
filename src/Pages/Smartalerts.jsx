import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "./Smartalerts.css";

const shopId = "mainshop";

/* ================= WEATHER SETTINGS ================= */
const WEATHER_API_KEY = "YOUR_API_KEY"; // paste your real key
const CITY = "Lahore";

/* ================= COMPONENT ================= */
const Smartalerts = () => {
  /* ================= STATES ================= */
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [seeds, setSeeds] = useState([]);
  const [fertilizers, setFertilizers] = useState([]);
  const [search, setSearch] = useState("");
  const [weather, setWeather] = useState({
    temp: "--",
    humidity: "--",
    condition: "--",
    monthlyAvg: "--"
  });

  /* ================= FETCH ALL COLLECTIONS ================= */
  useEffect(() => {
    const unsubPurchases = onSnapshot(
      collection(db, "shops", shopId, "purchases"),
      snap => setPurchases(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    const unsubSales = onSnapshot(
      collection(db, "shops", shopId, "sales"),
      snap => setSales(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    const unsubInventory = onSnapshot(
      collection(db, "shops", shopId, "inventory"),
      snap => setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    const unsubSeeds = onSnapshot(
      collection(db, "shops", shopId, "seeds"),
      snap => setSeeds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    const unsubFertilizers = onSnapshot(
      collection(db, "shops", shopId, "fertilizers"),
      snap => setFertilizers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    return () => {
      unsubPurchases();
      unsubSales();
      unsubInventory();
      unsubSeeds();
      unsubFertilizers();
    };
  }, []);

  /* ================= WEATHER ================= */
  useEffect(() => {
    if (!WEATHER_API_KEY || WEATHER_API_KEY === "YOUR_API_KEY") return;
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric`)
      .then(res => res.json())
      .then(data => {
        setWeather({
          temp: Math.round(data.main.temp),
          humidity: data.main.humidity,
          condition: data.weather[0].main,
          monthlyAvg: Math.round(data.main.temp)
        });
      })
      .catch(console.error);
  }, []);

  /* ================= STOCK CALCULATION ================= */
  const stockMap = useMemo(() => {
    const map = {};
    const addStock = (items) => {
      items.forEach(item => {
        const name = item.itemName || item.name || "Unknown";
        const qty = Number(item.quantity || item.qty || 0);
        if (!map[name]) map[name] = 0;
        map[name] += qty;
      });
    };
    const subtractStock = (items) => {
      items.forEach(item => {
        const name = item.itemName || item.name || "Unknown";
        const qty = Number(item.quantity || item.qty || 0);
        if (!map[name]) map[name] = 0;
        map[name] -= qty;
      });
    };
    addStock(purchases);
    addStock(inventory);
    addStock(seeds);
    addStock(fertilizers);
    subtractStock(sales);
    return map;
  }, [purchases, sales, inventory, seeds, fertilizers]);

  /* ================= SORT STOCK ================= */
  const sortedStock = Object.entries(stockMap)
    .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a[1] - b[1]);

  const lowStockItems = sortedStock.filter(([_, qty]) => qty > 0 && qty <= 20).slice(0, 10);
  const highStockItems = [...sortedStock].reverse().filter(([_, qty]) => qty >= 50).slice(0, 10);

  /* ================= EXPIRY ================= */
  const expiryItems = purchases.filter(item => {
    if (!item.expiryDate) return false;
    const days = (new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 30;
  });

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>Smart Inventory & Risk Alerts</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Intelligent monitoring of stock levels, product expiries, and environmental conditions</p>
      </div>
      <div className="search-container">
        <input
          className="search-input"
          placeholder="Filter alerts by item name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="alerts-grid">
        <div className="alert-card low">
          <h3><span>⚠️</span> Low Stock Threshold</h3>
          <div className="alert-items-list">
            {lowStockItems.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>All inventory levels are optimal.</p>
            ) : (
              lowStockItems.map(([name, qty]) => (
                <div key={name} className="item-row">
                  <span className="name">{name}</span>
                  <span className="qty">{qty} Units</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="alert-card high">
          <h3><span>📈</span> High Volume Inventory</h3>
          <div className="alert-items-list">
            {highStockItems.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No high-volume items recorded.</p>
            ) : (
              highStockItems.map(([name, qty]) => (
                <div key={name} className="item-row">
                  <span className="name">{name}</span>
                  <span className="qty">{qty} Units</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="alert-card expiry">
          <h3><span>⏳</span> Imminent Expiries</h3>
          <div className="alert-items-list">
            {expiryItems.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No items expiring within 30 days.</p>
            ) : (
              expiryItems.map(item => (
                <div key={item.id} className="item-row">
                  <span className="name">{item.itemName}</span>
                  <span style={{ fontSize: "11px", color: "#b45309" }}>{item.expiryDate}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="alert-card weather">
          <h3><span>☀️</span> Regional Weather ({CITY})</h3>
          <div className="weather-info">
            <div className="weather-row">
              <span className="label">Current Temperature</span>
              <span className="weather-value">{weather.temp}°C</span>
            </div>
            <div className="weather-row">
              <span className="label">Relative Humidity</span>
              <span className="weather-value">{weather.humidity}%</span>
            </div>
            <div className="weather-row">
              <span className="label">Climatic Condition</span>
              <span className="weather-value">{weather.condition}</span>
            </div>
            <div className="weather-row" style={{ borderBottom: "none" }}>
              <span className="label">Seasonal Average</span>
              <span className="weather-value">{weather.monthlyAvg}°C</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Smartalerts;
