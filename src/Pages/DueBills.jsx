import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import "./DueBills.css";

const DueBills = () => {
  const shopId = "mainshop";

  const [dueBills, setDueBills] = useState([]);
  const [searchInput, setSearchInput] = useState(""); // input box value
  const [searchTerm, setSearchTerm] = useState("");   // applied filter
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    items: "",
    totalAmount: "",
    paidAmount: "",
  });

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const ref = collection(db, "shops", shopId, "dueBills");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDueBills(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ================= ADD / UPDATE ================= */
  const handleAddOrUpdate = async () => {
    if (!formData.customerName.trim())
      return alert("Customer name required");

    const total = Number(formData.totalAmount);
    const paid = Number(formData.paidAmount || 0);
    const remaining = Math.max(total - paid, 0);

    const payload = {
      customerName: formData.customerName,
      phone: formData.phone,
      items: formData.items,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      status:
        remaining === 0
          ? "paid"
          : paid > 0
          ? "partial"
          : "unpaid",
      updatedAt: serverTimestamp(),
    };

    if (editId) {
      await updateDoc(
        doc(db, "shops", shopId, "dueBills", editId),
        payload
      );
    } else {
      await addDoc(collection(db, "shops", shopId, "dueBills"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      phone: "",
      items: "",
      totalAmount: "",
      paidAmount: "",
    });
    setEditId(null);
    setModalOpen(false);
  };

  /* ================= ACTIONS ================= */
  const handleEdit = (bill) => {
    setFormData(bill);
    setEditId(bill.id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bill?")) return;
    await deleteDoc(doc(db, "shops", shopId, "dueBills", id));
  };

  /* ================= SEARCH FILTER ================= */
  const filteredBills = dueBills.filter((bill) =>
    bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat().format(amount);

  const totalOutstanding = filteredBills.reduce(
    (sum, bill) => sum + (bill.remainingAmount || 0),
    0
  );

  /* ================= SEARCH BUTTON ================= */
  const handleSearchClick = () => {
    setSearchTerm(searchInput);
  };

  return (
    <div className="due-wrapper">

      {/* HEADER */}
      <div className="header-bar">
        <h2>Due Bills Management</h2>
        <button className="add-btn" onClick={() => setModalOpen(true)}>
          + Add Due Bill
        </button>
      </div>

      {/* SEARCH */}
      <div className="search-box">
        <input
          placeholder="Search by customer name or cell number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button className="search-btn" onClick={handleSearchClick}>
          Search
        </button>
      </div>

      {/* TOTAL OUTSTANDING */}
      <h3 className="outstanding">
        Total Outstanding: Rs {formatCurrency(totalOutstanding)}
      </h3>

      {/* MODAL */}
      {modalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editId ? "Edit Due Bill" : "Add Due Bill"}</h3>

            {["customerName", "phone", "items"].map((field) => (
              <input
                key={field}
                placeholder={field.replace(/([A-Z])/g, " $1")}
                value={formData[field]}
                onChange={(e) =>
                  setFormData({ ...formData, [field]: e.target.value })
                }
              />
            ))}

            <input
              type="number"
              placeholder="Total Amount"
              value={formData.totalAmount}
              onChange={(e) =>
                setFormData({ ...formData, totalAmount: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Paid Amount"
              value={formData.paidAmount}
              onChange={(e) =>
                setFormData({ ...formData, paidAmount: e.target.value })
              }
            />

            <div className="modal-buttons">
              <button onClick={handleAddOrUpdate}>
                {editId ? "Update" : "Add"}
              </button>
              <button className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="due-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Cell</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((bill) => (
              <tr key={bill.id}>
                <td>{bill.customerName}</td>
                <td>{bill.phone}</td>
                <td>Rs {formatCurrency(bill.totalAmount)}</td>
                <td>Rs {formatCurrency(bill.paidAmount)}</td>
                <td>Rs {formatCurrency(bill.remainingAmount)}</td>
                <td className={`status ${bill.status}`}>
                  {bill.status}
                </td>
                <td className="actions">
                  <button onClick={() => handleEdit(bill)}>Edit</button>
                  <button onClick={() => handleDelete(bill.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DueBills;
