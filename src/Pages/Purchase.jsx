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

    return () => unsub();
  }, [purchasesRef]);

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
    <div className="purchase-page">
      {/* Header */}
      <div className="purchase-header">
        <h1>Purchase Management</h1>
        <button
          className="add-btn"
          onClick={() => {
            setPopupOpen(true);
            setEditId(null);
          }}
        >
          + Add Purchase
        </button>
      </div>

      {/* Offline status */}
      {isOffline && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          ⚠️ You are offline — showing cached data
        </p>
      )}

      {/* Search */}
      <div className="search-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search by Supplier, Item, or Cell..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="search-btn">🔍 Search</button>
      </div>

      {/* Summary */}
      <div className="summary-card">
        Total Purchase Value
        <span>PKR {overallTotal.toLocaleString()}</span>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Cell</th>
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
                <td>{p.supplierName}</td>
                <td>{p.cellNo}</td>
                <td>{p.itemName}</td>
                <td>{p.quantity}</td>
                <td>PKR {p.price}</td>
                <td className="highlight">PKR {p.total.toLocaleString()}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(p)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Popup */}
      {popupOpen && (
        <div className="popup-overlay">
          <div className="popup">
            <div className="popup-header">
              <h2>{editId ? "Edit Purchase" : "Add Purchase"}</h2>
              <span className="close-btn" onClick={() => setPopupOpen(false)}>
                ✕
              </span>
            </div>

            <div className="popup-body">
              <input
                placeholder="Supplier Name"
                value={formData.supplierName}
                onChange={(e) =>
                  setFormData({ ...formData, supplierName: e.target.value })
                }
              />
              <input
                placeholder="Supplier Cell No"
                value={formData.cellNo}
                onChange={(e) =>
                  setFormData({ ...formData, cellNo: e.target.value })
                }
              />
              <input
                placeholder="Item Name"
                value={formData.itemName}
                onChange={(e) =>
                  setFormData({ ...formData, itemName: e.target.value })
                }
              />
              <div className="row">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
              <div className="live-total">
                Live Total: PKR {liveTotal.toLocaleString()}
              </div>
              <button className="professional-btn" onClick={handleSave}>
                {editId ? "Update Purchase" : "Save Purchase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchase;
