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
    expiry: "",
  });

  useEffect(() => {
    const invRef = collection(db, "shops", shopId, "inventory");
    const salesRef = collection(db, "shops", shopId, "sales");

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

    return () => {
      unsubInventory();
      unsubSales();
    };
  }, []);

  /* ================= LIVE STOCK ================= */
  const liveInventory = useMemo(() => {
    const map = {};
    inventoryItems.forEach((item) => {
      if (!map[item.name]) map[item.name] = 0;
      map[item.name] += Number(item.quantity);
    });

    sales.forEach((sale) => {
      if (!map[sale.itemName]) map[sale.itemName] = 0;
      map[sale.itemName] -= Number(sale.quantity);
    });

    return map;
  }, [inventoryItems, sales]);

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
      expiry: formData.expiry,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "shops", shopId, "inventory", editId), payload);
      } else {
        await addDoc(collection(db, "shops", shopId, "inventory"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
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
    <div className="inventory-wrapper">
      <h2 className="page-title">Inventory Management</h2>

      <div className="top-bar">
        <input
          className="search-input"
          placeholder="Search item..."
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
        <button
          className="add-btn"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Item
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Rate</th>
                  <th>Total Value</th>
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
                      <td>{item.name}</td>
                      <td>{item.type}</td>
                      <td>{liveQty}</td>
                      <td>Rs {formatCurrency(item.rate)}</td>
                      <td>Rs {formatCurrency(liveQty * item.rate)}</td>
                      <td>{item.supplier}</td>
                      <td>{item.expiry}</td>
                      <td className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* TOTAL INVENTORY VALUE AT BOTTOM */}
            <div className="total-inventory">
              <h3>Total Inventory Value:</h3>
              <h2>Rs {formatCurrency(totalInventoryValue)}</h2>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editId ? "Update Item" : "Add Item"}</h3>
            <div className="form-grid">
              <input
                placeholder="Item Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <input
                placeholder="Category"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              />
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
                placeholder="Rate"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: e.target.value })
                }
              />
              <input
                placeholder="Supplier"
                value={formData.supplier}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
              />
              <input
                type="date"
                value={formData.expiry}
                onChange={(e) =>
                  setFormData({ ...formData, expiry: e.target.value })
                }
              />
            </div>
            <div className="modal-buttons">
              <button className="save-btn" onClick={handleAddOrUpdate}>
                {editId ? "Update" : "Add"}
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
