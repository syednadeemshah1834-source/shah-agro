import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import "./Fertilizers.css";

const Fertilizers = () => {
  const shopId = "mainshop";

  const [fertilizers, setFertilizers] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    rate: "",
    supplier: "",
    cellNo: "",
    expiry: "",
  });

  useEffect(() => {
    const fertRef = collection(db, "shops", shopId, "fertilizers");
    const salesRef = collection(db, "shops", shopId, "sales");
    const purchasesRef = collection(db, "shops", shopId, "purchases");

    const unsubFert = onSnapshot(fertRef, (snapshot) => {
      setFertilizers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubSales = onSnapshot(salesRef, (snapshot) => {
      setSales(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPurchases = onSnapshot(purchasesRef, (snapshot) => {
      setPurchases(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubFert();
      unsubSales();
      unsubPurchases();
    };
  }, []);

  const liveStock = useMemo(() => {
    const map = {};
    fertilizers.forEach((item) => {
      map[item.name] = (map[item.name] || 0) + Number(item.quantity);
    });
    purchases.forEach((p) => {
      map[p.itemName] = (map[p.itemName] || 0) + Number(p.quantity);
    });
    sales.forEach((sale) => {
      map[sale.itemName] = (map[sale.itemName] || 0) - Number(sale.quantity);
    });
    return map;
  }, [fertilizers, sales, purchases]);

  const itemValue = useCallback((name, rate) => {
    const stock = liveStock[name] || 0;
    return stock * rate;
  }, [liveStock]);

  const grandTotalValue = useMemo(() => {
    return fertilizers.reduce((total, item) => {
      return total + itemValue(item.name, item.rate);
    }, 0);
  }, [fertilizers, itemValue]);

  const filtered = fertilizers.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.quantity || !formData.rate) {
      alert("Please fill required fields");
      return;
    }
    if (editingItem) {
      await updateDoc(doc(db, "shops", shopId, "fertilizers", editingItem.id), {
        name: formData.name,
        quantity: Number(formData.quantity),
        rate: Number(formData.rate),
        supplier: formData.supplier,
        cellNo: formData.cellNo,
        expiry: formData.expiry,
      });
    } else {
      await addDoc(collection(db, "shops", shopId, "fertilizers"), {
        name: formData.name,
        quantity: 0, // Master holds 0
        rate: Number(formData.rate),
        supplier: formData.supplier,
        cellNo: formData.cellNo,
        expiry: formData.expiry,
        createdAt: serverTimestamp(),
      });
      
      // Automatically log the purchase
      if (Number(formData.quantity) > 0) {
        await addDoc(collection(db, "shops", shopId, "purchases"), {
          supplierName: formData.supplier || "Direct",
          cellNo: formData.cellNo || "-",
          itemName: formData.name,
          quantity: Number(formData.quantity),
          price: Number(formData.rate),
          total: Number(formData.quantity) * Number(formData.rate),
          createdAt: serverTimestamp(),
        });
      }
    }
    resetForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this fertilizer?")) {
      await deleteDoc(doc(db, "shops", shopId, "fertilizers", id));
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      rate: item.rate,
      supplier: item.supplier,
      cellNo: item.cellNo || "",
      expiry: item.expiry,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ name: "", quantity: "", rate: "", supplier: "", cellNo: "", expiry: "" });
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>Fertilizers Inventory</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add New Fertilizer
        </button>
      </div>
      <div className="search-container">
        <input
          className="search-input"
          placeholder="Filter fertilizers by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="table-wrapper">
        <div className="table-container">
        {filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Loading stock data...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Current Stock</th>
                <th>Unit Rate</th>
                <th>Total Value</th>
                <th>Supplier</th>
                <th>Expiry Date</th>
                <th>Record Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const stock = liveStock[item.name] || 0;
                const totalValue = itemValue(item.name, item.rate);
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td className="stock-value">{stock}</td>
                    <td className="price-value">PKR {item.rate?.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>PKR {totalValue.toLocaleString()}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{item.supplier}</td>
                    <td style={{ fontSize: "13px" }}>{item.expiry}</td>
                    <td>
                      <div className="action-btns">
                        <button className="edit-btn" onClick={() => handleEdit(item)}>Edit</button>
                        <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="grand-total-row">
                <td colSpan="3" style={{ textAlign: "right", paddingRight: "32px", color: "var(--text-secondary)" }}>Total Inventory Valuation:</td>
                <td colSpan="4">PKR {grandTotalValue.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingItem ? "Update Fertilizer Entry" : "Record New Fertilizer Stock"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Product Name</label><input className="form-input" placeholder="e.g. Urea 50kg" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="grid-2-col">
                <div className="form-group"><label>Initial Quantity</label><input className="form-input" type="number" placeholder="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} /></div>
                <div className="form-group"><label>Rate (PKR)</label><input className="form-input" type="number" placeholder="0" value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: e.target.value })} /></div>
              </div>
              <div className="grid-2-col">
                <div className="form-group"><label>Supplier Source</label><input className="form-input" placeholder="Enter supplier name" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} /></div>
                <div className="form-group"><label>Supplier Cell No</label><input className="form-input" placeholder="Enter cell no" value={formData.cellNo} onChange={(e) => setFormData({ ...formData, cellNo: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Expiry Date</label><input className="form-input" type="date" value={formData.expiry} onChange={(e) => setFormData({ ...formData, expiry: e.target.value })} /></div>
              <div className="modal-footer">
                <button type="submit" className="save-btn">{editingItem ? "Update Stock" : "Save Entry"}</button>
                <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fertilizers;
