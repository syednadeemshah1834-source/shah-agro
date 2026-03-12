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
import "./Sales.css";

const Sales = () => {

  const shopId = "mainshop";

  const [sales, setSales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const emptyForm = {
    customerName: "",
    itemName: "",
    quantity: "",
    pricePerItem: ""
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

    return () => unsubscribe();

  }, [shopId]);

  /* ================= CALCULATIONS ================= */

  const quantity =
    Number(formData.quantity) || 0;

  const price =
    Number(formData.pricePerItem) || 0;

  const totalAmount =
    quantity * price;

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
        itemName: formData.itemName,
        quantity: quantity,
        pricePerItem: price,
        totalAmount: totalAmount,
        updatedAt: serverTimestamp()

      };

      if (editId) {

        const docRef =
          doc(db, "shops", shopId, "sales", editId);

        await updateDoc(docRef, data);

        alert("Updated successfully");

      } else {

        await addDoc(
          collection(db, "shops", shopId, "sales"),
          {
            ...data,
            createdAt: serverTimestamp()
          }
        );

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
      itemName: sale.itemName,
      quantity: sale.quantity,
      pricePerItem: sale.pricePerItem
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

      <h2>Sales Management</h2>

      <button
        className="add-btn"
        onClick={() => {
          setShowModal(true);
          setEditId(null);
          setFormData(emptyForm);
        }}
      >
        + Add Sale
      </button>

      <input
        placeholder="Search"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

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

              <td>{sale.customerName}</td>

              <td>{sale.itemName}</td>

              <td>{sale.quantity}</td>

              <td>{sale.pricePerItem}</td>

              <td>{sale.totalAmount}</td>

              <td>

                <button
                  onClick={() =>
                    handleEdit(sale)
                  }
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    handleDelete(sale.id)
                  }
                >
                  Delete
                </button>

              </td>

            </tr>

          ))}

          <tr>

            <td colSpan="4">
              Total Sales
            </td>

            <td>{grandTotal}</td>

          </tr>

        </tbody>

      </table>

      {/* MODAL */}

      {showModal && (

        <div className="modal-overlay">

          <div className="modal">

            <input
              name="customerName"
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={handleChange}
            />

            <input
              name="itemName"
              placeholder="Item Name"
              value={formData.itemName}
              onChange={handleChange}
            />

            <input
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
            />

            <input
              name="pricePerItem"
              placeholder="Price"
              value={formData.pricePerItem}
              onChange={handleChange}
            />

            <p>Total: {totalAmount}</p>

            <button onClick={handleSave}>
              {editId ? "Update" : "Save"}
            </button>

            <button
              onClick={() =>
                setShowModal(false)
              }
            >
              Cancel
            </button>

          </div>

        </div>

      )}

    </div>

  );

};

export default Sales;
