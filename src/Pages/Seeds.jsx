import React, { useState, useEffect, useMemo } from "react";
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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const shopId = "mainshop";

const Seeds = () => {
  const [seedItems, setSeedItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [filteredSeeds, setFilteredSeeds] = useState([]);
  const [editId, setEditId] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    variety: "",
    quantity: "",
    rate: "",
    supplier: "",
    cellNo: "",
    expiry: "",
  });

  useEffect(() => {
    const ref = collection(db, "shops", shopId, "seeds");
    const salesRef = collection(db, "shops", shopId, "sales");
    const purchasesRef = collection(db, "shops", shopId, "purchases");

    const unsubSeeds = onSnapshot(query(ref, orderBy("name", "asc")), (snapshot) => {
      const seeds = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSeedItems(seeds);
    });

    const unsubSales = onSnapshot(salesRef, (snapshot) => {
      setSales(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubPurchases = onSnapshot(purchasesRef, (snapshot) => {
      setPurchases(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubSeeds();
      unsubSales();
      unsubPurchases();
    };
  }, []);

  /* ================= LIVE STOCK ================= */
  const liveStock = useMemo(() => {
    const map = {};
    seedItems.forEach((item) => {
      map[item.name] = (map[item.name] || 0) + Number(item.quantity);
    });
    purchases.forEach((p) => {
      map[p.itemName] = (map[p.itemName] || 0) + Number(p.quantity);
    });
    sales.forEach((s) => {
      map[s.itemName] = (map[s.itemName] || 0) - Number(s.quantity);
    });
    return map;
  }, [seedItems, sales, purchases]);

  const totalSeedValue = useMemo(() => {
    return seedItems.reduce((acc, item) => {
      const qty = liveStock[item.name] || 0;
      return acc + qty * Number(item.rate || 0);
    }, 0);
  }, [seedItems, liveStock]);

  const handleAddOrUpdate = async () => {
    if (!formData.name || !formData.variety || !formData.quantity || !formData.rate || !formData.expiry) {
      alert("Please fill all required fields!");
      return;
    }
    const payload = { ...formData, quantity: Number(formData.quantity), rate: Number(formData.rate) };
    if (editId) {
      await updateDoc(doc(db, "shops", shopId, "seeds", editId), payload);
      setEditId(null);
    } else {
      await addDoc(collection(db, "shops", shopId, "seeds"), { ...payload, quantity: 0 }); // Master holds 0
      
      // Automatically log the purchase
      if (Number(formData.quantity) > 0) {
        await addDoc(collection(db, "shops", shopId, "purchases"), {
          supplierName: formData.supplier || "Direct",
          cellNo: formData.cellNo || "-",
          itemName: formData.name,
          quantity: Number(formData.quantity),
          price: Number(formData.rate),
          total: Number(formData.quantity) * Number(formData.rate),
          createdAt: serverTimestamp(), // Make sure serverTimestamp is imported if not already
        });
      }
    }
    setFormData({ name: "", variety: "", quantity: "", rate: "", supplier: "", cellNo: "", expiry: "" });
    setPopupOpen(false);
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
    setPopupOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this seed?")) {
      await deleteDoc(doc(db, "shops", shopId, "seeds", id));
    }
  };

  const getExpiryClass = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (expiry < today) return "expiry-expired";
    if (diffDays <= 30) return "expiry-near";
    return "";
  };

  const getProgress = (quantity) => {
    const max = 500;
    return Math.min((quantity / max) * 100, 100);
  };

  useEffect(() => {
    const filtered = seedItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSeeds(filtered);
  }, [searchQuery, seedItems]);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>Seeds Inventory Management</h2>
        <button className="btn btn-primary" onClick={() => setPopupOpen(true)}>Add New Seed Stock</button>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><h3>Total Seeds Value</h3><div className="value">PKR {totalSeedValue?.toLocaleString()}</div></div>
        <div className="stat-card"><h3>Unique Products</h3><div className="value">{seedItems?.length}</div></div>
      </div>
      <div className="search-bar-container"><input type="text" className="search-input" placeholder="Filter seeds, variety or supplier..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
      <div className="table-wrapper">
        <div className="table-container">
        <table>
          <thead>
            <tr><th>Seed Product</th><th>Variety</th><th>Available Stock</th><th>Unit Rate</th><th>Total Value</th><th>Supplier</th><th>Expiry Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredSeeds.map((item) => {
              const currentStock = liveStock[item.name] || 0;
              const progress = getProgress(currentStock);
              const isLow = currentStock < 50;
              const expiryClass = getExpiryClass(item.expiry);
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.name} {isLow && <span className="low-stock-badge">Low</span>}</td>
                  <td>{item.variety}</td>
                  <td><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ minWidth: "30px" }}>{currentStock}</span><div className="progress-wrapper"><div className={`progress-fill ${isLow ? "low" : ""}`} style={{ width: `${progress}%` }} /></div></div></td>
                  <td>PKR {Number(item.rate).toLocaleString()}</td>
                  <td style={{ fontWeight: 500 }}>PKR {(currentStock * Number(item.rate)).toLocaleString()}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{item.supplier}</td>
                  <td className={expiryClass}>{item.expiry}</td>
                  <td><div className="action-btns"><button className="edit-btn" onClick={() => handleEdit(item)}>Edit</button><button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
      {popupOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editId ? "Update Seed Details" : "Record New Seed Stock"}</h3>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group"><label>Seed Name</label><input className="form-input" placeholder="e.g. Hybrid Corn" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="form-group"><label>Variety</label><input className="form-input" placeholder="e.g. XL-101" value={formData.variety} onChange={(e) => setFormData({ ...formData, variety: e.target.value })} /></div>
              <div className="grid-2-col">
                <div className="form-group"><label>Quantity</label><input className="form-input" type="number" placeholder="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} /></div>
                <div className="form-group"><label>Unit Rate (PKR)</label><input className="form-input" type="number" placeholder="0" value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: e.target.value })} /></div>
              </div>
              <div className="grid-2-col">
                <div className="form-group"><label>Supplier Source</label><input className="form-input" placeholder="Enter supplier name" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} /></div>
                <div className="form-group"><label>Supplier Cell No</label><input className="form-input" placeholder="Enter cell no" value={formData.cellNo} onChange={(e) => setFormData({ ...formData, cellNo: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Expiry Date</label><input className="form-input" type="date" value={formData.expiry} onChange={(e) => setFormData({ ...formData, expiry: e.target.value })} /></div>
              <div className="modal-footer"><button className="btn-save" onClick={handleAddOrUpdate}>{editId ? "Update Stock" : "Save Entry"}</button><button className="btn-cancel" onClick={() => setPopupOpen(false)}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seeds;
