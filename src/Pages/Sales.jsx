import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";

import { db } from "../firebase";
import { generateInvoice } from "./Invoice";
import { logActivity } from "../utils/logger";
import "./Sales.css";

const Sales = () => {

  const shopId = "mainshop";

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const emptyForm = {
    customerName: "",
    phone: "",
    itemName: "",
    quantity: "",
    pricePerItem: "",
    paidAmount: ""
  };

  const [formData, setFormData] = useState(emptyForm);

  /* ================= FETCH DATA ================= */

  useEffect(() => {

    const salesCollection =
      collection(db, "shops", shopId, "sales");

    const q =
      query(salesCollection, orderBy("createdAt", "desc"));

    const unsubscribe =
      onSnapshot(q, (snapshot) => {

        const list =
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

        setSales(list);

      });

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
      unsubscribe();
      unsubInv();
      unsubSeeds();
      unsubFerts();
    };

  }, [shopId]);

  /* ================= CALCULATIONS ================= */

  const quantity =
    Number(formData.quantity) || 0;

  const price =
    Number(formData.pricePerItem) || 0;

  const totalAmount =
    quantity * price;

  const paidAmount =
    Number(formData.paidAmount) || 0;

  const remainingBalance =
    Math.max(totalAmount - paidAmount, 0);

  const grandTotal =
    useMemo(() => {

      return sales.reduce(
        (sum, sale) =>
          sum + Number(sale.totalAmount || 0),
        0
      );

    }, [sales]);

  /* ================= INPUT CHANGE ================= */

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };

  /* ================= ADD / UPDATE ================= */

  const handleSave = async () => {

    try {

      if (!formData.customerName ||
          !formData.itemName) {

        alert("Fill all fields");
        return;
      }

      const data = {

        customerName: formData.customerName,
        phone: formData.phone || "-",
        itemName: formData.itemName,
        quantity: quantity,
        pricePerItem: price,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        remainingBalance: remainingBalance,
        updatedAt: serverTimestamp()

      };

      if (editId) {

        const docRef =
          doc(db, "shops", shopId, "sales", editId);

        await updateDoc(docRef, data);
        await logActivity("Updated", "Sales", `Updated sale for ${formData.customerName}: ${quantity}x ${formData.itemName}`);

        alert("Updated successfully");

      } else {

        await addDoc(
          collection(db, "shops", shopId, "sales"),
          {
            ...data,
            createdAt: serverTimestamp()
          }
        );

        // If there is a remaining balance, log it in Due Bills automatically
        if (remainingBalance > 0) {
          await addDoc(
            collection(db, "shops", shopId, "dueBills"),
            {
              customerName: formData.customerName,
              phone: formData.phone || "-",
              items: `${quantity}x ${formData.itemName}`,
              totalAmount: totalAmount,
              paidAmount: paidAmount,
              remainingAmount: remainingBalance,
              status: paidAmount > 0 ? "partial" : "unpaid",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }
          );
        }

        await logActivity("Added", "Sales", `New sale added: ${quantity}x ${formData.itemName} to ${formData.customerName} (Total: ${totalAmount})`);

        alert("Added successfully");

      }

      setFormData(emptyForm);
      setEditId(null);
      setShowModal(false);

    }
    catch (error) {

      console.error(error);
      alert(error.message);

    }

  };

  /* ================= EDIT ================= */

  const handleEdit = (sale) => {

    setEditId(sale.id);

    setFormData({
      customerName: sale.customerName,
      phone: sale.phone || "",
      itemName: sale.itemName,
      quantity: sale.quantity,
      pricePerItem: sale.pricePerItem,
      paidAmount: sale.paidAmount || ""
    });

    setShowModal(true);

  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {

    try {

      const confirmDelete =
        window.confirm("Delete this sale?");

      if (!confirmDelete) return;

      const docRef =
        doc(db, "shops", shopId, "sales", id);

      await deleteDoc(docRef);
      await logActivity("Deleted", "Sales", `Deleted a sales record`);

      alert("Deleted successfully");

    }
    catch (error) {

      console.error(error);
      alert(error.message);

    }

  };

  /* ================= FILTER ================= */

  const filteredSales =
    sales.filter((sale) =>
      sale.customerName
        ?.toLowerCase()
        .includes(search.toLowerCase())
      ||
      sale.itemName
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );

  /* ================= UI ================= */

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>Sales Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowModal(true);
            setEditId(null);
            setFormData(emptyForm);
          }}
        >
          Add New Sale
        </button>
      </div>

      <div className="search-container">
        <input
          className="search-input"
          placeholder="Search by customer or item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => (
              <tr key={sale.id}>
                <td data-label="Customer" style={{ fontWeight: 500 }}>{sale.customerName}</td>
                <td data-label="Item">{sale.itemName}</td>
                <td data-label="Qty">{sale.quantity}</td>
                <td data-label="Price">PKR {sale.pricePerItem?.toLocaleString()}</td>
                <td data-label="Total" style={{ fontWeight: 600 }}>PKR {sale.totalAmount?.toLocaleString()}</td>
                <td data-label="Action">
                  <div className="action-btns">
                    <button className="btn print-btn" onClick={() => generateInvoice(sale)}>Print</button>
                    <button className="btn edit-btn" onClick={() => handleEdit(sale)}>Edit</button>
                    <button className="btn delete-btn" onClick={() => handleDelete(sale.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan="4">Total Revenue</td>
              <td colSpan="2" style={{ color: "var(--accent-secondary)" }}>PKR {grandTotal.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editId ? "Edit Sale" : "New Sale Entry"}</h3>
            
            <div className="grid-2-col">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  className="form-input"
                  name="customerName"
                  placeholder="Enter customer name"
                  value={formData.customerName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Cell No / Phone</label>
                <input
                  className="form-input"
                  name="phone"
                  placeholder="Enter cell number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Item Name</label>
              <select
                className="form-input"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
              >
                <option value="">-- Select Product --</option>
                {[...new Set(products.map(p => p.name))].sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label>Quantity</label>
                <input
                  className="form-input"
                  name="quantity"
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Price Per Item</label>
                <input
                  className="form-input"
                  name="pricePerItem"
                  type="number"
                  placeholder="0.00"
                  value={formData.pricePerItem}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid-2-col" style={{ marginTop: "16px" }}>
              <div className="form-group">
                <label style={{ color: "var(--accent-primary)", fontWeight: 600 }}>Amount Paid</label>
                <input
                  className="form-input"
                  name="paidAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.paidAmount}
                  onChange={handleChange}
                  style={{ borderColor: "var(--accent-primary)" }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: "#ef4444", fontWeight: 600 }}>Remaining Balance</label>
                <input
                  className="form-input"
                  type="number"
                  disabled
                  value={remainingBalance}
                  style={{ background: "#fef2f2", color: "#ef4444", fontWeight: "bold" }}
                />
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "24px", marginTop: "16px", border: "1px dashed var(--border-color)" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Total Bill Amount:</p>
              <h4 style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>PKR {totalAmount.toLocaleString()}</h4>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                {editId ? "Update Sale" : "Save Entry"}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default Sales;
