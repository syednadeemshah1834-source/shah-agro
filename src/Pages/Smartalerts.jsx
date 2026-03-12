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

    if (!WEATHER_API_KEY || WEATHER_API_KEY === "YOUR_API_KEY")
      return;

    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric`
    )
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

        const name =
          item.itemName ||
          item.name ||
          "Unknown";

        const qty =
          Number(item.quantity || item.qty || 0);

        if (!map[name])
          map[name] = 0;

        map[name] += qty;

      });
    };

    const subtractStock = (items) => {
      items.forEach(item => {

        const name =
          item.itemName ||
          item.name ||
          "Unknown";

        const qty =
          Number(item.quantity || item.qty || 0);

        if (!map[name])
          map[name] = 0;

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
    .filter(([name]) =>
      name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a[1] - b[1]);

  const lowStockItems = sortedStock
    .filter(([_, qty]) => qty > 0 && qty <= 20)
    .slice(0, 10);

  const highStockItems = [...sortedStock]
    .reverse()
    .filter(([_, qty]) => qty >= 50)
    .slice(0, 10);

  /* ================= EXPIRY ================= */

  const expiryItems = purchases.filter(item => {

    if (!item.expiryDate)
      return false;

    const days =
      (new Date(item.expiryDate) - new Date()) /
      (1000 * 60 * 60 * 24);

    return days <= 30;

  });

  /* ================= UI ================= */

  return (

    <div className="smartalerts-container">

      <h1 className="page-title">
        Smart Inventory Alerts
      </h1>

      {/* SEARCH */}

      <input
        className="search-input"
        placeholder="Search item..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      {/* GRID */}

      <div className="cards-grid">

        {/* LOW STOCK */}

        <div className="alert-card low">

          <h2>Low Stock</h2>

          {lowStockItems.length === 0
            ? <p>No low stock</p>
            : lowStockItems.map(([name, qty]) => (
              <div key={name} className="item-row">
                {name}
                <span>{qty}</span>
              </div>
            ))
          }

        </div>

        {/* HIGH STOCK */}

        <div className="alert-card high">

          <h2>High Stock</h2>

          {highStockItems.length === 0
            ? <p>No high stock</p>
            : highStockItems.map(([name, qty]) => (
              <div key={name} className="item-row">
                {name}
                <span>{qty}</span>
              </div>
            ))
          }

        </div>

        {/* EXPIRY */}

        <div className="alert-card expiry">

          <h2>Expiry Soon</h2>

          {expiryItems.length === 0
            ? <p>No expiry items</p>
            : expiryItems.map(item => (
              <div key={item.id} className="item-row">
                {item.itemName}
              </div>
            ))
          }

        </div>

        {/* WEATHER */}

        <div className="alert-card weather">

          <h2>Weather ({CITY})</h2>

          <div className="weather-row">
            Temp: {weather.temp}°C
          </div>

          <div className="weather-row">
            Humidity: {weather.humidity}%
          </div>

          <div className="weather-row">
            Condition: {weather.condition}
          </div>

          <div className="weather-row">
            Monthly Avg: {weather.monthlyAvg}°C
          </div>

        </div>

      </div>

    </div>

  );

};

export default Smartalerts;
