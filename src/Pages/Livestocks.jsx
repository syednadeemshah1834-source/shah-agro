import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import "./Livestocks.css";

const shopId = "mainshop";

/* ================= SAFE READERS ================= */

const readName = (obj) =>
  obj?.name ||
  obj?.itemName ||
  obj?.productName ||
  obj?.item ||
  obj?.title ||
  "Unknown Item";

const readQty = (obj) =>
  Number(obj?.quantity || obj?.qty || obj?.stock || obj?.totalQty || 0);

const readRate = (obj) =>
  Number(
    obj?.rate ||
    obj?.price ||
    obj?.costPrice ||
    obj?.purchasePrice ||
    obj?.unitPrice ||
    0
  );

/* ================= COUNT ANIMATION ================= */

const CountUp = ({ value }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.floor(value * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
};

const Customers = () => {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [seeds, setSeeds] = useState([]);
  const [fertilizers, setFertilizers] = useState([]);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const unsubSales = onSnapshot(
      collection(db, "shops", shopId, "sales"),
      (snap) => setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubPurchases = onSnapshot(
      collection(db, "shops", shopId, "purchases"),
      (snap) => setPurchases(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubInventory = onSnapshot(
      collection(db, "shops", shopId, "inventory"),
      (snap) => setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubSeeds = onSnapshot(
      collection(db, "shops", shopId, "seeds"),
      (snap) => setSeeds(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubFertilizers = onSnapshot(
      collection(db, "shops", shopId, "fertilizers"),
      (snap) => setFertilizers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubSales();
      unsubPurchases();
      unsubInventory();
      unsubSeeds();
      unsubFertilizers();
    };
  }, []);

  /* ================= SMART STOCK ENGINE ================= */

  const stockData = useMemo(() => {
    const map = {};

    const ensureItem = (name, rate = 0) => {
      if (!map[name]) {
        map[name] = {
          name,
          inventoryStock: 0,
          purchased: 0,
          sold: 0,
          finalStock: 0,
          rate
        };
      }
    };

    /* 1️⃣ LOAD INVENTORY AS MASTER LIVE STOCK */

    inventory.forEach(item => {
      const name = readName(item);
      const qty = readQty(item);
      const rate = readRate(item);

      ensureItem(name, rate);
      map[name].inventoryStock = qty;
      map[name].rate = rate;
    });

    /* 2️⃣ ADD SEEDS & FERTILIZERS ONLY IF NOT IN INVENTORY */

    [...seeds, ...fertilizers].forEach(item => {
      const name = readName(item);
      const qty = readQty(item);
      const rate = readRate(item);

      if (!map[name]) {
        ensureItem(name, rate);
        map[name].inventoryStock = qty;
        map[name].rate = rate;
      }
    });

    /* 3️⃣ TRACK PURCHASES (SUPPLIER RECORD ONLY) */

    purchases.forEach(p => {
      if (Array.isArray(p.items)) {
        p.items.forEach(item => {
          const name = readName(item);
          const qty = readQty(item);
          ensureItem(name);
          map[name].purchased += qty;
        });
      }
    });

    /* 4️⃣ TRACK SALES */

    sales.forEach(s => {
      if (Array.isArray(s.items)) {
        s.items.forEach(item => {
          const name = readName(item);
          const qty = readQty(item);
          ensureItem(name);
          map[name].sold += qty;
        });
      }
    });

    /* 5️⃣ FINAL STOCK = INVENTORY (already live updated) */

    Object.values(map).forEach(item => {
      item.finalStock = item.inventoryStock;
    });

    return Object.values(map);
  }, [inventory, purchases, sales, seeds, fertilizers]);

  /* ================= TOTALS ================= */

  const totalInventoryValue = stockData.reduce(
    (sum, item) => sum + item.finalStock * item.rate,
    0
  );

  const totalCashIn = sales.reduce(
    (sum, s) => sum + Number(s.totalAmount || s.total || 0),
    0
  );

  const totalCashOut = purchases.reduce(
    (sum, p) => sum + Number(p.total || p.totalAmount || 0),
    0
  );

  const netBalance = totalCashIn - totalCashOut;

  /* ================= UI ================= */

  return (
    <div className="finance-wrapper">
      <h1>Inventory & Financial Control Center</h1>

      <div className="cash-cards">
        <div className="card cash-in">
          <h3>Total Sales</h3>
          <h2>PKR <CountUp value={totalCashIn} /></h2>
        </div>

        <div className="card cash-out">
          <h3>Total Purchases</h3>
          <h2>PKR <CountUp value={totalCashOut} /></h2>
        </div>

        <div className="card inventory-value">
          <h3>Total Inventory Value</h3>
          <h2>PKR <CountUp value={totalInventoryValue} /></h2>
        </div>

        <div className={`card ${netBalance >= 0 ? "profit" : "loss"}`}>
          <h3>Net Balance</h3>
          <h2>PKR <CountUp value={netBalance} /></h2>
        </div>
      </div>

      <div className="stock-table">
        <h3>Live Stock (Inventory Based)</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Supplier Purchased</th>
              <th>Sold</th>
              <th>Live Inventory Stock</th>
              <th>Stock Value</th>
            </tr>
          </thead>
          <tbody>
            {stockData.map(item => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.purchased}</td>
                <td>{item.sold}</td>
                <td>{item.finalStock}</td>
                <td>
                  PKR {(item.finalStock * item.rate).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;

