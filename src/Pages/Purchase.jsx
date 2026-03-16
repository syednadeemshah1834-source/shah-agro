import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import "./Purchase.css";

const Purchase = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const shopId = user?.shopId || "mainshop";

  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  const [formData, setFormData] = useState({
    supplierName: "",
    cellNo: "",
    itemName: "",
    quantity: "",
    price: "",
  });

  const purchasesRef = collection(db, "shops", shopId, "purchases");

  // Fetch purchases with offline support
  useEffect(() => {
    const q = query(purchasesRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPurchases(data);
        setIsOffline(snap.metadata.fromCache);
      }
    );

    // Fetch Master Products
    const unsubInv = onSnapshot(collection(db, "shops", shopId, "inventory"), (snap) => {
      const invItems = snap.docs.map(d => ({ id: d.id, name: d.data().name, source: "inventory" }));
      setProducts(prev => [...prev.filter(p => p.source !== "inventory"), ...invItems]);
    });

    const unsubSeeds = onSnapshot(collection(db, "shops", shopId, "seeds"), (snap) => {
      const seedItems = snap.docs.map(d => ({ id: d.id, name: d.data().name, source: "seeds" }));
      setProducts(prev => [...prev.filter(p => p.source !== "seeds"), ...seedItems]);
    });

    const unsubFerts = onSnapshot(collection(db, "shops", shopId, "fertilizers"), (snap) => {
      const fertItems = snap.docs.map(d => ({ id: d.id, name: d.data().name, source: "fertilizers" }));
      setProducts(prev => [...prev.filter(p => p.source !== "fertilizers"), ...fertItems]);
    });

    return () => {
      unsub();
      unsubInv();
      unsubSeeds();
      unsubFerts();
    };
  }, [purchasesRef, shopId]);

  // Listen to online/offline status
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const handleSave = async () => {
    const { supplierName, cellNo, itemName, quantity, price } = formData;
    if (!supplierName || !cellNo || !itemName || !quantity || !price) {
      alert("Please fill all fields");
      return;
    }

    const qty = Number(quantity);
    const unitPrice = Number(price);
    const total = qty * unitPrice;

    const payload = {
      supplierName,
      cellNo,
      itemName,
      quantity: qty,
      price: unitPrice,
      total,
      createdAt: serverTimestamp(),
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "shops", shopId, "purchases", editId), payload);
      } else {
        await addDoc(purchasesRef, payload);
      }
      setPopupOpen(false);
      setEditId(null);
      setFormData({
        supplierName: "",
        cellNo: "",
        itemName: "",
        quantity: "",
        price: "",
      });
    } catch (err) {
      console.error("Error saving purchase:", err);
      alert("Offline: Purchase will sync automatically when back online.");
    }
  };

  const handleEdit = (p) => {
    setFormData({
      supplierName: p.supplierName,
      cellNo: p.cellNo,
      itemName: p.itemName,
      quantity: p.quantity,
      price: p.price,
    });
    setEditId(p.id);
    setPopupOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this purchase?")) return;
    try {
      await deleteDoc(doc(db, "shops", shopId, "purchases", id));
    } catch (err) {
      console.error("Error deleting purchase:", err);
      alert("Offline: Deletion will sync automatically when back online.");
    }
  };

  const filteredPurchases = purchases.filter(
    (p) =>
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cellNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const overallTotal = filteredPurchases.reduce((acc, p) => acc + p.total, 0);
  const liveTotal = Number(formData.quantity || 0) * Number(formData.price || 0);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Purchase Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setPopupOpen(true);
            setEditId(null);
          }}
        >
          New Purchase
        </button>
      </div>

      {isOffline && (
        <div style={{ background: "#fef2f2", color: "#dc2626", padding: "12px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, marginBottom: "24px", border: "1px solid #fee2e2" }}>
          ⚠️ You are offline — showing cached data
        </div>
      )}

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by supplier, item, or cell..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="summary-card">
        Total Purchase Investment
        <span>PKR {overallTotal.toLocaleString()}</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Cell No</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.supplierName}</td>
                <td>{p.cellNo}</td>
                <td>{p.itemName}</td>
                <td>{p.quantity}</td>
                <td>PKR {p.price?.toLocaleString()}</td>
                <td className="highlight">PKR {p.total.toLocaleString()}</td>
                <td>
                  <div className="action-btns">
                    <button className="edit-btn" onClick={() => handleEdit(p)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {popupOpen && (
        <div className="popup-overlay">
          <div className="popup">
            <div className="popup-header">
              <h2>{editId ? "Update Purchase" : "Log New Purchase"}</h2>
              <span className="close-btn" onClick={() => setPopupOpen(false)}>✕</span>
            </div>

            <div className="popup-body">
              <input
                className="form-input"
                placeholder="Supplier Name"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              />
              <input
                className="form-input"
                placeholder="Supplier Cell No"
                value={formData.cellNo}
                onChange={(e) => setFormData({ ...formData, cellNo: e.target.value })}
              />
              <select
                className="form-input"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              >
                <option value="">-- Select Product --</option>
                {[...new Set(products.map(p => p.name))].sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              
              <div className="row">
                <input
                  className="form-input"
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
                <input
                  className="form-input"
                  type="number"
                  placeholder="Price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="live-total-box">
                <p>Calculated Total:</p>
                <h4>PKR {liveTotal.toLocaleString()}</h4>
              </div>

              <div className="modal-footer" style={{ marginTop: 0 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                  {editId ? "Update Purchase" : "Save Purchase"}
                </button>
                <button className="btn btn-secondary" onClick={() => setPopupOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchase;
