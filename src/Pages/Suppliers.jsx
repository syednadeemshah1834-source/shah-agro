import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import "./Suppliers.css";

const Suppliers = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const shopId = user?.shopId || "mainshop";

  const [suppliers, setSuppliers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    supplierName: "",
    contact: "",
    itemName: "",
    quantity: "",
    pricePerItem: "",
    paidAmount: "",
  });

  const totalPrice =
    Number(form.quantity || 0) * Number(form.pricePerItem || 0);

  const remainingBalance =
    totalPrice - Number(form.paidAmount || 0);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "shops", shopId, "suppliers"),
      (snapshot) => {
        setSuppliers(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }
    );
    return () => unsub();
  }, [shopId]);

  const openPopup = (supplier = null) => {
    if (supplier) {
      setForm(supplier);
      setEditId(supplier.id);
    } else {
      setForm({
        supplierName: "",
        contact: "",
        itemName: "",
        quantity: "",
        pricePerItem: "",
        paidAmount: "",
      });
      setEditId(null);
    }
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.supplierName || !form.itemName) {
      alert("Please fill required fields");
      return;
    }

    const supplierData = {
      ...form,
      quantity: Number(form.quantity),
      pricePerItem: Number(form.pricePerItem),
      totalPrice,
      paidAmount: Number(form.paidAmount || 0),
      remainingBalance,
      createdAt: serverTimestamp(),
    };

    if (editId) {
      await updateDoc(
        doc(db, "shops", shopId, "suppliers", editId),
        supplierData
      );
    } else {
      await addDoc(
        collection(db, "shops", shopId, "suppliers"),
        supplierData
      );
    }

    closePopup();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "shops", shopId, "suppliers", id));
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>Supplier Management</h2>
        <button className="btn btn-primary" onClick={() => openPopup()}>
          Add New Supplier
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Contact No</th>
              <th>Product/Item</th>
              <th>Qty</th>
              <th>Total Amount</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((sup) => (
              <tr key={sup.id}>
                <td style={{ fontWeight: 600 }}>{sup.supplierName}</td>
                <td>{sup.contact}</td>
                <td>{sup.itemName}</td>
                <td>{sup.quantity}</td>
                <td style={{ fontWeight: 500 }}>PKR {sup.totalPrice?.toLocaleString()}</td>
                <td style={{ color: "var(--accent-primary)", fontWeight: 600 }}>PKR {sup.paidAmount?.toLocaleString()}</td>
                <td className={sup.remainingBalance > 0 ? "red" : "green"}>
                  PKR {sup.remainingBalance?.toLocaleString()}
                </td>
                <td>
                  <div className="action-btns">
                    <button className="edit-btn" onClick={() => openPopup(sup)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(sup.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editId ? "Update Supplier Record" : "New Supplier Entry"}</h3>

            <form onSubmit={handleSubmit}>
              <input
                className="form-input"
                type="text"
                placeholder="Supplier or Company Name"
                value={form.supplierName}
                onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
              />

              <input
                className="form-input"
                type="text"
                placeholder="Contact Phone Number"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />

              <input
                className="form-input"
                type="text"
                placeholder="Item/Product Supplied"
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
                <input
                  className="form-input"
                  type="number"
                  placeholder="Unit Price"
                  value={form.pricePerItem}
                  onChange={(e) => setForm({ ...form, pricePerItem: e.target.value })}
                />
              </div>

              <input
                className="form-input"
                type="number"
                placeholder="Amount Paid Now"
                value={form.paidAmount}
                onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
              />

              <div className="calculation-box">
                <p>
                  <span>Invoice Total:</span>
                  <span>PKR {totalPrice.toLocaleString()}</span>
                </p>
                <p style={{ marginTop: "8px", borderTop: "1px solid #e2e8f0", paddingTop: "8px", color: remainingBalance > 0 ? "#ef4444" : "#22c55e" }}>
                  <span>Outstanding Balance:</span>
                  <span>PKR {remainingBalance.toLocaleString()}</span>
                </p>
              </div>

              <div className="modal-buttons">
                <button type="submit" className="save-btn">
                  {editId ? "Update Record" : "Save Entry"}
                </button>
                <button type="button" className="cancel-btn" onClick={closePopup}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
