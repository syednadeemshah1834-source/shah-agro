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
    <div className="supplier-container">
      <div className="top-bar">
        <h2>Supplier Management</h2>
        <button className="add-btn" onClick={() => openPopup()}>
          + Add Supplier
        </button>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="supplier-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Remaining</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((sup) => (
              <tr key={sup.id}>
                <td>{sup.supplierName}</td>
                <td>{sup.contact}</td>
                <td>{sup.itemName}</td>
                <td>{sup.quantity}</td>
                <td>Rs {sup.totalPrice}</td>
                <td>Rs {sup.paidAmount}</td>
                <td className={sup.remainingBalance > 0 ? "red" : "green"}>
                  Rs {sup.remainingBalance}
                </td>
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => openPopup(sup)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(sup.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP MODAL */}
      {showPopup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editId ? "Update Supplier" : "Add Supplier"}</h3>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Supplier Name"
                value={form.supplierName}
                onChange={(e) =>
                  setForm({ ...form, supplierName: e.target.value })
                }
              />

              <input
                type="text"
                placeholder="Contact"
                value={form.contact}
                onChange={(e) =>
                  setForm({ ...form, contact: e.target.value })
                }
              />

              <input
                type="text"
                placeholder="Item Name"
                value={form.itemName}
                onChange={(e) =>
                  setForm({ ...form, itemName: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Price Per Item"
                value={form.pricePerItem}
                onChange={(e) =>
                  setForm({ ...form, pricePerItem: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Paid Amount"
                value={form.paidAmount}
                onChange={(e) =>
                  setForm({ ...form, paidAmount: e.target.value })
                }
              />

              <div className="calculation-box">
                <p>Total: Rs {totalPrice}</p>
                <p>Remaining: Rs {remainingBalance}</p>
              </div>

              <div className="modal-buttons">
                <button type="submit" className="save-btn">
                  Save
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closePopup}
                >
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
