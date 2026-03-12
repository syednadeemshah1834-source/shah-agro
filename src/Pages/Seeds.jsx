import React, { useState, useEffect } from "react";
import "./Seeds.css";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

const shopId = "mainshop";

const Seeds = () => {
  const [seedItems, setSeedItems] = useState([]);
  const [filteredSeeds, setFilteredSeeds] = useState([]);
  const [editId, setEditId] = useState(null);
  const [totalSeedValue, setTotalSeedValue] = useState(0);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    variety: "",
    quantity: "",
    rate: "",
    supplier: "",
    expiry: "",
  });

  /* ================= REALTIME FETCH ================= */
  useEffect(() => {
    const ref = collection(db, "shops", shopId, "seeds");
    const q = query(ref, orderBy("name", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const seeds = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSeedItems(seeds);
      setFilteredSeeds(seeds);
      calculateTotal(seeds);
    });

    return () => unsubscribe();
  }, []);

  /* ================= CALCULATE TOTAL ================= */
  const calculateTotal = (seeds) => {
    const total = seeds.reduce(
      (acc, item) =>
        acc + Number(item.quantity || 0) * Number(item.rate || 0),
      0
    );
    setTotalSeedValue(total);
  };

  /* ================= ANIMATED COUNTER ================= */
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const step = totalSeedValue / (duration / 20);

    const counter = setInterval(() => {
      start += step;
      if (start >= totalSeedValue) {
        start = totalSeedValue;
        clearInterval(counter);
      }
      setAnimatedTotal(Math.floor(start));
    }, 20);

    return () => clearInterval(counter);
  }, [totalSeedValue]);

  /* ================= ADD / UPDATE ================= */
  const handleAddOrUpdate = async () => {
    if (
      !formData.name ||
      !formData.variety ||
      !formData.quantity ||
      !formData.rate ||
      !formData.expiry
    ) {
      alert("Please fill all required fields!");
      return;
    }

    const payload = {
      ...formData,
      quantity: Number(formData.quantity),
      rate: Number(formData.rate),
    };

    if (editId) {
      await updateDoc(doc(db, "shops", shopId, "seeds", editId), payload);
      setEditId(null);
    } else {
      await addDoc(collection(db, "shops", shopId, "seeds"), payload);
    }

    setFormData({
      name: "",
      variety: "",
      quantity: "",
      rate: "",
      supplier: "",
      expiry: "",
    });

    setPopupOpen(false);
  };

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
    setPopupOpen(true);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (window.confirm("Delete this seed?")) {
      await deleteDoc(doc(db, "shops", shopId, "seeds", id));
    }
  };

  /* ================= EXPIRY COLOR ================= */
  const getExpiryClass = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (expiry < today) return "sa-expired";
    if (diffDays <= 30) return "sa-near-expiry";
    return "";
  };

  const getProgress = (quantity) => {
    const max = 500;
    return Math.min((quantity / max) * 100, 100);
  };

  /* ================= SEARCH ================= */
  useEffect(() => {
    const filtered = seedItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSeeds(filtered);
  }, [searchQuery, seedItems]);

  return (
    <div className="sa-page-container">
      <h1 className="sa-page-title">Seeds Inventory (Main Shop)</h1>

      {/* ===== SEARCH CENTERED ===== */}
      <div className="sa-search-container-center">
        <input
          type="text"
          placeholder="Search seeds, variety or supplier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sa-search-input"
        />
      </div>

      {/* ===== Animated Total Card ===== */}
      <div className="sa-total-card">
        Total Inventory Value
        <span>PKR {animatedTotal.toLocaleString()}</span>
      </div>

      {/* ===== Add Fertilizer Button ===== */}
      <button
        className="sa-open-popup-btn"
        onClick={() => setPopupOpen(true)}
      >
        Add Seeds
      </button>

      {/* ===== POPUP ===== */}
      {popupOpen && (
        <div className="sa-popup-overlay">
          <div className="sa-popup">
            <h2>{editId ? "Edit Seed" : "Add New Seed"}</h2>
            <div className="sa-popup-form">
              {["name", "variety", "quantity", "rate", "supplier"].map(
                (field) => (
                  <input
                    key={field}
                    type={
                      field === "quantity" || field === "rate"
                        ? "number"
                        : "text"
                    }
                    placeholder={field}
                    value={formData[field]}
                    onChange={(e) =>
                      setFormData({ ...formData, [field]: e.target.value })
                    }
                  />
                )
              )}

              <input
                type="date"
                value={formData.expiry}
                onChange={(e) =>
                  setFormData({ ...formData, expiry: e.target.value })
                }
              />

              <div className="sa-popup-actions">
                <button onClick={handleAddOrUpdate}>
                  {editId ? "Update Seed" : "Add Seed"}
                </button>
                <button onClick={() => setPopupOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TABLE ===== */}
      {filteredSeeds.length > 0 && (
        <div className="sa-seed-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Variety</th>
                <th>Stock</th>
                <th>Rate</th>
                <th>Total</th>
                <th>Supplier</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSeeds.map((item) => {
                const progress = getProgress(item.quantity);
                const isLow = item.quantity < 50;

                return (
                  <tr key={item.id}>
                    <td>
                      {item.name} {isLow && <span className="sa-low-badge">Low</span>}
                    </td>
                    <td>{item.variety}</td>
                    <td>
                      {item.quantity}
                      <div className="sa-progress-bar">
                        <div
                          className="sa-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </td>
                    <td>{Number(item.rate).toLocaleString()}</td>
                    <td>
                      {(Number(item.quantity) * Number(item.rate)).toLocaleString()}
                    </td>
                    <td>{item.supplier}</td>
                    <td className={getExpiryClass(item.expiry)}>{item.expiry}</td>
                    <td>
                      <button onClick={() => handleEdit(item)}>Edit</button>
                      <button onClick={() => handleDelete(item.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}

              <tr className="sa-total-row">
                <td colSpan="4">Total Inventory Value</td>
                <td colSpan="4">PKR {animatedTotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Seeds;
