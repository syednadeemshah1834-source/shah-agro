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
    <div className="page-wrapper">
      <div className="page-header">
        <h2>Due Bills Management</h2>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          Add Due Bill
        </button>
      </div>

      <div className="search-container">
        <input
          className="search-input"
          placeholder="Search by customer name or cell number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button className="search-btn" onClick={handleSearchClick}>
          Search
        </button>
      </div>

      <div className="outstanding-summary">
        <h3>Total Outstanding Receivables</h3>
        <h2>PKR {formatCurrency(totalOutstanding)}</h2>
      </div>

      <div className="table-wrapper">
        <div className="table-container">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Loading receivables data...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Cell No</th>
                <th>Total Bill</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.id}>
                  <td data-label="Customer" style={{ fontWeight: 600 }}>{bill.customerName}</td>
                  <td data-label="Cell No">{bill.phone}</td>
                  <td data-label="Total Bill" style={{ fontWeight: 500 }}>PKR {formatCurrency(bill.totalAmount)}</td>
                  <td data-label="Paid" style={{ color: "var(--accent-primary)" }}>PKR {formatCurrency(bill.paidAmount)}</td>
                  <td data-label="Remaining" style={{ color: "#ef4444", fontWeight: 700 }}>PKR {formatCurrency(bill.remainingAmount)}</td>
                  <td data-label="Status">
                    <span className={`status-badge status-${bill.status}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td data-label="Action">
                    <div className="action-btns">
                      <button className="edit-btn" onClick={() => handleEdit(bill)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete(bill.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editId ? "Update Bill Details" : "New Due Bill Entry"}</h3>

            <input
              className="form-input"
              placeholder="Customer Full Name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
            <input
              className="form-input"
              placeholder="Phone Number / Cell"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <input
              className="form-input"
              placeholder="Items / Description"
              value={formData.items}
              onChange={(e) => setFormData({ ...formData, items: e.target.value })}
            />

            <div className="grid-2-col">
              <div className="form-group">
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>Total Bill Amount</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="0.00"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>Paid Currently</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="0.00"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-buttons">
              <button className="save-btn" onClick={handleAddOrUpdate}>
                {editId ? "Update Bill" : "Save Record"}
              </button>
              <button className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DueBills;
