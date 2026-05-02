import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import "./Inventory.css";

const Inventory = () => {
  const shopId = "mainshop";

  const [inventoryItems, setInventoryItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    quantity: "",
    rate: "",
    supplier: "",
    cellNo: "",
    expiry: "",
  });

  useEffect(() => {
    const invRef = collection(db, "shops", shopId, "inventory");
    const salesRef = collection(db, "shops", shopId, "sales");
    const purchasesRef = collection(db, "shops", shopId, "purchases");

    const unsubInventory = onSnapshot(invRef, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInventoryItems(items);
      setLoading(false);
    });

    const unsubSales = onSnapshot(salesRef, (snapshot) => {
      const salesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSales(salesData);
    });

    const unsubPurchases = onSnapshot(purchasesRef, (snapshot) => {
      setPurchases(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubInventory();
      unsubSales();
      unsubPurchases();
    };
  }, []);

  /* ================= LIVE STOCK ================= */
  const liveInventory = useMemo(() => {
    const map = {};
    inventoryItems.forEach((item) => {
      if (!map[item.name]) map[item.name] = 0;
      map[item.name] += Number(item.quantity);
    });

    purchases.forEach((p) => {
      if (!map[p.itemName]) map[p.itemName] = 0;
      map[p.itemName] += Number(p.quantity);
    });

    sales.forEach((sale) => {
      if (!map[sale.itemName]) map[sale.itemName] = 0;
      map[sale.itemName] -= Number(sale.quantity);
    });

    return map;
  }, [inventoryItems, sales, purchases]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchSearch = item.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchCategory = !categoryFilter || item.type === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [inventoryItems, searchTerm, categoryFilter]);

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      quantity: "",
      rate: "",
      supplier: "",
      cellNo: "",
      expiry: "",
    });
    setEditId(null);
  };

  const handleAddOrUpdate = async () => {
    if (!formData.name.trim()) return alert("Item name required");

    const payload = {
      name: formData.name,
      type: formData.type,
      quantity: Number(formData.quantity),
      rate: Number(formData.rate),
      supplier: formData.supplier,
      cellNo: formData.cellNo,
      expiry: formData.expiry,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "shops", shopId, "inventory", editId), payload);
      } else {
        await addDoc(collection(db, "shops", shopId, "inventory"), {
          ...payload,
          quantity: 0, // Master holds 0
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
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("Error saving item");
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name || "",
      type: item.type || "",
      quantity: item.quantity || "",
      rate: item.rate || "",
      supplier: item.supplier || "",
      cellNo: item.cellNo || "",
      expiry: item.expiry || "",
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this item?")) return;
    await deleteDoc(doc(db, "shops", shopId, "inventory", id));
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-PK").format(value || 0);

  /* ================= TOTAL INVENTORY VALUE ================= */
  const totalInventoryValue = Object.entries(liveInventory).reduce(
    (sum, [name, qty]) => {
      const item = inventoryItems.find((i) => i.name === name);
      return sum + (item?.rate || 0) * qty;
    },
    0
  );

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">Inventory Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Add New Item
        </button>
      </div>

      <div className="top-bar">
        <input
          className="search-input"
          placeholder="Quick search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="category-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {[...new Set(inventoryItems.map((i) => i.type))]
            .filter(Boolean)
            .map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Loading inventory data...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>In Stock</th>
                  <th>Unit Rate</th>
                  <th>Stock Value</th>
                  <th>Supplier</th>
                  <th>Expiry</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const liveQty = liveInventory[item.name] || 0;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>
                        <span style={{ padding: "4px 10px", borderRadius: "20px", background: "#f1f5f9", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>
                          {item.type || "General"}
                        </span>
                      </td>
                      <td style={{ color: liveQty < 5 ? "#ef4444" : "inherit", fontWeight: liveQty < 5 ? 700 : 500 }}>
                        {liveQty}
                      </td>
                      <td>PKR {formatCurrency(item.rate)}</td>
                      <td style={{ fontWeight: 600 }}>PKR {formatCurrency(liveQty * item.rate)}</td>
                      <td>{item.supplier || "N/A"}</td>
                      <td>{item.expiry || "N/A"}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => handleEdit(item)}>Edit</button>
                          <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="total-inventory">
              <h3>Consolidated Inventory Valuation</h3>
              <h2>PKR {formatCurrency(totalInventoryValue)}</h2>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editId ? "Edit Inventory Item" : "New Inventory Item"}</h3>
            <div className="form-grid">
              <input
                className="form-input"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                className="form-input"
                placeholder="Category (e.g., Seeds, Fertilizers)"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
              <div className="grid-2-col">
                <input
                  className="form-input"
                  type="number"
                  placeholder="Initial Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
                <input
                  className="form-input"
                  type="number"
                  placeholder="Unit Rate (PKR)"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                />
              </div>
              <div className="grid-2-col">
                <input
                  className="form-input"
                  placeholder="Supplier Company"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
                <input
                  className="form-input"
                  placeholder="Supplier Cell No"
                  value={formData.cellNo}
                  onChange={(e) => setFormData({ ...formData, cellNo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>Expiry Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={formData.expiry}
                  onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-buttons">
              <button className="save-btn" onClick={handleAddOrUpdate}>
                {editId ? "Update Item" : "Add to Inventory"}
              </button>
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
