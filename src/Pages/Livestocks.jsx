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

const FinancialControlCenter = () => {
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

    inventory.forEach(item => {
      const name = readName(item);
      const qty = readQty(item);
      const rate = readRate(item);
      ensureItem(name, rate);
      map[name].inventoryStock = qty;
      map[name].rate = rate;
    });

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

    purchases.forEach(p => {
      const name = readName(p);
      const qty = readQty(p);
      ensureItem(name);
      map[name].purchased += qty;
    });

    sales.forEach(s => {
      const name = readName(s);
      const qty = readQty(s);
      ensureItem(name);
      map[name].sold += qty;
    });

    Object.values(map).forEach(item => {
      item.finalStock = item.inventoryStock + item.purchased - item.sold;
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
    <div className="page-wrapper">
      <div className="page-header">
        <h2>Inventory & Financial Control Center</h2>
        <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Shop: {shopId.toUpperCase()}</div>
      </div>

      <div className="financial-grid">
        <div className="finance-card sales">
          <h3>Total Revenue</h3>
          <div className="amount">PKR <CountUp value={totalCashIn} /></div>
        </div>

        <div className="finance-card purchases">
          <h3>Total Expenditure</h3>
          <div className="amount">PKR <CountUp value={totalCashOut} /></div>
        </div>

        <div className="finance-card inventory">
          <h3>Asset Valuation</h3>
          <div className="amount">PKR <CountUp value={totalInventoryValue} /></div>
        </div>

        <div className={`finance-card balance ${netBalance >= 0 ? "profit" : "loss"}`}>
          <h3>Net Operational Cashflow</h3>
          <div className="amount">PKR <CountUp value={netBalance} /></div>
        </div>
      </div>

      <div className="table-container">
        <h3>Real-time Stock Synchronization</h3>
        <table>
          <thead>
            <tr>
              <th>Stock Item</th>
              <th>Units Procured</th>
              <th>Units Dispatched</th>
              <th>Available Units</th>
              <th>Current Valuation</th>
            </tr>
          </thead>
          <tbody>
            {stockData.map(item => (
              <tr key={item.name}>
                <td className="item-name">{item.name}</td>
                <td>{item.purchased}</td>
                <td>{item.sold}</td>
                <td className="stock-value">{item.finalStock}</td>
                <td className="valuation-cell">
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

export default FinancialControlCenter;

